/**
 * P63.B — Service detail public override fetcher.
 *
 * Admin'in `PATCH /api/admin/content/service/:slug` ile Redis'e yazdığı
 * override'ı public-side'da çeker. Bulunamazsa null döner (static
 * `service-content.ts` zaten fallback).
 *
 * SWR + 60sn refresh; admin SSE event'i de cache invalidate edebilir.
 */

import { useEffect, useState } from 'react';

export interface ServiceOverride {
  heroTitle?: string;
  heroSubtitle?: string;
  valueProp?: string;
  painPoints?: string;
  outcomes?: string;
  investmentRange?: string;
  timeline?: string;
  caseStudyAnonymized?: string;
}

interface FetcherState {
  data: ServiceOverride | null;
  loading: boolean;
  error: Error | null;
}

const cache = new Map<string, ServiceOverride | null>();
const inflight = new Map<string, Promise<ServiceOverride | null>>();

async function fetchOverride(slug: string): Promise<ServiceOverride | null> {
  const baseURL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
  try {
    const res = await fetch(`${baseURL}/public/services/${slug}`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: { override?: ServiceOverride | null } };
    return json.data?.override ?? null;
  } catch {
    return null;
  }
}

export function useServiceOverride(slug: string): FetcherState {
  const [state, setState] = useState<FetcherState>(() => ({
    data: cache.get(slug) ?? null,
    loading: !cache.has(slug),
    error: null,
  }));

  useEffect(() => {
    let cancelled = false;
    if (cache.has(slug)) {
      setState({ data: cache.get(slug) ?? null, loading: false, error: null });
      return;
    }
    const existing = inflight.get(slug) ?? (inflight.set(slug, fetchOverride(slug)).get(slug)!);
    existing
      .then((data) => {
        cache.set(slug, data);
        inflight.delete(slug);
        if (!cancelled) setState({ data, loading: false, error: null });
      })
      .catch((err: Error) => {
        inflight.delete(slug);
        if (!cancelled) setState({ data: null, loading: false, error: err });
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return state;
}

export function invalidateServiceOverride(slug: string): void {
  cache.delete(slug);
}
