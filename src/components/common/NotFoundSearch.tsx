/**
 * P56.G8 — NotFoundPage suggestion search.
 *
 * Static site route hint search: user 404 sayfasında bir kelime yazar,
 * client-side route registry içinden eşleşen sayfa(lar) sunulur.
 *
 * Network çağrısı YOK; KNOWN_ROUTES sabit listesi ile fuzzy substring match.
 */

import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';

interface RouteHint {
  path: string;
  label: { tr: string; en: string };
  keywords: string[];
}

const KNOWN_ROUTES: RouteHint[] = [
  {
    path: '/services',
    label: { tr: 'Hizmetler', en: 'Services' },
    keywords: ['hizmet', 'service', 'kapsam'],
  },
  {
    path: '/services/strategic-transformation',
    label: { tr: 'Stratejik Dönüşüm', en: 'Strategic Transformation' },
    keywords: ['strateji', 'dönüşüm', 'transformation', 'vision'],
  },
  {
    path: '/services/mergers-acquisitions',
    label: { tr: 'Birleşme & Devralmalar', en: 'M&A' },
    keywords: ['m&a', 'birleşme', 'merger', 'satın alma'],
  },
  {
    path: '/services/family-business',
    label: { tr: 'Aile Şirketleri', en: 'Family Business' },
    keywords: ['aile', 'kuşak', 'family'],
  },
  {
    path: '/services/operational-excellence',
    label: { tr: 'Operasyonel Mükemmellik', en: 'Operational Excellence' },
    keywords: ['operasyon', 'verim', 'efficiency'],
  },
  {
    path: '/services/esg-strategy',
    label: { tr: 'ESG Stratejisi', en: 'ESG Strategy' },
    keywords: ['esg', 'sürdürülebilirlik', 'sustainability', 'cbam'],
  },
  {
    path: '/services/ai-analytics',
    label: { tr: 'AI & Analitik', en: 'AI & Analytics' },
    keywords: ['ai', 'analitik', 'analytics', 'yapay zeka'],
  },
  {
    path: '/pillar/stratejik-donusum',
    label: { tr: 'Pillar: Stratejik Dönüşüm', en: 'Pillar: Strategic Transformation' },
    keywords: ['pillar', 'kapsamli', 'rehber'],
  },
  {
    path: '/annual-report/2025',
    label: { tr: 'Yıllık Rapor 2025', en: 'Annual Report 2025' },
    keywords: ['annual', 'yıllık', 'rapor', 'report', '2025'],
  },
  {
    path: '/methodology',
    label: { tr: '5 Katmanlı Metodoloji', en: 'Methodology' },
    keywords: ['methodology', 'metodoloji', 'method'],
  },
  {
    path: '/about',
    label: { tr: 'Hakkımızda', en: 'About' },
    keywords: ['about', 'hakkımızda', 'biz kimiz'],
  },
  {
    path: '/contact',
    label: { tr: 'İletişim', en: 'Contact' },
    keywords: ['contact', 'iletişim', 'görüşme', 'discovery'],
  },
  {
    path: '/pricing',
    label: { tr: 'Ücretlendirme', en: 'Pricing' },
    keywords: ['pricing', 'fiyat', 'ücret', 'tarife'],
  },
  {
    path: '/blog',
    label: { tr: 'Perspektifler', en: 'Perspectives' },
    keywords: ['blog', 'perspektif', 'içgörü', 'insight'],
  },
  {
    path: '/case-studies',
    label: { tr: 'Vaka Analizleri', en: 'Case Studies' },
    keywords: ['case', 'vaka', 'study'],
  },
  { path: '/team', label: { tr: 'Ekip', en: 'Team' }, keywords: ['team', 'ekip', 'kadro'] },
  {
    path: '/careers',
    label: { tr: 'Kariyer', en: 'Careers' },
    keywords: ['career', 'kariyer', 'iş ilanları'],
  },
  { path: '/faq', label: { tr: 'SSS', en: 'FAQ' }, keywords: ['faq', 'sss', 'soru', 'cevap'] },
  {
    path: '/press',
    label: { tr: 'Press Kit', en: 'Press Kit' },
    keywords: ['press', 'medya', 'basın'],
  },
  {
    path: '/privacy',
    label: { tr: 'Gizlilik', en: 'Privacy' },
    keywords: ['privacy', 'gizlilik', 'kvkk', 'gdpr'],
  },
  {
    path: '/data-rights',
    label: { tr: 'KVKK Hakları', en: 'KVKK Rights' },
    keywords: ['kvkk', 'data', 'gdpr', 'haklar'],
  },
  {
    path: '/terms',
    label: { tr: 'Kullanım Şartları', en: 'Terms' },
    keywords: ['terms', 'şartlar', 'kullanım'],
  },
];

function score(hint: RouteHint, query: string): number {
  const q = query.toLowerCase().trim();
  if (!q) return 0;
  let s = 0;
  if (hint.path.toLowerCase().includes(q)) s += 4;
  for (const kw of hint.keywords) {
    if (kw.includes(q) || q.includes(kw)) s += 3;
  }
  for (const lang of ['tr', 'en'] as const) {
    if (hint.label[lang].toLowerCase().includes(q)) s += 2;
  }
  return s;
}

export const NotFoundSearch: React.FC<{ lang?: 'tr' | 'en' }> = ({ lang = 'tr' }) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    return KNOWN_ROUTES.map((r) => ({ hint: r, s: score(r, query) }))
      .filter((r) => r.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 5);
  }, [query]);

  const placeholder =
    lang === 'tr' ? 'örn. M&A, KVKK, yıllık rapor…' : 'e.g. M&A, KVKK, annual report…';

  return (
    <div className="max-w-xl mx-auto mb-12">
      <label className="relative block">
        <span className="sr-only">{lang === 'tr' ? 'Sayfa ara' : 'Search pages'}</span>
        <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
          <Search size={16} aria-hidden="true" />
        </span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-white text-base placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary/30"
          autoComplete="off"
        />
      </label>
      {results.length > 0 && (
        <ul className="mt-3 bg-white/[0.02] border border-white/10 rounded-xl overflow-hidden text-left">
          {results.map(({ hint }) => (
            <li key={hint.path} className="border-b border-white/5 last:border-b-0">
              <Link
                to={hint.path}
                className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-semibold truncate">{hint.label[lang]}</p>
                  <p className="text-xs text-slate-400 truncate">{hint.path}</p>
                </div>
                <ArrowRight size={14} className="text-secondary flex-shrink-0" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
      {query.trim().length >= 2 && results.length === 0 && (
        <p className="mt-3 text-sm text-slate-400">
          {lang === 'tr'
            ? `“${query}” için eşleşme yok. Anasayfa veya hizmetler sayfasından devam edebilirsiniz.`
            : `No match for “${query}”. Continue from home or services.`}
        </p>
      )}
    </div>
  );
};

export default NotFoundSearch;
