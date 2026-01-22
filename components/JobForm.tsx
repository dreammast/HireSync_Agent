
import React, { useState } from 'react';
import { Job } from '../types';

interface JobFormProps {
  jobs: Job[];
  selectedJobId?: string | null;
  onAddJob: (job: Job) => void;
  onDeleteJob: (id: string) => void;
  onSelectJob: (id: string) => void;
}

export const JobForm: React.FC<JobFormProps> = ({ 
  jobs, 
  selectedJobId,
  onAddJob, 
  onDeleteJob, 
  onSelectJob 
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDept, setNewDept] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc) return;
    
    onAddJob({
      id: Math.random().toString(36).substr(2, 9),
      title: newTitle,
      description: newDesc,
      department: newDept || 'General',
      location: 'Remote'
    });
    
    setNewTitle('');
    setNewDesc('');
    setNewDept('');
    setIsAdding(false);
  };

  return (
    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Job Roles
        </h2>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="text-[10px] font-black text-blue-600 hover:text-blue-700 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 transition-all uppercase tracking-widest"
        >
          {isAdding ? 'Cancel' : 'Add Role'}
        </button>
      </div>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <input 
            className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-sm font-bold text-slate-900 transition-all"
            placeholder="Role Title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            required
          />
          <input 
            className="w-full p-4 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-sm font-bold text-slate-900 transition-all"
            placeholder="Department"
            value={newDept}
            onChange={e => setNewDept(e.target.value)}
          />
          <textarea
            className="w-full h-32 p-4 rounded-xl border border-slate-100 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-sm resize-none font-medium text-slate-600 transition-all"
            placeholder="Job Description..."
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            required
          />
          <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all uppercase text-xs tracking-widest">
            Broadcast Posting
          </button>
        </form>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {jobs.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-slate-400 text-sm font-medium">No roles created yet.</p>
            </div>
          ) : (
            jobs.map(job => {
              const isActive = selectedJobId === job.id;
              return (
                <div 
                  key={job.id} 
                  onClick={() => onSelectJob(job.id)}
                  className={`p-5 rounded-2xl cursor-pointer group transition-all relative overflow-hidden ${
                    isActive 
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-100 ring-2 ring-blue-500 ring-offset-2 border-transparent' 
                    : 'bg-slate-50 border border-slate-100 text-slate-900 hover:border-blue-200 hover:bg-white hover:shadow-lg'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 right-0 p-3 opacity-20">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </div>
                  )}
                  <div className="flex items-center justify-between relative z-10">
                    <div>
                      <h4 className={`font-black text-sm tracking-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>{job.title}</h4>
                      <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>{job.department}</p>
                    </div>
                    {!isActive && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteJob(job.id);
                        }} 
                        className="opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all hover:bg-red-50 rounded-lg"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2M4 7h16" /></svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
