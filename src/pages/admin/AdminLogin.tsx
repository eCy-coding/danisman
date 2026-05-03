import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { ShieldCheck, Lock } from 'lucide-react';

export const AdminLoginPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const passwordId = React.useId();
  const errorId = React.useId();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      navigate('/admin/dashboard');
    } else {
      setError('Erişim Reddedildi / Access Denied');
    }
  };

  return (
    <div className="min-h-screen bg-neutral flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 shadow-2xl relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-secondary/10 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-linear-to-br from-white/10 to-transparent rounded-xl flex items-center justify-center mb-4 border border-white/10 shadow-glow">
            <ShieldCheck className="text-secondary w-8 h-8" />
          </div>
          <h1 className="text-2xl font-serif text-white tracking-wide">EcyPro<span className="text-secondary">.</span>Control</h1>
          <p className="text-slate-400 text-sm mt-2 font-mono">System Access Protocol</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 relative z-10">
          <div className="space-y-2">
            <label htmlFor={passwordId} className="text-xs text-secondary uppercase tracking-widest font-bold">Password Key</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" aria-hidden="true" />
              <input
                id={passwordId}
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 text-white placeholder-slate-600 focus:outline-none focus:border-secondary/50 transition-colors font-mono"
                placeholder="••••••••"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? errorId : undefined}
              />
            </div>
          </div>

          {error && (
            <div id={errorId} role="alert" className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 p-3 rounded text-center font-bold">
              {error}
            </div>
          )}

          <button 
            type="submit"
            className="w-full bg-linear-to-r from-secondary to-orange-500 text-black font-bold py-3 rounded-lg hover:shadow-glow transition-all transform active:scale-95 uppercase tracking-wider text-xs"
          >
            Authenticate
          </button>
        </form>
      </div>
    </div>
  );
};
