
import React, { useState } from 'react';
import { Candidate, ApprovalStatus, Job, User } from '../types';

interface CandidateRankingProps {
  candidates: Candidate[];
  jobs: Job[];
  registeredUsers?: User[];
  onUpdateStatus: (id: string, status: ApprovalStatus) => void;
  onUpdateFeedback: (id: string, type: 'correct' | 'incorrect', text: string) => void;
  filterContext?: string | null;
  onClearFilter?: () => void;
}

export const CandidateRanking: React.FC<CandidateRankingProps> = ({ 
  candidates, 
  jobs, 
  registeredUsers = [],
  onUpdateStatus, 
  onUpdateFeedback,
  filterContext,
  onClearFilter
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [feedbackType, setFeedbackType] = useState<'correct' | 'incorrect'>('correct');
  const [showFeedbackFormId, setShowFeedbackFormId] = useState<string | null>(null);

  const sortedCandidates = [...candidates].sort((a, b) => 
    (b.analysis?.matchScore || 0) - (a.analysis?.matchScore || 0)
  );

  const selectedCandidate = candidates.find(c => c.id === selectedId);
  const linkedUser = selectedCandidate ? registeredUsers.find(u => u.id === selectedCandidate.userId) : null;

  const handleStatusChange = (e: React.MouseEvent, id: string, status: ApprovalStatus) => {
    e.stopPropagation();
    onUpdateStatus(id, status);
    setShowFeedbackFormId(id);
    setFeedbackInput('');
    setFeedbackType(status === ApprovalStatus.APPROVED ? 'correct' : 'incorrect');
  };

  const submitFeedback = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    onUpdateFeedback(id, feedbackType, feedbackInput);
    setShowFeedbackFormId(null);
  };

  if (candidates.length === 0) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex items-center justify-between bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {filterContext ? `Pool: ${filterContext}` : 'Talent Pipeline'}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-slate-500 font-medium">No candidates found in this view.</p>
              {filterContext && (
                <button onClick={onClearFilter} className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">Show All Pool</button>
              )}
            </div>
          </div>
        </div>

        <div className="text-center py-24 bg-white rounded-[48px] border-2 border-dashed border-slate-200 flex flex-col items-center">
          <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-6">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          </div>
          <h3 className="text-xl font-black text-slate-800">No matching applications</h3>
          <p className="text-slate-400 mt-2 font-medium">Wait for candidates to apply to {filterContext || 'any role'}.</p>
          {filterContext && (
            <button 
              onClick={onClearFilter}
              className="mt-6 px-8 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all"
            >
              Reset Global View
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">
            {filterContext ? (
              <span className="flex items-center gap-3">
                <span className="text-blue-600">Role:</span> {filterContext}
              </span>
            ) : 'Talent Pipeline'}
          </h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-500 font-medium">
              {filterContext ? `Reviewing applications for ${filterContext}` : 'Real-time view of all centralized candidate data.'}
            </p>
            {filterContext && (
              <button 
                onClick={onClearFilter}
                className="text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest flex items-center gap-1 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                Clear Filter
              </button>
            )}
          </div>
        </div>
        <div className="text-right">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Results</p>
           <p className="text-2xl font-black text-blue-600">{candidates.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sortedCandidates.map((candidate, index) => {
          const job = jobs.find(j => j.id === candidate.jobId);
          const breakdown = candidate.analysis?.weightedBreakdown;
          
          return (
            <div 
              key={candidate.id}
              className={`group bg-white rounded-[32px] shadow-sm border p-8 transition-all cursor-pointer hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-900/5 ${selectedId === candidate.id ? 'ring-2 ring-blue-500 border-transparent' : 'border-slate-200'}`}
              onClick={() => setSelectedId(candidate.id)}
            >
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 bg-slate-50 text-slate-900 flex items-center justify-center rounded-2xl font-black text-xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-2xl tracking-tight leading-none mb-2">
                      {candidate.analysis?.candidateName || candidate.fileName}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg border border-blue-100">
                        {job?.title || 'System Entry'}
                      </span>
                      <span className="h-1.5 w-1.5 bg-slate-200 rounded-full"></span>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Applied {new Date(candidate.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right relative group/score">
                  <div className={`text-4xl font-black transition-transform cursor-help ${candidate.status === ApprovalStatus.APPROVED ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {candidate.analysis?.matchScore || 0}%
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-300 font-black">AI Match Rank</div>

                  {/* Enhanced Tooltip with Vertical Bar Chart */}
                  {breakdown && (
                    <div className="absolute right-full mr-6 top-1/2 -translate-y-1/2 w-80 p-6 bg-slate-950/98 text-white rounded-[32px] shadow-2xl opacity-0 invisible group-hover/score:opacity-100 group-hover/score:visible transition-all duration-300 z-[60] border border-white/5 pointer-events-none translate-x-4 group-hover/score:translate-x-0 backdrop-blur-2xl ring-1 ring-white/10">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                          <h5 className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Match Insights</h5>
                        </div>
                        <span className="text-[10px] font-black text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded-lg border border-blue-400/20">Real-time Analysis</span>
                      </div>
                      
                      {/* Simple Vertical Bar Chart */}
                      <div className="flex items-end justify-between h-32 px-4 mb-8">
                        {/* Skills Bar */}
                        <div className="flex flex-col items-center gap-3 w-12">
                          <span className="text-[10px] font-black text-blue-400">{breakdown.skillMatch}</span>
                          <div className="w-full bg-slate-800/50 h-24 rounded-t-xl relative overflow-hidden group/bar">
                            <div 
                              className="absolute bottom-0 w-full bg-blue-500 transition-all duration-1000 ease-out shadow-[0_-4px_12px_rgba(59,130,246,0.3)]" 
                              style={{ height: `${(breakdown.skillMatch / 50) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Skills</span>
                        </div>

                        {/* Experience Bar */}
                        <div className="flex flex-col items-center gap-3 w-12">
                          <span className="text-[10px] font-black text-indigo-400">{breakdown.experience}</span>
                          <div className="w-full bg-slate-800/50 h-24 rounded-t-xl relative overflow-hidden">
                            <div 
                              className="absolute bottom-0 w-full bg-indigo-500 transition-all duration-1000 delay-100 ease-out shadow-[0_-4px_12px_rgba(99,102,241,0.3)]" 
                              style={{ height: `${(breakdown.experience / 30) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Exp.</span>
                        </div>

                        {/* Education Bar */}
                        <div className="flex flex-col items-center gap-3 w-12">
                          <span className="text-[10px] font-black text-purple-400">{breakdown.education}</span>
                          <div className="w-full bg-slate-800/50 h-24 rounded-t-xl relative overflow-hidden">
                            <div 
                              className="absolute bottom-0 w-full bg-purple-500 transition-all duration-1000 delay-200 ease-out shadow-[0_-4px_12px_rgba(168,85,247,0.3)]" 
                              style={{ height: `${(breakdown.education / 20) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Edu.</span>
                        </div>
                      </div>

                      <div className="pt-5 border-t border-white/5 bg-white/5 -mx-6 -mb-6 p-6 rounded-b-[32px]">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4" /></svg>
                          <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Gemini Logic</span>
                        </div>
                        <p className="text-[11px] text-slate-200 leading-relaxed font-medium">
                          {candidate.analysis?.explanation}
                        </p>
                      </div>

                      {/* Tooltip Arrow */}
                      <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[8px] border-l-slate-950"></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {candidate.analysis?.matchedSkills.slice(0, 6).map(skill => (
                  <span key={skill} className="px-3 py-1 bg-slate-50 text-slate-600 text-[10px] font-black rounded-lg border border-slate-100 uppercase tracking-tight">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-slate-50 pt-6">
                <div className="flex items-center gap-4">
                  <div className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    candidate.status === ApprovalStatus.APPROVED ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                    candidate.status === ApprovalStatus.REJECTED ? 'bg-red-50 border-red-200 text-red-700' :
                    'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    {candidate.status}
                  </div>
                  {candidate.feedback && <span className="text-[10px] font-bold text-slate-400 italic">"Feedback logged"</span>}
                </div>
                <div className="flex gap-3">
                  <button onClick={(e) => handleStatusChange(e, candidate.id, ApprovalStatus.REJECTED)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 rounded-2xl border border-red-100 transition-all">Reject</button>
                  <button onClick={(e) => handleStatusChange(e, candidate.id, ApprovalStatus.APPROVED)} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl shadow-xl shadow-emerald-100 transition-all">Approve</button>
                </div>
              </div>

              {showFeedbackFormId === candidate.id && (
                <form onClick={e => e.stopPropagation()} onSubmit={(e) => submitFeedback(e, candidate.id)} className="mt-6 bg-slate-50 p-6 rounded-2xl border border-slate-200 animate-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Decision Justification</label>
                    <div className="flex bg-white rounded-xl border border-slate-200 overflow-hidden p-1">
                      <button type="button" onClick={() => setFeedbackType('correct')} className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${feedbackType === 'correct' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>CORRECT</button>
                      <button type="button" onClick={() => setFeedbackType('incorrect')} className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${feedbackType === 'incorrect' ? 'bg-amber-500 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>MISTAKE</button>
                    </div>
                  </div>
                  <textarea value={feedbackInput} onChange={(e) => setFeedbackInput(e.target.value)} placeholder="Why did you make this decision? Helps AI learning..." className="w-full text-sm font-medium p-4 rounded-xl border border-slate-200 h-24 outline-none focus:border-blue-500 bg-white" autoFocus />
                  <div className="flex justify-end gap-3 mt-4">
                    <button type="button" onClick={() => setShowFeedbackFormId(null)} className="text-[10px] font-black text-slate-400 uppercase hover:text-slate-600">Skip Sync</button>
                    <button type="submit" className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-black transition-all">Save to Database</button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
      </div>

      {selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-2xl bg-white h-full rounded-[40px] shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-in slide-in-from-right-8 duration-500">
            <div className="sticky top-0 bg-white border-b border-slate-100 p-8 flex items-center justify-between z-10">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight">{selectedCandidate.analysis?.candidateName}</h3>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Application File: {selectedCandidate.fileName}</p>
                {linkedUser && (
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeWidth={2} /></svg>
                      {linkedUser.email}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" strokeWidth={2} /></svg>
                      {linkedUser.phone}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setSelectedId(null)} className="h-12 w-12 hover:bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-10 space-y-10 overflow-y-auto custom-scrollbar">
              {selectedCandidate.feedback && (
                <div className={`p-6 rounded-[24px] border-2 shadow-sm ${selectedCandidate.feedbackType === 'correct' ? 'bg-emerald-50 border-emerald-100 text-emerald-900' : 'bg-amber-50 border-amber-100 text-amber-900'}`}>
                   <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">Internal HR Note</p>
                   <p className="text-lg font-bold italic leading-relaxed">"{selectedCandidate.feedback}"</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-6">
                <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Skills</p>
                  <p className="text-3xl font-black text-blue-600">{selectedCandidate.analysis?.weightedBreakdown.skillMatch}/50</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Experience</p>
                  <p className="text-3xl font-black text-blue-600">{selectedCandidate.analysis?.weightedBreakdown.experience}/30</p>
                </div>
                <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Education</p>
                  <p className="text-3xl font-black text-blue-600">{selectedCandidate.analysis?.weightedBreakdown.education}/20</p>
                </div>
              </div>

              <section>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Gemini AI Intelligence</h4>
                <div className="bg-indigo-50/50 p-8 rounded-[32px] border border-indigo-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3.005 3.005 0 013.75-2.906z" /></svg>
                  </div>
                  <p className="text-indigo-900 leading-relaxed text-lg font-medium italic">"{selectedCandidate.analysis?.explanation}"</p>
                </div>
              </section>

              <div className="bg-slate-900 text-slate-200 p-8 rounded-[32px] shadow-2xl">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Encrypted Resume Data</h4>
                <div className="max-h-80 overflow-y-auto text-xs opacity-80 whitespace-pre-wrap font-mono leading-relaxed custom-scrollbar-dark pr-4">{selectedCandidate.resumeText}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
