/**
 * GeoBanner — IP/Cloudflare header'a göre lokal ülke önerisi banner'ı
 *
 * - `/api/geo/banner` endpoint'inden ülke bilgisi çeker (TanStack Query)
 * - TR ziyaretçiler için render edilmez (zaten yerel, gürültü yapmaz)
 * - Dismiss → localStorage `ecypro_geo_banner_dismissed` 7 gün
 * - Slide-down animasyon (motion/react), reduced motion uyumlu
 * - Erişilebilir: role=region, aria-live=polite, focusable dismiss
 */

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Globe, X } from 'lucide-react';
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

const STORAGE_KEY = 'ecypro_geo_banner_dismissed';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 gün

function isDismissed(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function setDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* private mode → ignore */
  }
}

export const GeoBanner: React.FC = () => {
  const [dismissed, setDismissedState] = useState<boolean>(true);
  const prefersReduced = useReducedMotion();

  // Dismiss durumunu yalnızca client'ta hesapla (SSR güvenli)
  useEffect(() => {
    setDismissedState(isDismissed());
  }, []);

  const { data, isError } = useQuery<ApiResponse>({
    queryKey: ['geo-banner'],
    queryFn: () => apiClient.get<ApiResponse>('/geo/banner').then((r) => r.data),
    staleTime: 60 * 60 * 1000, // 1h
    gcTime: 2 * 60 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
    enabled: !dismissed,
  });

  const handleDismiss = (): void => {
    setDismissed();
    setDismissedState(true);
  };

  // Görünmemesi gereken durumlar
  if (dismissed) return null;
  if (isError || !data?.data) return null;
  // TR fallback ve TR ziyaretçi → gizle (kullanıcı zaten yerel)
  if (data.data.country === 'TR') return null;

  const banner = data.data;

  return (
    <AnimatePresence>
      <motion.div
        key="geo-banner"
        initial={prefersReduced ? false : { y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={prefersReduced ? undefined : { y: -40, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        role="region"
        aria-label="Konum önerisi"
        aria-live="polite"
        data-testid="geo-banner"
        className="relative z-40 bg-linear-to-r from-secondary/15 via-secondary/10 to-transparent border-b border-secondary/20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Globe className="w-4 h-4 text-secondary shrink-0" aria-hidden="true" />
            <span className="text-2xl shrink-0" aria-hidden="true">
              {banner.flag}
            </span>
            <p className="text-xs sm:text-sm text-slate-200 truncate">
              <span className="font-medium text-white">{banner.message}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Banner'ı kapat"
            data-testid="geo-banner-dismiss"
            className="shrink-0 p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
