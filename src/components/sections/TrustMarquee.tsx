import React from 'react';
import { Building2, Factory, Zap, Truck, ShieldCheck, Cpu } from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Track C #5 — Replaced the prior "Trusted by Industry Leaders" marquee that
// displayed third-party wordmarks (Stripe / Vercel / Nvidia / Cloudflare /
// McKinsey / AWS) we have no contractual right to claim. Showing those
// names without permission is a Lanham Act / TTK reklam mevzuatı risk and
// implies an endorsement that does not exist.
//
// New copy: "Çalıştığımız sektörler / Sectors we serve" — neutral category
// labels with generic Lucide icons, no third-party brand marks.
const SECTORS = [
  {
    id: 'finance',
    icon: Building2,
    label: { tr: 'Finansal Hizmetler', en: 'Financial Services' },
  },
  {
    id: 'manufacturing',
    icon: Factory,
    label: { tr: 'Üretim', en: 'Manufacturing' },
  },
  {
    id: 'energy',
    icon: Zap,
    label: { tr: 'Enerji & ESG', en: 'Energy & ESG' },
  },
  {
    id: 'logistics',
    icon: Truck,
    label: { tr: 'Lojistik', en: 'Logistics' },
  },
  {
    id: 'compliance',
    icon: ShieldCheck,
    label: { tr: 'Uyum & KVKK', en: 'Compliance & KVKK' },
  },
  {
    id: 'technology',
    icon: Cpu,
    label: { tr: 'Teknoloji', en: 'Technology' },
  },
];

export const TrustMarquee = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? ('tr' as const) : ('en' as const);
  const heading = lang === 'tr' ? 'Çalıştığımız sektörler' : 'Sectors we serve';

  return (
    <section
      className="w-full py-16 bg-neutral border-b border-ecypro-gold/15"
      aria-labelledby="sectors-heading"
    >
      <div className="container mx-auto px-4 mb-10 text-center">
        <p
          id="sectors-heading"
          className="text-xs font-bold text-ecypro-gold uppercase tracking-[0.25em]"
        >
          {heading}
        </p>
      </div>
      <ul className="container mx-auto px-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
        {SECTORS.map((s) => {
          const Icon = s.icon;
          return (
            <li
              key={s.id}
              className="flex flex-col items-center gap-3 p-4 rounded-xl border border-white/5 bg-white/[0.02] text-slate-300 hover:border-ecypro-gold/30 hover:text-white transition-colors duration-300"
            >
              <Icon className="w-7 h-7 text-ecypro-gold/80" aria-hidden="true" />
              <span className="text-sm font-medium tracking-wide text-center">{s.label[lang]}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
