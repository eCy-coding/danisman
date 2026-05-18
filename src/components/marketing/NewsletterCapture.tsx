/**
 * P51.1 — Newsletter capture component (email opt-in).
 *
 * POST → /api/newsletter/subscribe (backend Render — sandbox'ta migration deferred).
 * KVKK uyumlu: açık rıza checkbox + KVKK linki + çift opt-in (backend tarafında).
 * Optimistic UI: submit hemen feedback verir; backend confirmation email gönderir.
 */

import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { trackNewsletterSubscribe } from '../../lib/integrations/analytics';

type Status = 'idle' | 'submitting' | 'success' | 'error';

interface NewsletterCaptureProps {
  source?: string; // analytics source tag
  className?: string;
  variant?: 'inline' | 'card';
}

const API_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

export const NewsletterCapture: React.FC<NewsletterCaptureProps> = ({
  source = 'unknown',
  className = '',
  variant = 'card',
}) => {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setStatus('error');
      setMessage('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }
    if (!consent) {
      setStatus('error');
      setMessage('Lütfen KVKK aydınlatma metnine açık rıza verin.');
      return;
    }

    setStatus('submitting');
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), source }),
      });
      if (res.ok) {
        setStatus('success');
        setMessage('Teşekkürler! Onay e-postanızı kontrol edin (spam klasörünü unutmayın).');
        setEmail('');
        setConsent(false);
        trackNewsletterSubscribe(source);
      } else if (res.status === 409) {
        setStatus('success');
        setMessage('Bu e-posta zaten kayıtlı. Teşekkürler!');
        setEmail('');
      } else {
        setStatus('error');
        setMessage('Şu anda kaydedemedik. Lütfen birkaç dakika sonra tekrar deneyin.');
      }
    } catch {
      setStatus('error');
      setMessage('Bağlantı hatası. Daha sonra tekrar deneyin.');
    }
  }

  const containerClasses =
    variant === 'card'
      ? 'p-6 md:p-8 bg-white/5 border border-white/10 rounded-2xl'
      : 'p-4';

  return (
    <div className={`${containerClasses} ${className}`} data-testid="newsletter-capture">
      <div className="flex items-center gap-3 mb-4">
        <Mail size={20} className="text-secondary" aria-hidden="true" />
        <h3 className="text-lg font-serif font-bold text-white">
          Stratejik İçgörü Bülteni
        </h3>
      </div>
      <p className="text-sm text-slate-400 mb-5 leading-relaxed">
        Ayda bir özet — premium consulting trendleri, sektörel pratik notları, aylık macro briefing.
      </p>
      <form onSubmit={onSubmit} className="space-y-3" noValidate>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@sirket.com"
            required
            aria-required="true"
            aria-invalid={status === 'error' ? 'true' : 'false'}
            disabled={status === 'submitting' || status === 'success'}
            className="flex-1 px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={status === 'submitting' || status === 'success'}
            className="px-6 py-3 min-h-[44px] rounded-lg bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {status === 'submitting' ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Kaydediliyor
              </>
            ) : (
              'Abone Ol'
            )}
          </button>
        </div>
        <label className="flex items-start gap-2 text-xs text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 accent-secondary"
            aria-required="true"
          />
          <span className="leading-relaxed">
            KVKK kapsamında e-posta adresimin bülten gönderimi için işlenmesine açık rıza veriyorum.{' '}
            <Link to="/privacy/data-rights" className="text-secondary underline hover:no-underline">
              Detaylı bilgi
            </Link>
          </span>
        </label>
        {status === 'success' && message && (
          <p className="flex items-center gap-2 text-sm text-emerald-400" role="status">
            <CheckCircle2 size={16} /> {message}
          </p>
        )}
        {status === 'error' && message && (
          <p className="flex items-center gap-2 text-sm text-red-400" role="alert">
            <AlertCircle size={16} /> {message}
          </p>
        )}
      </form>
    </div>
  );
};
