/**
 * P54.D3 — Social proof live feed.
 *
 * Anonimleştirilmiş aktivite akışı (sahte ama makul, satış baskısı YOK):
 *   "İstanbul'dan bir CEO Discovery Call rezerve etti — 6 dk önce"
 *   "Ankara'dan bir CFO Annual Report 2025'i indirdi — 14 dk önce"
 *
 * KVKK uyumu: sadece şehir + role; isim/firma YOK.
 * Public feed üzerinden gerçek lead sayımı yapılır (placeholder feed
 * ENV `VITE_SOCIAL_PROOF_FEED` ile gerçek endpoint'e bağlanır).
 *
 * Default: in-memory rotating feed (no network).
 * Throttle: 8sn aralıkta yeni item; max 1 görünür.
 */

import React, { useEffect, useState } from 'react';
import { MapPin, Sparkles } from 'lucide-react';

interface ProofItem {
  id: string;
  city: string;
  role: string;
  action: string;
  minutesAgo: number;
}

const DEFAULT_ITEMS: ProofItem[] = [
  { id: '1', city: 'İstanbul', role: 'CEO', action: 'Discovery Call rezerve etti', minutesAgo: 4 },
  { id: '2', city: 'Ankara', role: 'CFO', action: 'Annual Report 2025\'i indirdi', minutesAgo: 11 },
  { id: '3', city: 'İzmir', role: 'COO', action: 'Operasyonel Mükemmellik hizmetini inceledi', minutesAgo: 17 },
  { id: '4', city: 'Bursa', role: 'Genel Müdür', action: 'Aile Şirketleri pillar sayfasını okudu', minutesAgo: 23 },
  { id: '5', city: 'Antalya', role: 'CIO', action: 'AI & Analytics widget\'ı denedi', minutesAgo: 31 },
  { id: '6', city: 'Eskişehir', role: 'CFO', action: 'Yatırım Teşvikleri Hızlı Audit talep etti', minutesAgo: 38 },
  { id: '7', city: 'Amsterdam', role: 'CSO', action: 'ESG Strategy sayfasında 9 dk geçirdi', minutesAgo: 44 },
  { id: '8', city: 'Berlin', role: 'CEO', action: 'Methodology sayfasını paylaştı', minutesAgo: 52 },
];

const FEED_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SOCIAL_PROOF_FEED)
  ? String(import.meta.env.VITE_SOCIAL_PROOF_FEED).trim()
  : '';

const ROTATION_MS = 8_000;
const VISIBLE_MS = 6_000;

function isProofItem(value: unknown): value is ProofItem {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === 'string' &&
    typeof v.city === 'string' &&
    typeof v.role === 'string' &&
    typeof v.action === 'string' &&
    typeof v.minutesAgo === 'number'
  );
}

async function fetchFeed(): Promise<ProofItem[]> {
  if (!FEED_URL) return DEFAULT_ITEMS;
  try {
    const res = await fetch(FEED_URL, { cache: 'no-store' });
    if (!res.ok) return DEFAULT_ITEMS;
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return DEFAULT_ITEMS;
    const cleaned = data.filter(isProofItem);
    return cleaned.length > 0 ? cleaned : DEFAULT_ITEMS;
  } catch {
    return DEFAULT_ITEMS;
  }
}

export interface SocialProofFeedProps {
  /** True ise sağ-alt köşede sabit; false ise akışta inline. */
  floating?: boolean;
  /** Mobil'de gizle (default true — UX'i karıştırmaz). */
  hideOnMobile?: boolean;
}

export const SocialProofFeed: React.FC<SocialProofFeedProps> = ({
  floating = true,
  hideOnMobile = true,
}) => {
  const [items, setItems] = useState<ProofItem[]>(DEFAULT_ITEMS);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    fetchFeed().then(setItems);
  }, []);

  useEffect(() => {
    if (items.length === 0) return;
    let cancelled = false;

    const show = () => {
      if (cancelled) return;
      setVisible(true);
      window.setTimeout(() => {
        if (!cancelled) setVisible(false);
      }, VISIBLE_MS);
    };

    show();
    const interval = window.setInterval(() => {
      if (cancelled) return;
      setCurrentIdx((idx) => (idx + 1) % items.length);
      show();
    }, ROTATION_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [items.length]);

  if (items.length === 0) return null;
  const item = items[currentIdx];
  if (!item) return null;

  const wrapperClass = [
    floating ? 'fixed bottom-20 md:bottom-6 left-4 md:left-6 z-20' : 'inline-block',
    hideOnMobile ? 'hidden md:block' : '',
    'transition-all duration-300 ease-out',
    visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <aside
      aria-label="Aktivite akışı"
      data-testid="social-proof-feed"
      className={wrapperClass}
    >
      <div className="max-w-xs bg-neutral/95 backdrop-blur-sm border border-white/10 rounded-xl shadow-2xl px-4 py-3 flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-secondary/15 border border-secondary/30 flex items-center justify-center">
          <Sparkles size={14} className="text-secondary" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 text-[11px] text-slate-400 uppercase tracking-[0.15em] mb-1">
            <MapPin size={10} aria-hidden="true" />
            <span>{item.city}</span>
            <span aria-hidden="true">·</span>
            <span>{item.role}</span>
          </div>
          <p className="text-xs text-white leading-snug">
            {item.action}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            {item.minutesAgo} dk önce
          </p>
        </div>
      </div>
    </aside>
  );
};

export default SocialProofFeed;
