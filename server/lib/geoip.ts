/**
 * GeoIP Lookup — IP → ülke/şehir
 *
 * Strateji:
 *   1. Cloudflare CF-IPCountry header (en hızlı, edge'de zaten var)
 *   2. MaxMind GeoLite2-Country.mmdb (varsa, lazy load)
 *   3. Fallback "TR" (ana pazar)
 *
 * Cache: in-memory LRU (max 1000 entry, 1 saat TTL).
 * Privacy: ip son oktet sıfırlanır log'larda.
 */
import path from 'path';
import { logger } from '../config/logger';

const MMDB_PATH = path.resolve(process.cwd(), 'data/GeoLite2-Country.mmdb');
const CACHE_TTL_MS = 60 * 60_000;
const CACHE_MAX = 1000;

interface CacheEntry {
  country: string;
  city?: string;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

let mmdbReader: {
  country: (ip: string) => { country?: { isoCode: string }; city?: { names: { en: string } } };
} | null = null;
let mmdbLoadAttempted = false;

async function tryLoadMmdb(): Promise<void> {
  if (mmdbLoadAttempted) return;
  mmdbLoadAttempted = true;
  try {
    const fs = await import('fs/promises');
    await fs.access(MMDB_PATH);

    // @ts-expect-error — maxmind opsiyonel dep, yoksa graceful fallback
    const maxmind = await import('maxmind').catch(() => null);
    if (!maxmind) {
      logger.warn('[geoip] maxmind paketi yok → fallback aktif (npm i maxmind ile aktive et)');
      return;
    }

    mmdbReader = (await (maxmind as { open: (p: string) => Promise<unknown> }).open(
      MMDB_PATH,
    )) as never;
    logger.info('[geoip] MaxMind MMDB yüklendi');
  } catch (err) {
    logger.warn('[geoip] MMDB yüklenemedi → header/fallback', { err: (err as Error).message });
  }
}

void tryLoadMmdb();

function maskIp(ip: string): string {
  // IPv4: son okteti sıfırla. IPv6: son 64 bit'i sıfırla.
  if (ip.includes('.')) {
    const parts = ip.split('.');
    parts[3] = '0';
    return parts.join('.');
  }
  if (ip.includes(':')) {
    return ip.split(':').slice(0, 4).join(':') + '::';
  }
  return ip;
}

function evictExpired(): void {
  if (cache.size < CACHE_MAX) return;
  const now = Date.now();
  for (const [k, v] of cache) {
    if (v.expiresAt < now) cache.delete(k);
  }
  // Hâlâ doluysa en eski 100'ü sil
  if (cache.size >= CACHE_MAX) {
    const keys = Array.from(cache.keys()).slice(0, 100);
    keys.forEach((k) => cache.delete(k));
  }
}

export interface GeoResult {
  country: string;
  city?: string;
  source: 'cache' | 'header' | 'mmdb' | 'fallback';
}

/**
 * IP'den geo bilgi çıkar.
 * @param ip IP adresi (IPv4 veya IPv6)
 * @param cfCountry Cloudflare CF-IPCountry header (varsa)
 * @returns GeoResult — country ISO code (TR, US, ...)
 */
export async function lookupGeo(
  ip: string | undefined,
  cfCountry?: string | null,
): Promise<GeoResult> {
  // 1. Cloudflare header (zaten edge'de bilinmiş)
  if (cfCountry && /^[A-Z]{2}$/.test(cfCountry)) {
    return { country: cfCountry, source: 'header' };
  }

  if (!ip) return { country: 'TR', source: 'fallback' };

  // Localhost/private network → TR
  if (/^(127\.|::1|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(ip)) {
    return { country: 'TR', source: 'fallback' };
  }

  // 2. Cache
  const masked = maskIp(ip);
  const cached = cache.get(masked);
  if (cached && cached.expiresAt > Date.now()) {
    return { country: cached.country, city: cached.city, source: 'cache' };
  }

  // 3. MMDB
  if (mmdbReader) {
    try {
      const result = mmdbReader.country(ip);
      const country = result?.country?.isoCode ?? 'TR';
      const city = result?.city?.names?.en;
      cache.set(masked, { country, city, expiresAt: Date.now() + CACHE_TTL_MS });
      evictExpired();
      return { country, city, source: 'mmdb' };
    } catch {
      // ignore, fall through
    }
  }

  // 4. Fallback
  return { country: 'TR', source: 'fallback' };
}

/** Express request → IP çıkar (proxy aware) */
export function extractIp(req: {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}): string {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string') {
    const parts = xff.split(',');
    if (parts.length > 0 && parts[0]) {
      return parts[0].trim();
    }
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp) return realIp;
  return req.ip ?? '';
}

/** Cache stats — debug için */
export function getCacheStats(): { size: number; max: number; ttlMs: number } {
  return { size: cache.size, max: CACHE_MAX, ttlMs: CACHE_TTL_MS };
}

/** Cache temizleme — test/admin için */
export function clearGeoCache(): void {
  cache.clear();
}
