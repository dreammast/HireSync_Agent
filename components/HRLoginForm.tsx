
import React, { useState } from 'react';

interface HRLoginFormProps {
  onLogin: (success: boolean) => void;
  onCancel: () => void;
}

export const HRLoginForm: React.FC<HRLoginFormProps> = ({ onLogin, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAuthenticating(true);

    // Mimic network latency
    await new Promise(resolve => setTimeout(resolve, 800));

    // Simple mock check - in a real app, this would be a call to a secure API
    if (username === 'admin' && password === 'hiresync2025') {
      onLogin(true);
    } else {
      setError('Invalid credentials. Please try again.');
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-10 rounded-[48px] shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="h-20 w-20 bg-blue-600/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight">HR Authentication</h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">Restricted Access • HireSync Global Node</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity</label>
            <input 
              type="text"
              autoFocus
              className="w-full p-5 bg-slate-950/50 border border-slate-800 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-bold"
              placeholder="Username"
              value={username}
              onChange={e => setUsername(e.target.value)}
              disabled={isAuthenticating}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Access Key</label>
            <input 
              type="password"
              className="w-full p-5 bg-slate-950/50 border border-slate-800 rounded-2xl text-white outline-none focus:border-blue-500 transition-all font-bold"
              placeholder="••••••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={isAuthenticating}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold text-center animate-bounce">
              {error}
            </div>
          )}

          <div className="pt-4 flex flex-col gap-4">
            <button 
              type="submit" 
              disabled={isAuthenticating}
              className="w-full py-5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-black rounded-2xl transition-all shadow-xl shadow-blue-900/20 uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3"
            >
              {isAuthenticating ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Verifying...
                </>
              ) : 'Decrypt Access'}
            </button>
            <button 
              type="button"
              onClick={onCancel}
              className="text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              Cancel Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
