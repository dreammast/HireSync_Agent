
import React, { useState, useMemo, useEffect } from 'react';
import { Candidate, ApprovalStatus, Job, User } from '../types';
import { extractTextFromFile } from '../services/fileService';
import { analyzeResume } from '../services/groqService';
import { sendVerificationEmail } from '../services/emailService';

interface CandidateDashboardProps {
  user: User;
  jobs: Job[];
  allCandidates: Candidate[];
  onApply: (candidate: Candidate) => void;
  onUpdateProfile: (user: User) => void;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({
  user,
  jobs,
  allCandidates,
  onApply,
  onUpdateProfile
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'applications' | 'profile'>('browse');
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  // Profile edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState(user.email || '');
  const [editPhone, setEditPhone] = useState(user.phone || '');

  useEffect(() => {
    setEditName(user.name);
    setEditEmail(user.email || '');
    setEditPhone(user.phone || '');
  }, [user]);

  const myApplications = useMemo(() => {
    return allCandidates.filter(c => c.userId === user.id);
  }, [allCandidates, user.id]);

  const selectedJob = jobs.find(j => j.id === selectedJobId);
  const viewedApplication = myApplications.find(app => app.jobId === selectedJobId);

  const isProfileIncomplete = !user.email || !user.phone;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedJob) return;

    setIsUploading(true);
    try {
      const text = await extractTextFromFile(file);
      const analysis = await analyzeResume(selectedJob.description, text);

      onApply({
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        jobId: selectedJob.id,
        name: analysis.candidateName,
        fileName: file.name,
        resumeText: text,
        analysis,
        status: ApprovalStatus.PENDING,
        timestamp: Date.now()
      });
      setSelectedJobId(null);
      setActiveTab('applications');
    } catch (err) {
      alert("Analysis failed. Please check your network or AI key.");
    } finally {
      setIsUploading(false);
    }
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...user,
      name: editName,
      email: editEmail,
      phone: editPhone,
      emailVerified: user.email === editEmail ? user.emailVerified : false
    });
    setIsEditingProfile(false);
  };

  const startVerification = async () => {
    if (!user.email || isVerifying) return;

    setIsVerifying(true);
    setVerificationError(null);

    const token = Math.random().toString(36).substr(2, 12);
    // Real HTTPS verification link based on current deployment
    const verificationLink = `${window.location.origin}${window.location.pathname}?verifyToken=${token}`;

    const result = await sendVerificationEmail({
      toEmail: user.email,
      candidateName: user.name,
      verificationLink
    });

    if (result.success) {
      onUpdateProfile({
        ...user,
        verificationToken: token
      });
      setVerificationSent(true);
      setTimeout(() => {
        setVerificationSent(false);
      }, 8000);
    } else {
      setVerificationError(result.error || 'Identity verification dispatch failed.');
      setTimeout(() => setVerificationError(null), 5000);
    }
    setIsVerifying(false);
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      {/* Profile Incomplete Banner */}
      {isProfileIncomplete && activeTab !== 'profile' && (
        <div className="mb-8 bg-amber-50 border border-amber-200 p-4 rounded-3xl flex items-center justify-between animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <p className="text-sm font-black text-amber-900 uppercase tracking-tight">Profile Information Missing</p>
              <p className="text-xs text-amber-700 font-medium">Please add your contact details so recruiters can reach you.</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('profile')}
            className="px-6 py-2 bg-amber-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-amber-700 transition-all shadow-lg shadow-amber-900/10"
          >
            Update Now
          </button>
        </div>
      )}

      {selectedJobId ? (
        <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            onClick={() => setSelectedJobId(null)}
            className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-blue-600 transition-colors mb-6"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to List
          </button>

          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            {viewedApplication ? (
              <div className="flex flex-col">
                <div className={`p-8 ${viewedApplication.status === ApprovalStatus.APPROVED ? 'bg-emerald-600' :
                    viewedApplication.status === ApprovalStatus.REJECTED ? 'bg-slate-900' :
                      'bg-blue-600'
                  } text-white`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">Application for</p>
                      <h3 className="text-3xl font-black tracking-tight">{selectedJob?.title}</h3>
                      <p className="text-sm opacity-80 mt-1">{selectedJob?.department} • Applied {new Date(viewedApplication.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <div className="bg-white/10 border border-white/20 rounded-2xl px-4 py-2 backdrop-blur-md">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Decision</p>
                        <p className="font-black text-xl tracking-wide">{viewedApplication.status}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  {viewedApplication.status === ApprovalStatus.PENDING ? (
                    <div className="text-center py-16 px-6">
                      <div className="h-20 w-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </div>
                      <h4 className="text-2xl font-black text-slate-800 mb-3">Review in Progress</h4>
                      <p className="text-slate-500 max-w-sm mx-auto leading-relaxed">The hiring team is currently evaluating your profile against the role requirements. Results will appear here shortly.</p>
                    </div>
                  ) : (
                    <div className="animate-in fade-in slide-in-from-top-4 duration-500 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Overall Match</p>
                          <div className={`text-4xl font-black ${viewedApplication.status === ApprovalStatus.APPROVED ? 'text-emerald-600' : 'text-slate-900'}`}>
                            {viewedApplication.analysis?.matchScore}%
                          </div>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Education</p>
                          <div className="text-lg font-bold text-slate-700 truncate">
                            {viewedApplication.analysis?.educationLevel}
                          </div>
                        </div>
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Exp. Summary</p>
                          <div className="text-xs font-bold text-slate-500 leading-tight">
                            {viewedApplication.analysis?.experienceSummary || 'Verified'}
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 relative overflow-hidden">
                        <div className="absolute -top-4 -right-4 h-24 w-24 bg-blue-100/50 rounded-full blur-2xl"></div>
                        <h4 className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-3 flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3.005 3.005 0 013.75-2.906z" /></svg>
                          AI Feedback Summary
                        </h4>
                        <p className="text-blue-900 leading-relaxed text-sm italic font-medium">"{viewedApplication.analysis?.explanation}"</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Key Strengths Detected
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {viewedApplication.analysis?.matchedSkills.map(s => (
                              <span key={s} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-lg border border-emerald-100 uppercase">{s}</span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                            Gap Analysis
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {viewedApplication.analysis?.missingSkills.map(s => (
                              <span key={s} className="px-3 py-1 bg-slate-50 text-slate-500 text-[10px] font-black rounded-lg border border-slate-100 uppercase">{s}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 space-y-6">
                <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">About this Role</h4>
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{selectedJob?.description}</p>
                </div>
                <div className="border-4 border-dashed border-slate-100 rounded-[32px] p-16 text-center hover:border-blue-200 transition-all group">
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-6">
                      <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent"></div>
                        <div className="absolute inset-0 flex items-center justify-center text-blue-600">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 2a2 2 0 00-2 2v11a3 3 0 106 0V4a2 2 0 00-2-2H4zm1 14a1 1 0 100-2 1 1 0 000 2zm5-1.757l4.9-4.9a1 1 0 00-1.414-1.414L10 11.586V2h2v9.586l3.5-3.5a1 1 0 111.414 1.414l-4.9 4.9a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                        </div>
                      </div>
                      <p className="font-black text-blue-600 uppercase tracking-[0.2em] text-xs">AI Evaluation Engine Running...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="h-20 w-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm group-hover:scale-110 transition-transform">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Apply for this Position</h3>
                        <p className="text-slate-500 mt-1 font-medium">Upload your latest resume to get an instant AI evaluation.</p>
                      </div>
                      <label className="inline-block px-12 py-4 bg-blue-600 text-white font-black rounded-2xl cursor-pointer hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all uppercase tracking-widest text-xs">
                        Select Resume File
                        <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFile} />
                      </label>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h2 className="text-5xl font-black text-slate-900 tracking-tighter">HireSync Portal</h2>
              <p className="text-slate-500 mt-2 font-medium">Manage your career trajectory and discover elite opportunities.</p>
            </div>
            <div className="flex bg-slate-200 p-1.5 rounded-2xl shadow-inner">
              <button
                onClick={() => setActiveTab('browse')}
                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'browse' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Browse Roles
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'applications' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
              >
                My Journey ({myApplications.length})
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-500 hover:text-slate-700'} ${isProfileIncomplete || !user.emailVerified ? 'relative' : ''}`}
              >
                Profile Settings
                {(isProfileIncomplete || !user.emailVerified) && <span className="absolute -top-1 -right-1 h-3 w-3 bg-amber-500 rounded-full border-2 border-white"></span>}
              </button>
            </div>
          </header>

          {activeTab === 'browse' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {jobs.map(job => {
                const existingApp = myApplications.find(a => a.jobId === job.id);
                return (
                  <div
                    key={job.id}
                    className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-900/5 transition-all cursor-pointer group flex flex-col justify-between h-full"
                    onClick={() => setSelectedJobId(job.id)}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <div className="h-14 w-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2H7a2 2 0 00-2-2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        {existingApp && (
                          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border ${existingApp.status === ApprovalStatus.APPROVED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                              existingApp.status === ApprovalStatus.REJECTED ? 'bg-slate-50 text-slate-600 border-slate-200' :
                                'bg-blue-50 text-blue-600 border-blue-100 animate-pulse'
                            }`}>
                            {existingApp.status}
                          </div>
                        )}
                      </div>
                      <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors tracking-tight">{job.title}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">{job.department}</p>
                      <p className="text-sm text-slate-500 line-clamp-3 mb-10 leading-relaxed font-medium">{job.description}</p>
                    </div>
                    <button className={`w-full py-4 font-black rounded-2xl transition-all text-[10px] uppercase tracking-widest ${existingApp ? 'bg-slate-100 text-slate-500' : 'bg-slate-900 text-white group-hover:bg-blue-600 group-hover:shadow-lg group-hover:shadow-blue-200'}`}>
                      {existingApp ? 'Track Decision' : 'Apply Instantly'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : activeTab === 'applications' ? (
            <div className="space-y-4">
              {myApplications.length === 0 ? (
                <div className="bg-white rounded-[40px] p-24 text-center border border-slate-200 shadow-sm animate-in fade-in duration-500">
                  <div className="h-24 w-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-8 text-slate-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">No active applications</h3>
                  <p className="text-slate-400 max-w-sm mx-auto font-medium">Your career timeline is empty. Browse our openings.</p>
                  <button onClick={() => setActiveTab('browse')} className="mt-10 px-10 py-4 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-700 shadow-2xl shadow-blue-100 transition-all">Explore Global Openings</button>
                </div>
              ) : (
                myApplications.map(app => {
                  const job = jobs.find(j => j.id === app.jobId);
                  return (
                    <div
                      key={app.id}
                      className="bg-white p-8 rounded-[32px] border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:border-blue-500 hover:shadow-2xl hover:shadow-slate-900/5 transition-all cursor-pointer group animate-in slide-in-from-bottom-2 duration-300"
                      onClick={() => setSelectedJobId(app.jobId)}
                    >
                      <div className="flex items-center gap-8">
                        <div className={`h-16 w-16 rounded-[20px] flex items-center justify-center transition-all ${app.status === ApprovalStatus.APPROVED ? 'bg-emerald-50 text-emerald-600 shadow-emerald-50' :
                            app.status === ApprovalStatus.REJECTED ? 'bg-slate-100 text-slate-400' :
                              'bg-blue-50 text-blue-600 shadow-blue-50'
                          } shadow-lg`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 text-xl group-hover:text-blue-600 transition-colors tracking-tight">{job?.title}</h3>
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{job?.department}</span>
                            <span className="h-1.5 w-1.5 bg-slate-200 rounded-full"></span>
                            <span className="text-[10px] font-bold text-slate-400">ID: {app.id.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right mr-4 hidden sm:block">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">AI Rank</p>
                          <p className="font-black text-lg text-slate-900">{app.status === ApprovalStatus.PENDING ? '...' : `${app.analysis?.matchScore}%`}</p>
                        </div>
                        <div className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] border shadow-sm transition-all ${app.status === ApprovalStatus.APPROVED ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                            app.status === ApprovalStatus.REJECTED ? 'bg-slate-50 border-slate-200 text-slate-700' :
                              'bg-blue-50 border-blue-200 text-blue-700'
                          }`}>
                          {app.status}
                        </div>
                        <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner group-hover:shadow-blue-200">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="bg-white rounded-[48px] shadow-2xl border border-slate-200 overflow-hidden">
                <div className="p-10 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="h-20 w-20 bg-blue-600 rounded-[28px] flex items-center justify-center text-4xl font-black shadow-2xl shadow-blue-500/20">
                      {user.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-3xl font-black tracking-tight">{user.name}</h3>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1">Profile Metadata</p>
                    </div>
                  </div>
                  {!isEditingProfile && (
                    <button
                      onClick={() => setIsEditingProfile(true)}
                      className="px-6 py-3 bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border border-white/10"
                    >
                      {isProfileIncomplete ? 'Complete Identity' : 'Edit Identity'}
                    </button>
                  )}
                </div>

                <div className="p-12">
                  {isEditingProfile ? (
                    <form onSubmit={saveProfile} className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Display Name</label>
                          <input
                            className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-blue-500 font-bold text-slate-900 transition-all"
                            value={editName}
                            onChange={e => setEditName(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Email</label>
                          <input
                            type="email"
                            className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-blue-500 font-bold text-slate-900 transition-all"
                            value={editEmail}
                            onChange={e => setEditEmail(e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-3 md:col-span-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Direct Phone</label>
                          <input
                            type="tel"
                            className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-blue-500 font-bold text-slate-900 transition-all"
                            value={editPhone}
                            onChange={e => setEditPhone(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="pt-6 flex gap-4">
                        <button
                          type="submit"
                          className="flex-1 py-5 bg-blue-600 text-white font-black rounded-[24px] uppercase tracking-widest text-[10px] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all"
                        >
                          Push Changes to Sync
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingProfile(false);
                            setEditName(user.name);
                            setEditEmail(user.email || '');
                            setEditPhone(user.phone || '');
                          }}
                          className="px-10 py-5 bg-slate-50 text-slate-400 hover:text-slate-900 font-black rounded-[24px] uppercase tracking-widest text-[10px] transition-all"
                        >
                          Discard
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-12">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Verified Email</p>
                          {user.email ? (
                            <div className="space-y-3">
                              <p className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                {user.email}
                                {user.emailVerified ? (
                                  <svg className="h-5 w-5 text-emerald-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <span className="bg-amber-100 text-amber-700 text-[9px] px-2 py-0.5 rounded-full font-black uppercase">Unverified</span>
                                )}
                              </p>
                              {!user.emailVerified && (
                                <button
                                  onClick={startVerification}
                                  disabled={isVerifying || verificationSent}
                                  className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all px-4 py-2 rounded-xl border ${verificationSent
                                      ? 'text-emerald-600 bg-emerald-50 border-emerald-100'
                                      : 'text-blue-600 hover:bg-blue-50 border-transparent'
                                    } disabled:opacity-70 disabled:cursor-not-allowed`}
                                >
                                  {isVerifying ? (
                                    <>
                                      <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                      Dispatching...
                                    </>
                                  ) : verificationSent ? (
                                    <>
                                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                      </svg>
                                      Verification Link Queued
                                    </>
                                  ) : (
                                    'Send Verification Email'
                                  )}
                                </button>
                              )}
                              {verificationError && (
                                <p className="text-[9px] font-black text-red-500 uppercase tracking-widest animate-in slide-in-from-top-1">
                                  {verificationError}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                              <span className="text-sm font-black uppercase tracking-tight">Email Required</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Link</p>
                          {user.phone ? (
                            <p className="text-xl font-bold text-slate-900">{user.phone}</p>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-600">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                              <span className="text-sm font-black uppercase tracking-tight">Phone Required</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-12 border-t border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-8">Portal Audit Logs</h4>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-slate-400">Portal Initialized</span>
                            <span className="text-slate-900 font-black">{user.portalCreated ? new Date(user.portalCreated).toLocaleString() : 'Legacy'}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm font-medium">
                            <span className="text-slate-400">Last Active Session</span>
                            <span className="text-slate-900 font-black">{new Date().toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
