/**
 * P56.G10 — Newsletter status pages (confirmed / unsubscribed / invalid-token).
 *
 * Tek bir component üç ayrı route'a hizmet eder. Backend
 * `/api/newsletter/confirm/:token` ve `/api/newsletter/unsubscribe/:token`
 * uçları başarılı / başarısız durumda buraya redirect eder.
 *
 * Route'lar:
 *   /newsletter/confirmed      → success after double opt-in
 *   /newsletter/unsubscribed   → success after one-click unsubscribe
 *   /newsletter/invalid-token  → expired / tampered token
 *
 * Hepsi statik SPA sayfası; user-side interaction yok (sadece bilgi + bir CTA).
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckCircle2, MailX, AlertTriangle, ArrowRight } from 'lucide-react';
import { SEO } from '../components/common/SEO';
import { apiClient } from '../lib/api';

type Variant = 'confirmed' | 'unsubscribed' | 'invalid-token';

const COPY: Record<Variant, { title: string; heading: string; body: string; icon: 'check' | 'mailx' | 'alert' }> = {
  confirmed: {
    title: 'Bülten Onaylandı | EcyPro Premium Consulting',
    heading: 'Bülten kaydınız onaylandı.',
    body:
      'KVKK çift-onayını tamamladığınız için teşekkürler. Ayda en fazla 1 mektup; satış baskısı yok, anonim engagement öğrenimi var. İlk içerik 3 gün içinde gelir.',
    icon: 'check',
  },
  unsubscribed: {
    title: 'Bülten Aboneliği İptal Edildi | EcyPro Premium Consulting',
    heading: 'Aboneliğiniz başarıyla iptal edildi.',
    body:
      'Sizi listeden çıkardık. Bu bir an meselesi olduysa tekrar abone olmak isterseniz ana sayfa altındaki formu kullanabilirsiniz. Nedeninizi öğrenmek isteriz — aşağıdaki anonim formla 30 saniyede paylaşabilirsiniz.',
    icon: 'mailx',
  },
  'invalid-token': {
    title: 'Geçersiz Bağlantı | EcyPro Premium Consulting',
    heading: 'Bağlantı geçerli değil veya süresi dolmuş.',
    body:
      'Bu bağlantı 30 günü aştığı için veya değiştirilmiş olduğu için doğrulanamadı. Yeni bir bülten aboneliği başlatabilir veya iletişime geçebilirsiniz.',
    icon: 'alert',
  },
};

function detectVariant(pathname: string): Variant {
  if (pathname.includes('/confirmed')) return 'confirmed';
  if (pathname.includes('/unsubscribed')) return 'unsubscribed';
  return 'invalid-token';
}

export const NewsletterStatusPage: React.FC = () => {
  const { pathname, search } = useLocation();
  const variant = detectVariant(pathname);
  const copy = COPY[variant];

  const Icon =
    copy.icon === 'check' ? CheckCircle2 : copy.icon === 'mailx' ? MailX : AlertTriangle;
  const iconColor =
    copy.icon === 'check' ? 'text-secondary' : copy.icon === 'alert' ? 'text-amber-400' : 'text-slate-400';

  return (
    <div className="min-h-screen bg-neutral flex items-center justify-center px-6 py-24">
      <SEO
        title={copy.title}
        description={copy.body}
        canonical={pathname}
        noIndex
      />
      <article className="max-w-xl w-full text-center">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full border ${
          copy.icon === 'check'
            ? 'border-secondary/30 bg-secondary/10'
            : copy.icon === 'alert'
              ? 'border-amber-400/30 bg-amber-400/10'
              : 'border-white/15 bg-white/5'
        } mb-6`}>
          <Icon size={28} className={iconColor} aria-hidden="true" />
        </div>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4 leading-tight">
          {copy.heading}
        </h1>
        <p className="text-slate-300 leading-relaxed mb-8">{copy.body}</p>

        {variant === 'unsubscribed' && <UnsubscribeFeedbackForm search={search} />}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] rounded-xl bg-secondary text-neutral font-semibold hover:bg-secondary/90 transition-colors"
          >
            Anasayfa <ArrowRight size={16} />
          </Link>
          {variant === 'invalid-token' && (
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 min-h-[48px] rounded-xl border border-white/15 text-white font-semibold hover:bg-white/5 transition-colors"
            >
              İletişime Geç
            </Link>
          )}
        </div>
      </article>
    </div>
  );
};

const UnsubscribeFeedbackForm: React.FC<{ search: string }> = ({ search }) => {
  const [category, setCategory] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      // Email ham olarak yok; backend kategori + sayım tutar (KVKK).
      // Search query string'inde reason=optional gibi parametre olabilir; göz ardı.
      const params = new URLSearchParams(search);
      const email = params.get('email') ?? 'unknown@example.com';
      await apiClient.post('/newsletter/feedback', { email, category: category || undefined, reason: reason || undefined });
      setStatus('sent');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'sent') {
    return (
      <p className="text-sm text-secondary mb-6">
        Geri bildiriminiz için teşekkürler. Bültenimizi geliştirmek için kullanacağız.
      </p>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white/[0.02] border border-white/10 rounded-xl p-5 mb-6 text-left space-y-3"
    >
      <p className="text-sm text-slate-300 font-semibold">Anonim geri bildirim (zorunlu değil)</p>
      <label className="block">
        <span className="text-xs text-slate-400">Sebep kategorisi</span>
        <select
          className="mt-1 w-full bg-neutral border border-white/15 rounded-lg px-3 py-2 text-white text-sm"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">— seçim yapmadım —</option>
          <option value="too-frequent">Çok sık geliyordu</option>
          <option value="not-relevant">İçerik benim ilgi alanım değildi</option>
          <option value="never-subscribed">Hiç abone olmadım</option>
          <option value="tone-too-salesy">Tonu çok ticariydi</option>
          <option value="other">Diğer</option>
        </select>
      </label>
      <label className="block">
        <span className="text-xs text-slate-400">Ek açıklama (opsiyonel)</span>
        <textarea
          className="mt-1 w-full bg-neutral border border-white/15 rounded-lg px-3 py-2 text-white text-sm min-h-[80px]"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          placeholder="Bu bilgi DB'ye yazılmaz; kategori + sayım agrege tutulur."
        />
      </label>
      {status === 'error' && (
        <p className="text-xs text-red-400">Geri bildirim gönderilemedi. Lütfen daha sonra dener veya info@ecypro.com'a yazın.</p>
      )}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-semibold hover:bg-white/15 disabled:opacity-50"
      >
        {status === 'sending' ? 'Gönderiliyor…' : 'Geri bildirim gönder'}
      </button>
    </form>
  );
};

export default NewsletterStatusPage;
