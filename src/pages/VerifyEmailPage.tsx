/**
 * P35-T03: VerifyEmailPage — Email Verification Token Handler
 *
 * Route: /verify-email?token=<hex>
 *
 * Flow:
 *   1. Extract token from URL query string
 *   2. POST /api/auth/verify-email?token=... (backend verifies SHA-256 hash, marks used)
 *   3. States: loading → success | error (invalid / expired / already_used)
 *
 * Security:
 *   - Token is a 32-byte CSPRNG hex (crypto.randomBytes) — 256-bit entropy
 *   - Server stores SHA-256(token), never raw token
 *   - Token is single-use (usedAt timestamp prevents replay)
 *   - Expires after 24h (expiresAt field)
 *   - Timing-safe comparison on server (constant-time hash compare)
 *
 * UX:
 *   - Auto-verifies on mount (no manual click needed)
 *   - Success → redirect countdown to /admin/login
 *   - "Request new link" button on expired/used tokens
 */

import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertTriangle, Loader2, RefreshCw, ArrowRight } from 'lucide-react';
import { apiClient } from '../lib/api';

type VerifyState =
  | { status: 'loading' }
  | { status: 'success' }
  | {
      status: 'error';
      code: 'MISSING_TOKEN' | 'INVALID_TOKEN' | 'TOKEN_EXPIRED' | 'TOKEN_USED' | 'UNKNOWN';
    }
  | { status: 'resent' };

const ERROR_CONFIG = {
  MISSING_TOKEN: {
    title: 'Token Eksik',
    message: 'Doğrulama linki eksik veya bozuk. Lütfen e-postanızdaki linke tıklayın.',
    canResend: false,
  },
  INVALID_TOKEN: {
    title: 'Geçersiz Link',
    message:
      'Bu doğrulama linki geçerli değil. Daha önce silinmiş veya hiç oluşturulmamış olabilir.',
    canResend: true,
  },
  TOKEN_EXPIRED: {
    title: 'Link Süresi Dolmuş',
    message:
      'Bu doğrulama linki 24 saat geçerliydi ve süresi doldu. Yeni bir link gönderebilirsiniz.',
    canResend: true,
  },
  TOKEN_USED: {
    title: 'Link Zaten Kullanıldı',
    message: 'Bu link daha önce kullanılmış. E-posta adresiniz zaten doğrulanmış.',
    canResend: false,
  },
  UNKNOWN: {
    title: 'Bir Hata Oluştu',
    message: 'Sunucu hatası oluştu. Lütfen birkaç saniye bekleyip tekrar deneyin.',
    canResend: true,
  },
} as const;

const REDIRECT_COUNTDOWN_SEC = 5;

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [state, setState] = useState<VerifyState>({ status: 'loading' });
  const [countdown, setCountdown] = useState(REDIRECT_COUNTDOWN_SEC);
  const [resenLoading, setResendLoading] = useState(false);
  const didVerify = useRef(false);

  // ── Auto-verify on mount ──────────────────────────────────
  useEffect(() => {
    if (didVerify.current) return;
    didVerify.current = true;

    if (!token) {
      setState({ status: 'error', code: 'MISSING_TOKEN' });
      return;
    }

    apiClient
      .get('/auth/verify-email', { params: { token } })
      .then(() => setState({ status: 'success' }))
      .catch((err: unknown) => {
        const code = (err as { response?: { data?: { code?: string } } })?.response?.data
          ?.code as VerifyState extends { code: infer C } ? C : never;
        const knownCodes = [
          'MISSING_TOKEN',
          'INVALID_TOKEN',
          'TOKEN_EXPIRED',
          'TOKEN_USED',
        ] as const;
        setState({
          status: 'error',
          code: knownCodes.includes(code as (typeof knownCodes)[number])
            ? (code as (typeof knownCodes)[number])
            : 'UNKNOWN',
        });
      });
  }, [token]);

  // ── Countdown + redirect on success ──────────────────────
  useEffect(() => {
    if (state.status !== 'success') return;
    if (countdown <= 0) {
      navigate('/admin/login');
      return;
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [state.status, countdown, navigate]);

  // ── Resend verification email ─────────────────────────────
  const handleResend = async () => {
    setResendLoading(true);
    try {
      await apiClient.post('/auth/send-verify-email');
      setState({ status: 'resent' });
    } catch {
      // User might not be logged in — show message
      setState({ status: 'error', code: 'UNKNOWN' });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* ── Logo ──────────────────────────────────────── */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-serif text-white">
            eCyPro<span className="text-secondary">.</span>
          </h1>
        </div>

        {/* ── Card ──────────────────────────────────────── */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-8 text-center space-y-5">
          {/* Loading */}
          {state.status === 'loading' && (
            <>
              <Loader2 size={48} className="text-secondary animate-spin mx-auto" />
              <div>
                <h2 className="text-lg font-semibold text-white">E-posta Doğrulanıyor</h2>
                <p className="text-sm text-slate-400 mt-1">Lütfen bekleyin…</p>
              </div>
            </>
          )}

          {/* Success */}
          {state.status === 'success' && (
            <>
              <CheckCircle size={52} className="text-green-400 mx-auto" />
              <div>
                <h2 className="text-xl font-bold text-white">E-posta Doğrulandı!</h2>
                <p className="text-sm text-slate-400 mt-1.5">
                  Hesabınız başarıyla etkinleştirildi.
                </p>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
                <p className="text-xs text-green-400">
                  {countdown} saniye içinde giriş sayfasına yönlendiriliyorsunuz…
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="w-full flex items-center justify-center gap-2 py-3 bg-secondary text-white font-semibold rounded-xl hover:bg-secondary/90 transition-all"
              >
                Giriş Yap <ArrowRight size={16} />
              </button>
            </>
          )}

          {/* Error */}
          {state.status === 'error' &&
            (() => {
              const cfg = ERROR_CONFIG[state.code];
              return (
                <>
                  <AlertTriangle size={52} className="text-amber-400 mx-auto" />
                  <div>
                    <h2 className="text-lg font-bold text-white">{cfg.title}</h2>
                    <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{cfg.message}</p>
                  </div>
                  <div className="space-y-3">
                    {cfg.canResend && (
                      <button
                        type="button"
                        onClick={handleResend}
                        disabled={resenLoading}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 text-slate-300 font-medium rounded-xl hover:bg-white/10 transition-all disabled:opacity-50"
                      >
                        {resenLoading ? (
                          <>
                            <Loader2 size={15} className="animate-spin" /> Gönderiliyor…
                          </>
                        ) : (
                          <>
                            <RefreshCw size={15} /> Yeni Doğrulama Linki Gönder
                          </>
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => navigate('/admin/login')}
                      className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      Giriş Sayfasına Dön
                    </button>
                  </div>
                </>
              );
            })()}

          {/* Resent confirmation */}
          {state.status === 'resent' && (
            <>
              <CheckCircle size={48} className="text-green-400 mx-auto" />
              <div>
                <h2 className="text-lg font-semibold text-white">Yeni Link Gönderildi</h2>
                <p className="text-sm text-slate-400 mt-1">
                  E-posta kutunuzu kontrol edin. Spam klasörünü de kontrol etmeyi unutmayın.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/admin/login')}
                className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                Giriş Sayfasına Dön
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-700 mt-6">
          eCyPro Premium Consulting · e-posta: info@ecypro.com
        </p>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
