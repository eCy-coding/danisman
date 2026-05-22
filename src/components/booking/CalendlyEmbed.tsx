/**
 * P51.3 + P73.B — Calendly embed (env-gated) with rich native fallback.
 *
 * ENV `VITE_CALENDLY_URL` doluysa: iframe embed
 * Boşsa: inline form (ad + email + telefon + 3 slot tercihi + opsiyonel mesaj)
 *         POST to /analytics/contact (mevcut endpoint, service:'discovery-call').
 *
 * iframe lazy mount: IntersectionObserver ile sadece kullanıcı scroll edince yüklenir.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { trackDiscoveryCallBook } from '../../lib/integrations/analytics';

const CALENDLY_URL = (import.meta.env.VITE_CALENDLY_URL ?? '').trim();
const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? '/api').replace(
  /\/$/,
  '',
);

interface CalendlyEmbedProps {
  source?: string;
  heightPx?: number;
  className?: string;
}

const TIMESLOT_OPTIONS = [
  { id: 'morning', label: 'Sabah (09:00 – 12:00)' },
  { id: 'afternoon', label: 'Öğleden sonra (13:00 – 17:00)' },
  { id: 'evening', label: 'Akşam (17:00 – 19:00)' },
] as const;

interface FormState {
  fullName: string;
  email: string;
  phone: string;
  timeslots: string[];
  message: string;
}

const INITIAL_FORM: FormState = {
  fullName: '',
  email: '',
  phone: '',
  timeslots: [],
  message: '',
};

export const CalendlyEmbed: React.FC<CalendlyEmbedProps> = ({
  source = 'calendly-embed',
  heightPx = 700,
  className = '',
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [shouldMount, setShouldMount] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!CALENDLY_URL) return;
    if (!('IntersectionObserver' in window)) {
      setShouldMount(true);
      return;
    }
    const node = wrapperRef.current;
    if (!node) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldMount(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px' },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const toggleTimeslot = (id: string) => {
    setForm((prev) => ({
      ...prev,
      timeslots: prev.timeslots.includes(id)
        ? prev.timeslots.filter((t) => t !== id)
        : [...prev.timeslots, id],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.fullName.trim() || !form.email.trim()) {
      setError('Lütfen ad ve email alanlarını doldurun.');
      return;
    }
    if (form.timeslots.length === 0) {
      setError('Lütfen en az bir zaman dilimi tercihi seçin.');
      return;
    }

    setSubmitting(true);
    try {
      const slotLabels = TIMESLOT_OPTIONS.filter((t) => form.timeslots.includes(t.id))
        .map((t) => t.label)
        .join(', ');
      const composedMessage =
        `Discovery Call talep — tercih edilen zaman dilimi: ${slotLabels}` +
        (form.message.trim() ? `\n\nNotlar: ${form.message.trim()}` : '');

      const res = await fetch(`${API_BASE}/v1/analytics/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          service: 'discovery-call',
          message: composedMessage,
          source: source || 'calendly-fallback',
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `HTTP ${res.status}`);
      }

      trackDiscoveryCallBook(source);
      setSuccess(true);
      setForm(INITIAL_FORM);
    } catch (err) {
      setError(
        err instanceof Error
          ? `Form gönderilemedi: ${err.message}`
          : 'Beklenmeyen bir hata oluştu.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Fallback: env yok → inline form
  if (!CALENDLY_URL) {
    if (success) {
      return (
        <div
          className={`p-8 md:p-10 bg-gradient-to-br from-emerald-500/10 to-secondary/5 border border-emerald-500/30 rounded-2xl text-center ${className}`}
          data-testid="calendly-fallback-success"
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 size={36} className="text-emerald-400 mx-auto mb-4" aria-hidden="true" />
          <h3 className="text-2xl font-serif font-bold text-white mb-3">
            Görüşme talebiniz alındı
          </h3>
          <p className="text-slate-300 leading-relaxed max-w-md mx-auto mb-4">
            Talebiniz iletildi. 24 saat içinde size uygun zaman dilimini onaylayan takvim bağlantısı
            ile döneceğiz.
          </p>
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="text-sm text-secondary hover:text-secondary/80 underline"
          >
            Yeni talep gönder
          </button>
        </div>
      );
    }

    return (
      <div
        ref={wrapperRef}
        className={`p-6 md:p-8 bg-gradient-to-br from-secondary/10 to-primary/5 border border-secondary/20 rounded-2xl ${className}`}
        data-testid="calendly-fallback"
      >
        <div className="flex items-center gap-3 mb-2">
          <Calendar size={24} className="text-secondary" aria-hidden="true" />
          <h3 className="text-2xl font-serif font-bold text-white">Discovery Call Planla</h3>
        </div>
        <p className="text-slate-300 mb-6 leading-relaxed text-sm">
          45 dakikalık ücretsiz keşif görüşmesi. Tercih ettiğiniz zaman dilimlerini işaretleyin, 24
          saat içinde takvim bağlantısı paylaşıyoruz.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-slate-200 mb-1">
                Ad Soyad <span className="text-secondary">*</span>
              </span>
              <input
                type="text"
                required
                autoComplete="name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-4 py-3 min-h-[44px] bg-white/5 border border-white/15 rounded-lg text-white placeholder-slate-500 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary/50"
                placeholder="Ahmet Yılmaz"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-slate-200 mb-1">
                E-posta <span className="text-secondary">*</span>
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 min-h-[44px] bg-white/5 border border-white/15 rounded-lg text-white placeholder-slate-500 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary/50"
                placeholder="ahmet@sirket.com"
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-sm font-medium text-slate-200 mb-1">
              Telefon <span className="text-slate-500">(opsiyonel)</span>
            </span>
            <input
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-4 py-3 min-h-[44px] bg-white/5 border border-white/15 rounded-lg text-white placeholder-slate-500 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary/50"
              placeholder="+90 5XX XXX XX XX"
            />
          </label>

          <fieldset>
            <legend className="block text-sm font-medium text-slate-200 mb-2">
              Tercih ettiğiniz zaman dilimleri <span className="text-secondary">*</span>{' '}
              <span className="text-slate-500 font-normal">(birden fazla seçebilirsiniz)</span>
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {TIMESLOT_OPTIONS.map((slot) => {
                const checked = form.timeslots.includes(slot.id);
                return (
                  <label
                    key={slot.id}
                    className={`flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-lg border cursor-pointer transition-colors ${
                      checked
                        ? 'bg-secondary/15 border-secondary text-white'
                        : 'bg-white/5 border-white/15 text-slate-300 hover:border-white/30'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTimeslot(slot.id)}
                      className="accent-secondary w-4 h-4"
                    />
                    <span className="text-sm font-medium">{slot.label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <label className="block">
            <span className="block text-sm font-medium text-slate-200 mb-1">
              Notlar <span className="text-slate-500">(opsiyonel)</span>
            </span>
            <textarea
              rows={3}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-4 py-3 bg-white/5 border border-white/15 rounded-lg text-white placeholder-slate-500 focus:border-secondary focus:outline-none focus:ring-1 focus:ring-secondary/50 resize-none"
              placeholder="Konuşmak istediğiniz konu, mevcut zorluklar, hedefler..."
            />
          </label>

          {error && (
            <div
              className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-sm"
              role="alert"
            >
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 min-h-[52px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-lg shadow-secondary/20"
          >
            {submitting ? 'Gönderiliyor…' : 'Görüşme Talebimi Gönder'}
            {!submitting && <ArrowRight size={18} aria-hidden="true" />}
          </button>

          <p className="text-xs text-slate-500 pt-2 leading-relaxed">
            Kişisel verileriniz KVKK uyumlu işlenir. Form sadece görüşme talebinizi iletmek için
            kullanılır.{' '}
            <a href="/privacy" className="text-secondary hover:underline">
              Gizlilik Politikası
            </a>
          </p>
        </form>
      </div>
    );
  }

  // Calendly URL set → iframe embed
  return (
    <div
      ref={wrapperRef}
      className={`bg-white/5 border border-white/10 rounded-2xl overflow-hidden ${className}`}
      style={{ minHeight: heightPx }}
      data-testid="calendly-embed"
    >
      {shouldMount ? (
        <iframe
          src={`${CALENDLY_URL}?hide_event_type_details=0&hide_gdpr_banner=1`}
          width="100%"
          height={heightPx}
          frameBorder="0"
          title="Discovery Call — Calendly slot picker"
          loading="lazy"
          onLoad={() => trackDiscoveryCallBook(source)}
        />
      ) : (
        <div
          className="flex items-center justify-center text-slate-400"
          style={{ minHeight: heightPx }}
        >
          <span className="text-sm">Calendly yükleniyor…</span>
        </div>
      )}
    </div>
  );
};
