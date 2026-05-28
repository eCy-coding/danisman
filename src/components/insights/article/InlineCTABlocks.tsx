import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

type CTAType = 'newsletter' | 'discovery' | 'service';

interface InlineCTABlocksProps {
  type: CTAType;
  serviceSlug?: string;
  serviceTitle?: string;
  className?: string;
}

export function InlineCTABlocks({
  type,
  serviceSlug,
  serviceTitle,
  className,
}: InlineCTABlocksProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  if (type === 'newsletter') {
    return (
      <div
        className={cn(
          'my-fib-8 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 p-fib-7 text-white',
          className,
        )}
        data-testid="cta-newsletter"
      >
        <h3 className="font-bold text-xl mb-2">Founder Letter</h3>
        <p className="text-amber-100 text-sm mb-fib-5">
          Her hafta M&A, ESG ve aile şirketi dünyasından seçkiler. 2.400+ okuyucu.
        </p>
        {subscribed ? (
          <p className="font-semibold text-white">Teşekkürler! Abone oldunuz.</p>
        ) : (
          <div className="flex gap-fib-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e-posta adresiniz"
              className="flex-1 rounded-lg px-fib-4 py-fib-3 text-sm text-slate-800 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="E-posta adresi"
            />
            <button
              onClick={() => email && setSubscribed(true)}
              className="rounded-lg bg-white px-fib-5 py-fib-3 text-sm font-bold text-amber-600 hover:bg-amber-50 transition-colors"
            >
              Abone ol
            </button>
          </div>
        )}
      </div>
    );
  }

  if (type === 'discovery') {
    return (
      <div
        className={cn('my-fib-8 rounded-xl bg-slate-900 p-fib-7 text-white', className)}
        data-testid="cta-discovery"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2 block">
          Keşif Görüşmesi
        </span>
        <h3 className="font-bold text-xl mb-2">48 saatte NDA + taslak teklif</h3>
        <p className="text-slate-400 text-sm mb-fib-6">
          Gizlilik anlaşması imzalandıktan sonra 48 saat içinde sektörünüze özel taslak teklifimizi
          sunarız.
        </p>
        <Link
          to="/discovery"
          className="inline-flex items-center gap-fib-3 rounded-lg bg-amber-500 px-fib-6 py-fib-4 text-sm font-bold text-white hover:bg-amber-400 transition-colors"
          data-testid="cta-discovery-button"
        >
          Görüşme rezervasyonu
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>
    );
  }

  if (type === 'service' && serviceSlug) {
    return (
      <div
        className={cn('my-fib-8 rounded-xl border-2 border-amber-200 p-fib-6', className)}
        data-testid="cta-service"
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 mb-2 block">
          İlgili Hizmet
        </span>
        <h3 className="font-bold text-slate-800 text-lg mb-2">
          {serviceTitle ?? 'Hizmetimizi Keşfedin'}
        </h3>
        <p className="text-sm text-slate-600 mb-fib-5">
          Bu konuda profesyonel destek almak için hizmet sayfamızı inceleyin.
        </p>
        <Link
          to={`/services/${serviceSlug}`}
          className="inline-flex items-center gap-fib-2 text-sm font-semibold text-amber-600 hover:text-amber-800 transition-colors"
          data-testid="cta-service-link"
        >
          Detayları gör
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      </div>
    );
  }

  return null;
}
