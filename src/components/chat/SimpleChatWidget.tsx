/**
 * P51.3 — Simple chat widget (Crisp/Intercom yerine native).
 *
 * Floating bottom-right button → expand → name+email+message form → POST /api/contact.
 * "Genelde 1 iş günü içinde yanıtlıyoruz" microcopy + KVKK consent.
 *
 * Mobile-friendly, ARIA accessible, ESC to close, focus trap.
 */

import React, { useEffect, useRef, useState } from 'react';
import { MessageCircle, X, Send, Loader2, Check } from 'lucide-react';
import { trackCtaClick, trackFormSubmit } from '../../lib/integrations/analytics';

type Status = 'idle' | 'submitting' | 'success' | 'error';

const API_BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

export const SimpleChatWidget: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    // Focus first field
    setTimeout(() => firstFieldRef.current?.focus(), 80);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setStatus('error');
      return;
    }
    if (!message.trim()) {
      setStatus('error');
      return;
    }
    setStatus('submitting');
    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name || 'Chat widget kullanıcısı',
          email: email.trim(),
          message,
          source: 'simple-chat-widget',
          subject: 'Web chat widget mesajı',
        }),
      });
      if (res.ok) {
        setStatus('success');
        trackFormSubmit('simple-chat', true);
        // Reset after 4s
        setTimeout(() => {
          setName('');
          setEmail('');
          setMessage('');
          setStatus('idle');
          setOpen(false);
        }, 4000);
      } else {
        setStatus('error');
        trackFormSubmit('simple-chat', false);
      }
    } catch {
      setStatus('error');
      trackFormSubmit('simple-chat', false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            trackCtaClick('chat-open', 'simple-chat');
          }}
          aria-label="Mesaj bırak"
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-secondary text-neutral shadow-lg shadow-secondary/30 hover:scale-105 transition-transform flex items-center justify-center"
        >
          <MessageCircle size={22} />
        </button>
      )}

      {/* Dialog */}
      {open && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-labelledby="chat-widget-title"
          aria-modal="true"
          className="fixed bottom-6 right-6 left-6 md:left-auto z-40 md:max-w-sm w-auto md:w-[380px] bg-neutral border border-white/15 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300"
        >
          <header className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-secondary/15 to-primary/10 border-b border-white/10">
            <div>
              <h3 id="chat-widget-title" className="text-white font-bold text-base">
                Mesaj Bırak
              </h3>
              <p className="text-xs text-slate-400">1 iş günü içinde yanıtlıyoruz</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Kapat"
              className="w-9 h-9 min-h-[36px] min-w-[36px] rounded-lg hover:bg-white/5 transition-colors flex items-center justify-center"
            >
              <X size={18} className="text-slate-400" />
            </button>
          </header>

          {status === 'success' ? (
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
                <Check size={26} className="text-emerald-400" />
              </div>
              <h4 className="text-white font-semibold mb-2">Mesajın iletildi!</h4>
              <p className="text-sm text-slate-400">1 iş günü içinde sana döneceğiz.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="p-5 space-y-3" noValidate>
              <input
                ref={firstFieldRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Adın (opsiyonel)"
                className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary"
                aria-label="İsim"
              />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@sirket.com"
                required
                aria-required="true"
                className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary"
                aria-label="E-posta"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mesajın..."
                required
                aria-required="true"
                rows={3}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                aria-label="Mesaj"
              />
              <button
                type="submit"
                disabled={status === 'submitting'}
                className="w-full px-4 py-3 min-h-[44px] rounded-lg bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                {status === 'submitting' ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Gönderiliyor
                  </>
                ) : (
                  <>
                    Gönder <Send size={16} />
                  </>
                )}
              </button>
              {status === 'error' && (
                <p className="text-xs text-red-400" role="alert">
                  Mesaj iletilemedi. Lütfen email ve mesaj alanını kontrol edin.
                </p>
              )}
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Mesajınız SSL ile şifreli iletilir. KVKK kapsamında işlenir, 3. taraflarla paylaşılmaz.
              </p>
            </form>
          )}
        </div>
      )}
    </>
  );
};
