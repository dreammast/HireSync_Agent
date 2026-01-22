
import React, { useState } from 'react';
import { Job } from '../types';

interface ManualCandidateFormProps {
  jobs: Job[];
  isProcessing: boolean;
  onManualUpload: (file: File, jobId: string) => Promise<void>;
}

export const ManualCandidateForm: React.FC<ManualCandidateFormProps> = ({ jobs, isProcessing, onManualUpload }) => {
  const [selectedJobId, setSelectedJobId] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !selectedJobId) return;
    
    await onManualUpload(file, selectedJobId);
    setFile(null);
    setSelectedJobId('');
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
        Direct Candidate Entry
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Role</label>
          <select 
            className="w-full p-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-slate-50"
            value={selectedJobId}
            onChange={e => setSelectedJobId(e.target.value)}
            required
          >
            <option value="">Select Role...</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>{job.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Upload Resume</label>
          <div className="relative">
            <input 
              type="file" 
              accept=".pdf,.docx,.txt" 
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              required
            />
            <div className={`p-3 border-2 border-dashed rounded-lg text-center transition-colors ${file ? 'border-green-300 bg-green-50' : 'border-slate-200 hover:border-indigo-400'}`}>
              <span className="text-xs font-medium text-slate-600 truncate block">
                {file ? file.name : 'Choose PDF/DOCX'}
              </span>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isProcessing || !file || !selectedJobId}
          className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : 'Analyze & Add Candidate'}
        </button>
      </form>
    </div>
  );
};
