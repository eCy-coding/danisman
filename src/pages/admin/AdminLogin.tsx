import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, KeyRound, Loader2 } from 'lucide-react';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import { useAppStore } from '../../store/useAppStore';
import { apiClient } from '../../lib/api';

type Step = 'password' | 'totp';

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    const msg = err.message;
    if (msg === 'FORBIDDEN_NOT_ADMIN') return 'Bu hesap admin değil.';
    if (msg === 'INVALID_CREDENTIALS') return 'Yanlış e-posta veya parola.';
    // Axios-style error with response
    const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
    if (axiosErr.response?.status === 429) return 'Çok fazla deneme. 15 dk bekleyin.';
    if (axiosErr.response?.status === 401) return 'Yanlış e-posta veya parola.';
    if (axiosErr.response?.status === 403) return 'Bu hesap admin değil.';
    if (axiosErr.response?.data?.message) return axiosErr.response.data.message;
  }
  return 'Bir hata oluştu. Tekrar deneyin.';
}

export const AdminLoginPage: React.FC = () => {
  const [step, setStep] = useState<Step>('password');

  // Step 1 — password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Step 2 — TOTP
  const [totpCode, setTotpCode] = useState('');
  const [totpError, setTotpError] = useState('');
  const [totpLoading, setTotpLoading] = useState(false);

  const { login } = useAdminAuth();
  const setTotpVerified = useAppStore((s) => s.setTotpVerified);
  const navigate = useNavigate();

  const emailId = React.useId();
  const passwordId = React.useId();
  const passwordErrorId = React.useId();
  const totpId = React.useId();
  const totpErrorId = React.useId();

  // ── Step 1: password submit ────────────────────────────────────────────────

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordLoading(true);
    try {
      const result = await login(email, password);
      if (result.requiresTotp) {
        setStep('totp');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setPasswordError(getErrorMessage(err));
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Step 2: TOTP submit ────────────────────────────────────────────────────

  const handleTotpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTotpError('');
    setTotpLoading(true);
    try {
      await apiClient.post('/totp/validate', { code: totpCode });
      setTotpVerified(true);
      navigate('/admin/dashboard');
    } catch (err) {
      const axiosErr = err as { response?: { status?: number } };
      if (axiosErr.response?.status === 401) {
        setTotpError('Geçersiz doğrulama kodu. Tekrar deneyin.');
      } else {
        setTotpError(getErrorMessage(err));
      }
    } finally {
      setTotpLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-2xl p-10 shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="flex flex-col items-center mb-8 relative z-10">
          <div className="w-16 h-16 bg-linear-to-br from-white/10 to-transparent rounded-xl flex items-center justify-center mb-4 border border-white/10 shadow-glow">
            <ShieldCheck className="text-secondary w-8 h-8" />
          </div>
          <h1 className="text-2xl font-serif text-white tracking-wide">
            EcyPro<span className="text-secondary">.</span>Control
          </h1>
          <p className="text-slate-400 text-sm mt-2 font-mono">
            {step === 'password' ? 'Admin Authentication' : '2-Factor Verification'}
          </p>
        </div>

        {/* ── Step 1: email + password ──────────────────────────────────────── */}
        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-5 relative z-10">
            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor={emailId}
                className="text-xs text-secondary uppercase tracking-widest font-bold"
              >
                E-posta
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"
                  aria-hidden="true"
                />
                <input
                  id={emailId}
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-secondary/50 transition-colors"
                  placeholder="admin@ecypro.com"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor={passwordId}
                className="text-xs text-secondary uppercase tracking-widest font-bold"
              >
                Parola
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"
                  aria-hidden="true"
                />
                <input
                  id={passwordId}
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-secondary/50 transition-colors font-mono"
                  placeholder="••••••••"
                  aria-invalid={passwordError ? 'true' : 'false'}
                  aria-describedby={passwordError ? passwordErrorId : undefined}
                />
              </div>
            </div>

            {passwordError && (
              <div
                id={passwordErrorId}
                role="alert"
                className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 p-3 rounded text-center font-bold"
              >
                {passwordError}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              className="w-full bg-linear-to-r from-secondary to-orange-500 text-black font-bold py-3 rounded-lg hover:shadow-glow transition-all transform active:scale-95 uppercase tracking-wider text-xs disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {passwordLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Giriş yapılıyor...
                </>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </form>
        )}

        {/* ── Step 2: TOTP ─────────────────────────────────────────────────── */}
        {step === 'totp' && (
          <form onSubmit={handleTotpSubmit} className="space-y-5 relative z-10">
            <div className="space-y-2">
              <label
                htmlFor={totpId}
                className="text-xs text-secondary uppercase tracking-widest font-bold"
              >
                Doğrulama Kodu
              </label>
              <p className="text-slate-400 text-xs">
                Google Authenticator veya uyumlu uygulamadan 6 haneli kodu girin.
              </p>
              <div className="relative">
                <KeyRound
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4"
                  aria-hidden="true"
                />
                <input
                  id={totpId}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  className="w-full bg-black/20 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-secondary/50 transition-colors font-mono tracking-[0.4em] text-center"
                  placeholder="000000"
                  aria-invalid={totpError ? 'true' : 'false'}
                  aria-describedby={totpError ? totpErrorId : undefined}
                />
              </div>
            </div>

            {totpError && (
              <div
                id={totpErrorId}
                role="alert"
                className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 p-3 rounded text-center font-bold"
              >
                {totpError}
              </div>
            )}

            <button
              type="submit"
              disabled={totpLoading || totpCode.length !== 6}
              className="w-full bg-linear-to-r from-secondary to-orange-500 text-black font-bold py-3 rounded-lg hover:shadow-glow transition-all transform active:scale-95 uppercase tracking-wider text-xs disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {totpLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  Doğrulanıyor...
                </>
              ) : (
                'Doğrula'
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setStep('password');
                setPassword('');
                setTotpCode('');
                setTotpError('');
              }}
              className="w-full text-slate-400 text-xs py-2 hover:text-white transition-colors"
            >
              ← Geri dön
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
