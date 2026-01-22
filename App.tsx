import React, { useState, useEffect, useCallback, useRef } from 'react';
import { JobForm } from './components/JobForm';
import { CandidateRanking } from './components/CandidateRanking';
import { CandidateDashboard } from './components/CandidateDashboard';
import { ManualCandidateForm } from './components/ManualCandidateForm';
import { HRLoginForm } from './components/HRLoginForm';
import { extractTextFromFile } from './services/fileService';
import { analyzeResume } from './services/groqService';
import { sendStatusEmail, pingEmailNode } from './services/emailService';
import { cloudDb } from './services/cloudDb';
import { Candidate, ApprovalStatus, UserRole, User, Job } from './types';

const CACHE_KEY = 'hs_v10_';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'online' | 'local' | 'setup_required'>('local');
  const [emailNodeStatus, setEmailNodeStatus] = useState<'connected' | 'error' | 'verifying'>('connected');
  const [systemAlert, setSystemAlert] = useState<{ message: string, suggestion: string, type?: 'error' | 'success' } | null>(null);

  // UI state management
  const [showHRLogin, setShowHRLogin] = useState(false);
  const [showCandidateInput, setShowCandidateInput] = useState(false);
  const [candidateNameInput, setCandidateNameInput] = useState('');
  const [candidateEmailInput, setCandidateEmailInput] = useState('');
  const [candidatePhoneInput, setCandidatePhoneInput] = useState('');
  const [hrJobFilter, setHrJobFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Next round details form state
  const [showNextRoundForm, setShowNextRoundForm] = useState(false);
  const [pendingStatusUpdate, setPendingStatusUpdate] = useState<{ id: string, status: ApprovalStatus } | null>(null);
  const [nextRoundDetails, setNextRoundDetails] = useState({
    type: '',
    date: '',
    time: '',
    mode: '',
    venue: '',
    link: '',
    instructions: ''
  });

  const stateRef = useRef({ jobs, candidates, registeredUsers, currentUser });
  const syncingRef = useRef(false);

  useEffect(() => {
    stateRef.current = { jobs, candidates, registeredUsers, currentUser };
  }, [jobs, candidates, registeredUsers, currentUser]);

  const syncWithCloud = useCallback(async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    try {
      const result = await cloudDb.fetchState();
      if (result.success && result.state) {
        const merged = cloudDb.mergeStates({
          jobs: stateRef.current.jobs,
          candidates: stateRef.current.candidates,
          registeredUsers: stateRef.current.registeredUsers,
          lastUpdated: Date.now()
        }, result.state);

        setJobs(merged.jobs);
        setCandidates(merged.candidates);
        setRegisteredUsers(merged.registeredUsers);
        setSyncStatus('online');

        localStorage.setItem(CACHE_KEY + 'jobs', JSON.stringify(merged.jobs));
        localStorage.setItem(CACHE_KEY + 'candidates', JSON.stringify(merged.candidates));
        localStorage.setItem(CACHE_KEY + 'users', JSON.stringify(merged.registeredUsers));
      } else if (result.error === 'TABLE_MISSING') {
        setSyncStatus('setup_required');
      } else {
        setSyncStatus('local');
      }
    } catch (e) {
      setSyncStatus('local');
    } finally {
      syncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const cJobs = localStorage.getItem(CACHE_KEY + 'jobs');
      const cCandidates = localStorage.getItem(CACHE_KEY + 'candidates');
      const cUsers = localStorage.getItem(CACHE_KEY + 'users');
      const cSession = localStorage.getItem(CACHE_KEY + 'session');

      if (cJobs) setJobs(JSON.parse(cJobs));
      if (cCandidates) setCandidates(JSON.parse(cCandidates));
      if (cUsers) setRegisteredUsers(JSON.parse(cUsers));
      if (cSession) setCurrentUser(JSON.parse(cSession));

      await syncWithCloud();
    };
    init();
  }, [syncWithCloud]);

  const dispatch = useCallback(async (
    newJobs: Job[],
    newCandidates: Candidate[],
    newUsers: User[]
  ) => {
    setJobs(newJobs);
    setCandidates(newCandidates);
    setRegisteredUsers(newUsers);

    localStorage.setItem(CACHE_KEY + 'jobs', JSON.stringify(newJobs));
    localStorage.setItem(CACHE_KEY + 'candidates', JSON.stringify(newCandidates));
    localStorage.setItem(CACHE_KEY + 'users', JSON.stringify(newUsers));

    try {
      const success = await cloudDb.pushState({
        jobs: newJobs,
        candidates: newCandidates,
        registeredUsers: newUsers,
        lastUpdated: Date.now()
      });
      if (success) setSyncStatus('online');
      return success;
    } catch (e) {
      setSyncStatus('local');
      return false;
    }
  }, []);

  const addJob = (job: Job) => dispatch([...jobs, job], candidates, registeredUsers);
  const deleteJob = (id: string) => dispatch(jobs.filter(j => j.id !== id), candidates, registeredUsers);

  const registerNewCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateNameInput.trim() || !candidateEmailInput.trim() || !candidatePhoneInput.trim()) return;
    const newUser: User = {
      id: 'uid-' + Math.random().toString(36).substr(2, 9),
      role: UserRole.CANDIDATE,
      name: candidateNameInput,
      email: candidateEmailInput,
      phone: candidatePhoneInput,
      portalCreated: Date.now(),
      lastActive: Date.now(),
      emailVerified: false
    };
    setCurrentUser(newUser);
    localStorage.setItem(CACHE_KEY + 'session', JSON.stringify(newUser));
    dispatch(jobs, candidates, [...registeredUsers, newUser]);
    setCandidateNameInput(''); setCandidateEmailInput(''); setCandidatePhoneInput('');
    setShowCandidateInput(false);
  };

  const updateUserProfile = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    localStorage.setItem(CACHE_KEY + 'session', JSON.stringify(updatedUser));
    const newUsers = registeredUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
    dispatch(jobs, candidates, newUsers);
  };

  const loginAsExistingUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem(CACHE_KEY + 'session', JSON.stringify(user));
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem(CACHE_KEY + 'session');
    setShowHRLogin(false);
    setHrJobFilter(null);
  };

  const verifyEmailNode = async () => {
    setEmailNodeStatus('verifying');
    setSystemAlert({
      message: "Pinging Node...",
      suggestion: "Verifying Edge Function availability.",
      type: 'success'
    });

    const result = await pingEmailNode();
    console.log('[App] Ping result:', result);

    if (result.success) {
      setEmailNodeStatus('connected');
      setSystemAlert({
        message: "✅ Node Verified",
        suggestion: "Supabase Edge Function is deployed and responding correctly.",
        type: 'success'
      });
      setTimeout(() => setSystemAlert(null), 3000);
    } else {
      setEmailNodeStatus('error');
      setSystemAlert({
        message: "❌ Node Offline",
        suggestion: result.diagnostic || "Run 'supabase functions deploy send-automated-email' and set secrets.",
        type: 'error'
      });
    }
  };

  const sendTestEmail = async () => {
    const testEmail = 'naledushyanth@gmail.com';
    setSystemAlert({
      message: "📧 Sending test email...",
      suggestion: `Sending test email to ${testEmail}`,
      type: 'success'
    });

    try {
      const result = await sendStatusEmail({
        toEmail: testEmail,
        candidateName: 'Test Candidate',
        jobTitle: 'Test Job Position',
        status: ApprovalStatus.APPROVED
      });

      if (result.success) {
        setSystemAlert({
          type: 'success',
          message: `✅ Test email sent to ${testEmail}`,
          suggestion: `Check your inbox and spam folder at ${testEmail}. If you don't receive it within 2 minutes, check SendGrid activity logs.`
        });
        setTimeout(() => setSystemAlert(null), 12000);

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ TEST EMAIL SENT');
        console.log('📧 To:', testEmail);
        console.log('📧 Subject: HireSync Update: Test Job Position - APPROVED');
        console.log('📧 Check inbox and spam folder');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      } else {
        setSystemAlert({
          type: 'error',
          message: `❌ Test email failed: ${result.error}`,
          suggestion: result.diagnostic || 'Check SendGrid configuration'
        });
      }
    } catch (error: any) {
      setSystemAlert({
        type: 'error',
        message: `❌ Test email error: ${error.message}`,
        suggestion: 'Check console for details'
      });
      console.error('[App] Test email error:', error);
    }
  };

  // ============================================================================
  // FIXED: Real-time Email Status Update Logic
  // ============================================================================
  const updateCandidateStatus = async (id: string, status: ApprovalStatus, nextRound?: import('./services/emailService').NextRoundDetails) => {
    const candidate = candidates.find(c => c.id === id);
    if (!candidate) {
      console.error('[App] ❌ Candidate not found:', id);
      return;
    }

    const previousStatus = candidate.status;
    console.log('[App] 📝 Updating candidate status:', {
      id,
      previousStatus,
      newStatus: status,
      candidateName: candidate.name
    });

    // Check if we should send email (status changed to APPROVED or REJECTED)
    const shouldSendEmail = previousStatus !== status &&
      (status === ApprovalStatus.APPROVED || status === ApprovalStatus.REJECTED);

    if (shouldSendEmail) {
      console.log('[App] 📧 Email should be sent, extracting details...');

      // Extract candidate email from multiple sources
      const user = registeredUsers.find(u => u.id === candidate.userId);
      const job = jobs.find(j => j.id === candidate.jobId);

      // Try multiple email sources
      const candidateEmail = user?.email ||
        candidate.analysis?.candidateEmail;

      const candidateName = user?.name ||
        candidate.analysis?.candidateName ||
        candidate.name ||
        'Candidate';

      console.log('[App] 🔍 Email extraction details:', {
        userId: candidate.userId,
        hasUser: !!user,
        userEmail: user?.email,
        analysisEmail: candidate.analysis?.candidateEmail,
        fallbackEmail: candidate.analysis?.email,
        finalEmail: candidateEmail,
        candidateName,
        jobTitle: job?.title
      });

      // Log prominently to console for debugging
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 EMAIL WILL BE SENT TO:', candidateEmail);
      console.log('📧 If you expected a different email, check:');
      console.log('   1. Candidate profile email:', user?.email);
      console.log('   2. Resume extracted email:', candidate.analysis?.candidateEmail);
      console.log('   3. Update candidate profile if needed');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Validate email exists
      if (!candidateEmail) {
        console.error('[App] ❌ No email found for candidate');
        setSystemAlert({
          type: 'error',
          message: '❌ Cannot send email',
          suggestion: 'No email address found for this candidate. Ensure resume analysis extracted email or candidate profile has email set.'
        });

        // Still update status in database
        const updated = candidates.map(c =>
          c.id === id ? { ...c, status, timestamp: Date.now() } : c
        );
        await dispatch(jobs, updated, registeredUsers);
        return;
      }

      // Validate job exists
      if (!job) {
        console.error('[App] ❌ Job not found:', candidate.jobId);
        setSystemAlert({
          type: 'error',
          message: '❌ Cannot send email',
          suggestion: 'Job details not found for this candidate.'
        });

        const updated = candidates.map(c =>
          c.id === id ? { ...c, status, timestamp: Date.now() } : c
        );
        await dispatch(jobs, updated, registeredUsers);
        return;
      }

      // Show sending indicator
      setSystemAlert({
        type: 'success',
        message: '📤 Dispatching email...',
        suggestion: `Sending ${status} notification to ${candidateEmail}`
      });

      console.log('[App] 🚀 Calling sendStatusEmail with:', {
        toEmail: candidateEmail,
        candidateName,
        jobTitle: job.title,
        status
      });

      // Send email FIRST before updating database
      try {
        const result = await sendStatusEmail({
          toEmail: candidateEmail,
          candidateName,
          jobTitle: job.title,
          status,
          nextRound: status === ApprovalStatus.APPROVED ? nextRound : undefined
        });

        console.log('[App] 📬 Email dispatch result:', result);

        if (result.success) {
          setEmailNodeStatus('connected');
          setSystemAlert({
            type: 'success',
            message: `✅ Email delivered to ${candidateEmail}`,
            suggestion: `Check inbox (and spam folder) at ${candidateEmail}. Email sent via SendGrid.`
          });
          setTimeout(() => setSystemAlert(null), 8000);

          // Log success with email address
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
          console.log('✅ EMAIL SENT SUCCESSFULLY');
          console.log('📧 Recipient:', candidateEmail);
          console.log('📧 Subject: HireSync Update:', job.title, '-', status);
          console.log('📧 Check inbox and spam folder at:', candidateEmail);
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        } else {
          setEmailNodeStatus('error');
          setSystemAlert({
            type: 'error',
            message: `❌ Email failed: ${result.error}`,
            suggestion: result.diagnostic || "Check SendGrid configuration and Edge Function deployment."
          });
          console.error('[App] ❌ Email send failed:', result);
        }
      } catch (emailError: any) {
        console.error('[App] ❌ Email exception:', emailError);
        setEmailNodeStatus('error');
        setSystemAlert({
          type: 'error',
          message: `❌ Email exception: ${emailError.message}`,
          suggestion: "Unexpected error sending email. Check console for details."
        });
      }
    } else {
      console.log('[App] ⏭️ Skipping email (no status change or not APPROVED/REJECTED)');
    }

    // Update database AFTER email attempt (or immediately if no email needed)
    console.log('[App] 💾 Updating database with new status...');
    const updated = candidates.map(c =>
      c.id === id ? { ...c, status, timestamp: Date.now() } : c
    );
    await dispatch(jobs, updated, registeredUsers);
    console.log('[App] ✅ Database updated successfully');
  };

  const updateCandidateFeedback = (id: string, type: 'correct' | 'incorrect', feedback: string) => {
    const updated = candidates.map(c => c.id === id ? { ...c, feedbackType: type, feedback, timestamp: Date.now() } : c);
    dispatch(jobs, updated, registeredUsers);
  };

  const handleStatusChangeWithForm = (id: string, status: ApprovalStatus) => {
    if (status === ApprovalStatus.APPROVED) {
      // Show next round form for approved candidates
      setPendingStatusUpdate({ id, status });
      setShowNextRoundForm(true);
      // Reset form
      setNextRoundDetails({
        type: 'Technical Interview',
        date: '',
        time: '',
        mode: 'Online',
        venue: '',
        link: '',
        instructions: ''
      });
    } else {
      // Direct update for rejected (no form needed)
      updateCandidateStatus(id, status);
    }
  };

  const submitNextRoundForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingStatusUpdate) return;

    const nextRound = {
      type: nextRoundDetails.type || 'Interview',
      date: nextRoundDetails.date,
      time: nextRoundDetails.time,
      mode: nextRoundDetails.mode || 'Online',
      venue: nextRoundDetails.venue || undefined,
      link: nextRoundDetails.link || undefined,
      instructions: nextRoundDetails.instructions || undefined
    };

    setShowNextRoundForm(false);
    await updateCandidateStatus(pendingStatusUpdate.id, pendingStatusUpdate.status, nextRound);
    setPendingStatusUpdate(null);
  };

  // Helper function to verify email extraction during resume upload
  const verifyEmailExtraction = (analysis: any, fileName: string) => {
    const extractedEmail = analysis.candidateEmail;
    if (!extractedEmail) {
      console.warn('[App] ⚠️ Resume analysis did not extract email from:', fileName);
      console.warn('[App] 📄 Analysis result:', analysis);
      setSystemAlert({
        type: 'error',
        message: '⚠️ Email not found in resume',
        suggestion: `Could not extract email from ${fileName}. Manually add email to candidate profile, or ensure resume contains a valid email address.`
      });
      setTimeout(() => setSystemAlert(null), 8000);
    } else {
      console.log('[App] ✅ Email extracted from resume:', extractedEmail);
    }
  };

  const handleApply = (newCandidate: Candidate) => {
    const analysis = newCandidate.analysis;

    // Verify email extraction
    if (analysis) {
      verifyEmailExtraction(analysis, newCandidate.fileName);
    }

    let updatedUsers = [...registeredUsers];
    const existingIndex = registeredUsers.findIndex(u => u.id === newCandidate.userId);

    if (existingIndex > -1) {
      updatedUsers[existingIndex] = {
        ...registeredUsers[existingIndex],
        email: registeredUsers[existingIndex].email || analysis?.candidateEmail,
        phone: registeredUsers[existingIndex].phone || analysis?.candidatePhone,
      };
    }

    dispatch(jobs, [...candidates, newCandidate], updatedUsers);
  };

  const filteredCandidates = candidates.filter(c => {
    const matchesJob = !hrJobFilter || c.jobId === hrJobFilter;
    const q = searchQuery.toLowerCase();
    const candidateName = (c.analysis?.candidateName || c.name || c.fileName).toLowerCase();
    const matchesSearch = !searchQuery || candidateName.includes(q);
    return matchesJob && matchesSearch;
  });

  const filteredJobName = hrJobFilter ? jobs.find(j => j.id === hrJobFilter)?.title : null;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="max-w-6xl w-full">
          {showHRLogin && <HRLoginForm onLogin={() => {
            const admin = { id: 'admin-hr', role: UserRole.HR, name: 'HR Admin' };
            setCurrentUser(admin);
            localStorage.setItem(CACHE_KEY + 'session', JSON.stringify(admin));
            setShowHRLogin(false);
          }} onCancel={() => setShowHRLogin(false)} />}

          <div className="text-center mb-16">
            <h1 className="text-8xl font-black text-white tracking-tighter mb-4">HireSync <span className="text-blue-500">AI</span></h1>
            <p className="text-slate-500 text-xl font-medium max-w-2xl mx-auto">Elite recruitment synchronization node.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div onClick={() => setShowHRLogin(true)} className="group bg-slate-900/40 border border-slate-800 p-10 rounded-[48px] cursor-pointer transition-all hover:border-blue-500/50 flex flex-col items-center justify-center min-h-[360px]">
              <div className="h-24 w-24 bg-blue-600/10 rounded-[32px] flex items-center justify-center mb-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <h3 className="text-white text-3xl font-black">HR Console</h3>
            </div>

            {registeredUsers.filter(u => u.role === UserRole.CANDIDATE).map(user => (
              <div key={user.id} onClick={() => loginAsExistingUser(user)} className="group bg-slate-900/40 border border-slate-800 p-10 rounded-[48px] cursor-pointer flex flex-col items-center justify-center min-h-[360px]">
                <div className="h-24 w-24 bg-indigo-600/10 rounded-full flex items-center justify-center mb-8">
                  <span className="text-4xl font-black text-indigo-400">{user.name.charAt(0)}</span>
                </div>
                <h3 className="text-white text-2xl font-black">{user.name}</h3>
                {user.emailVerified && <div className="mt-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">Verified Identity</div>}
              </div>
            ))}

            {!showCandidateInput ? (
              <div onClick={() => setShowCandidateInput(true)} className="group bg-slate-900/10 border-2 border-dashed border-slate-800 p-10 rounded-[48px] cursor-pointer flex flex-col items-center justify-center min-h-[360px]">
                <h3 className="text-slate-500 font-black text-lg">Add Candidate Node</h3>
              </div>
            ) : (
              <div className="bg-white p-10 rounded-[48px] border border-slate-200">
                <form onSubmit={registerNewCandidate} className="space-y-4">
                  <h2 className="text-3xl font-black text-slate-900 mb-2">Sync Profile</h2>
                  <input className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" placeholder="Name" value={candidateNameInput} onChange={e => setCandidateNameInput(e.target.value)} required />
                  <input type="email" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" placeholder="Email" value={candidateEmailInput} onChange={e => setCandidateEmailInput(e.target.value)} required />
                  <input type="tel" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none" placeholder="Phone" value={candidatePhoneInput} onChange={e => setCandidatePhoneInput(e.target.value)} required />
                  <button type="submit" className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl">Connect</button>
                  <button type="button" onClick={() => setShowCandidateInput(false)} className="w-full text-slate-400 text-[10px] font-black py-2">Cancel</button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-32">
      <header className="bg-white/80 backdrop-blur-xl border-b sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-8 h-20 flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-tighter">HireSync <span className="text-blue-600">AI</span></h1>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <span className="block text-sm font-black">{currentUser.name}</span>
              <div className="flex items-center justify-end gap-1">
                <span className="text-[9px] text-slate-400 font-bold uppercase">{syncStatus}</span>
                <div className={`h-2 w-2 rounded-full ${emailNodeStatus === 'connected' ? 'bg-emerald-500' : emailNodeStatus === 'verifying' ? 'bg-blue-500 animate-pulse' : 'bg-red-500 animate-pulse'}`} title={emailNodeStatus}></div>
              </div>
            </div>
            <button onClick={logout} className="h-11 w-11 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-red-500 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7" /></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-8 py-12">
        {currentUser.role === UserRole.HR ? (
          <div className="grid grid-cols-12 gap-10">
            <div className="col-span-12 lg:col-span-4 space-y-10">
              <JobForm jobs={jobs} onAddJob={addJob} onDeleteJob={deleteJob} selectedJobId={hrJobFilter} onSelectJob={(id) => setHrJobFilter(prev => prev === id ? null : id)} />
              <div className="bg-slate-900 text-white p-10 rounded-[48px]">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">System Health</h3>
                  <div className="flex gap-2">
                    <button onClick={verifyEmailNode} disabled={emailNodeStatus === 'verifying'} className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300 disabled:opacity-50">Verify Node</button>
                    <button onClick={sendTestEmail} className="text-[9px] font-black text-emerald-400 uppercase tracking-widest hover:text-emerald-300">Test Email</button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <span className="text-slate-400 text-xs font-bold">Talent Cloud</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${syncStatus === 'online' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{syncStatus}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                    <span className="text-slate-400 text-xs font-bold">Real-time Email</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded ${emailNodeStatus === 'connected' ? 'bg-emerald-500/20 text-emerald-400' : emailNodeStatus === 'verifying' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'}`}>{emailNodeStatus}</span>
                  </div>
                </div>
              </div>
              <ManualCandidateForm jobs={jobs} isProcessing={isProcessing} onManualUpload={async (file, jobId) => {
                setIsProcessing(true);
                try {
                  const text = await extractTextFromFile(file);
                  const analysis = await analyzeResume(jobs.find(j => j.id === jobId)?.description || '', text);
                  handleApply({
                    id: Math.random().toString(36).substr(2, 9),
                    userId: 'manual-' + Math.random().toString(36).substr(2, 9),
                    jobId, name: analysis.candidateName, fileName: file.name, resumeText: text, analysis,
                    status: ApprovalStatus.PENDING, timestamp: Date.now()
                  });
                } finally { setIsProcessing(false); }
              }} />
            </div>
            <div className="col-span-12 lg:col-span-8 space-y-8">
              <input type="text" placeholder="Search talents..." className="w-full p-6 bg-white border border-slate-200 rounded-[32px] font-bold outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              <CandidateRanking candidates={filteredCandidates} jobs={jobs} registeredUsers={registeredUsers} onUpdateStatus={handleStatusChangeWithForm} onUpdateFeedback={updateCandidateFeedback} filterContext={filteredJobName} onClearFilter={() => setHrJobFilter(null)} />
            </div>
          </div>
        ) : (
          <CandidateDashboard user={currentUser} jobs={jobs} allCandidates={candidates} onApply={handleApply} onUpdateProfile={updateUserProfile} />
        )}
      </main>

      {/* Next Round Details Modal */}
      {showNextRoundForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-6" onClick={() => { setShowNextRoundForm(false); setPendingStatusUpdate(null); }}>
          <div className="bg-white rounded-[32px] p-10 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-3xl font-black text-slate-900 mb-6">📅 Next Round Details</h2>
            <p className="text-slate-600 mb-8">Fill in the details for the next round interview/meeting. This information will be sent to the candidate via email.</p>

            <form onSubmit={submitNextRoundForm} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Round Type *</label>
                  <input
                    type="text"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500"
                    placeholder="e.g., Technical Interview"
                    value={nextRoundDetails.type}
                    onChange={(e) => setNextRoundDetails({ ...nextRoundDetails, type: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Mode *</label>
                  <select
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500"
                    value={nextRoundDetails.mode}
                    onChange={(e) => setNextRoundDetails({ ...nextRoundDetails, mode: e.target.value })}
                    required
                  >
                    <option value="Online">Online</option>
                    <option value="In-Person">In-Person</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Date *</label>
                  <input
                    type="date"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500"
                    value={nextRoundDetails.date}
                    onChange={(e) => setNextRoundDetails({ ...nextRoundDetails, date: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Time *</label>
                  <input
                    type="time"
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500"
                    value={nextRoundDetails.time}
                    onChange={(e) => setNextRoundDetails({ ...nextRoundDetails, time: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Venue / Location</label>
                <input
                  type="text"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500"
                  placeholder="e.g., Office Address, Zoom Link, Google Meet"
                  value={nextRoundDetails.venue}
                  onChange={(e) => setNextRoundDetails({ ...nextRoundDetails, venue: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Meeting Link (if online)</label>
                <input
                  type="url"
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500"
                  placeholder="https://zoom.us/j/..."
                  value={nextRoundDetails.link}
                  onChange={(e) => setNextRoundDetails({ ...nextRoundDetails, link: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Additional Instructions</label>
                <textarea
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:border-blue-500 min-h-[120px] resize-none"
                  placeholder="e.g., Please prepare a 10-minute presentation on..."
                  value={nextRoundDetails.instructions}
                  onChange={(e) => setNextRoundDetails({ ...nextRoundDetails, instructions: e.target.value })}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-black rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all"
                >
                  ✅ Approve & Send Email
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNextRoundForm(false); setPendingStatusUpdate(null); }}
                  className="px-8 py-5 bg-slate-100 text-slate-700 font-black rounded-2xl hover:bg-slate-200 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* System Alert Overlay */}
      {systemAlert && (
        <div className={`fixed bottom-10 right-10 z-[100] w-96 ${systemAlert.type === 'error' ? 'bg-slate-900 border-slate-700' : 'bg-emerald-900 border-emerald-700'} border text-white p-6 rounded-[32px] shadow-2xl animate-in slide-in-from-right-10`}>
          <div className="flex items-start gap-4">
            <div className={`h-10 w-10 ${systemAlert.type === 'error' ? 'bg-red-500/20 text-red-500' : 'bg-white/20 text-white'} rounded-xl flex items-center justify-center shrink-0`}>
              {systemAlert.type === 'error' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              )}
            </div>
            <div className="flex-1">
              <p className={`font-black text-sm uppercase tracking-tight ${systemAlert.type === 'error' ? 'text-red-400' : 'text-emerald-300'}`}>
                {systemAlert.type === 'error' ? 'Diagnostic' : 'System Active'}
              </p>
              <p className="text-xs text-slate-300 mt-1 font-bold">{systemAlert.message}</p>
              <div className={`mt-4 p-3 ${systemAlert.type === 'error' ? 'bg-slate-950/50 border-slate-800' : 'bg-emerald-950/50 border-emerald-800'} rounded-xl border`}>
                <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Audit Details</p>
                <p className="text-[10px] leading-relaxed text-slate-400 whitespace-pre-line">{systemAlert.suggestion}</p>
              </div>
            </div>
          </div>
          <button onClick={() => setSystemAlert(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
