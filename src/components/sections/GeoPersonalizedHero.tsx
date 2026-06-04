/**
 * GeoPersonalizedHero — Coğrafi Kişiselleştirilmiş Hero Bloğu
 * istek5.txt Phase 4: SEO & Geo — Location-Aware Content
 *
 * - `/api/geo/banner` → ülkeye göre mesaj, para birimi, CTA metni
 * - TR: "İstanbul'dan merhaba! Türk lirası ile hizmet alın"
 * - EU: "Welcome from [City]! Services in EUR"
 * - Loading: skeleton, Error: default content
 * - Currency-aware fiyat gösterimi (currencyStore)
 * - Fallback: statik hero içeriği (geo olmadan da çalışır)
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Globe, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from '../../lib/i18n';
import { useCurrencyStore } from '../../stores/currencyStore';
import { apiClient } from '../../lib/api';

interface GeoBannerData {
  country: string;
  nameTr: string;
  nameEn: string;
  currency: string;
  flag: string;
  suggestedLang: 'tr' | 'en';
  message: string;
}

interface ApiResponse {
  status: 'success' | 'error';
  data: GeoBannerData | null;
}

const GEO_CONTENT: Record<
  string,
  { headline: { tr: string; en: string }; cta: { tr: string; en: string }; color: string }
> = {
  TR: {
    headline: {
      tr: "Türkiye'nin En İyi Danışmanlık Deneyimi",
      en: "Turkey's Premier Consulting Experience",
    },
    cta: { tr: 'TL ile Başlayın', en: 'Start in TRY' },
    color: 'text-red-400',
  },
  DE: {
    headline: { tr: "Almanya'dan Global Büyüme", en: 'Global Growth from Germany' },
    cta: { tr: 'EUR ile Başlayın', en: 'Start in EUR' },
    color: 'text-amber-400',
  },
  GB: {
    headline: { tr: "Londra'nın Stratejik Vizyonu", en: "London's Strategic Vision" },
    cta: { tr: 'GBP ile Başlayın', en: 'Start in GBP' },
    color: 'text-blue-400',
  },
  AE: {
    headline: { tr: "Dubai'den Küresel Danışmanlık", en: 'Global Consulting from Dubai' },
    cta: { tr: 'USD ile Başlayın', en: 'Start in USD' },
    color: 'text-emerald-400',
  },
};

const DEFAULT_CONTENT = {
  headline: {
    tr: 'Sizin İçin Kişiselleştirilmiş Danışmanlık',
    en: 'Consulting Personalized for You',
  },
  cta: { tr: 'Başlayın', en: 'Get Started' },
  color: 'text-secondary',
};

// R6-C2 — placeholderData seed. Default to TR because (a) it's the
// largest single-country traffic slice for ecypro.com, (b) any TR/EU
// banner has identical layout dimensions to the resolved banner so the
// pixel box never shifts. The real geo response will replace these
// fields in-place once the API responds.
const PLACEHOLDER_RESPONSE: ApiResponse = {
  status: 'success',
  data: {
    country: 'TR',
    nameTr: 'Türkiye',
    nameEn: 'Türkiye',
    currency: 'TRY',
    flag: '🇹🇷',
    suggestedLang: 'tr',
    message: '',
  },
};

export const GeoPersonalizedHero: React.FC = () => {
  const { i18n } = useTranslation();
  const lang = (i18n.language || 'en').startsWith('tr') ? 'tr' : 'en';
  const { currency } = useCurrencyStore();

  // R6-C2 — placeholderData eliminates the skeleton CLS flicker. The geo
  // banner API has variable latency (Cloudflare → Render cold-start path
  // is 300-1200ms), and the previous isLoading skeleton swap caused a
  // visible layout shift when the real banner painted. We hand back a
  // generic "TR" default immediately so the first render is real content;
  // when the actual geo data arrives TanStack swaps it in without
  // remounting the subtree.
  const { data } = useQuery<ApiResponse>({
    queryKey: ['geo-banner'],
    queryFn: () => apiClient.get<ApiResponse>('/geo/banner').then((r) => r.data),
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    placeholderData: PLACEHOLDER_RESPONSE,
  });

  const geoData = data?.data;
  const content = (geoData ? GEO_CONTENT[geoData.country] : null) ?? DEFAULT_CONTENT;

  if (!geoData) return null; // fallback: zaten mevcut hero yeterli

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      data-testid="geo-personalized-hero"
      className="py-6 px-4 sm:px-6"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-4 rounded-2xl border border-white/10 bg-linear-to-r from-white/3 to-transparent px-6 py-5">
          {/* Location badge + headline */}
          <div className="flex items-start gap-3">
            <div className="flex items-center gap-2 mt-1">
              <span className="text-2xl" aria-hidden="true">
                {geoData.flag}
              </span>
              <MapPin size={14} className={`${content.color} shrink-0`} aria-hidden="true" />
            </div>
            <div>
              <p className={`text-xs font-mono uppercase tracking-widest ${content.color} mb-1`}>
                <Globe size={10} className="inline mr-1" aria-hidden="true" />
                {lang === 'tr' ? geoData.nameTr : geoData.nameEn}
              </p>
              <h2 className="text-base sm:text-lg font-medium text-white">
                {lang === 'tr' ? content.headline.tr : content.headline.en}
              </h2>
            </div>
          </div>

          {/* Currency + CTA */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-xs text-slate-500">
                {lang === 'tr' ? 'Fiyatlandırma' : 'Pricing in'}
              </p>
              <p className="text-sm font-mono font-semibold text-white">{currency}</p>
            </div>
            <Link
              to="/pricing"
              data-testid="geo-hero-cta"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary ${
                content.color === 'text-secondary'
                  ? 'border-secondary/30 text-secondary hover:bg-secondary/10'
                  : 'border-white/10 text-white hover:bg-white/5'
              }`}
            >
              {lang === 'tr' ? content.cta.tr : content.cta.en}
              <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
