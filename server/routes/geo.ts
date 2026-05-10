/**
 * Geo Routes — IP-based ülke tespiti + UI banner data
 *
 * GET /api/geo/lookup        → request IP'sinden ülke
 * GET /api/geo/banner        → UI'da gösterilecek lokal banner (currency, lang)
 * GET /api/geo/countries     → desteklenen ülke listesi (public/geo-data.json)
 * GET /api/geo/cache/stats   → cache istatistikleri (admin)
 *
 * Hız: header path < 1ms, MMDB < 5ms, fallback < 1ms.
 */
import { Router, Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { lookupGeo, extractIp, getCacheStats } from '../lib/geoip';
import { authenticate, requireRole } from '../middleware/auth';
import { logger } from '../config/logger';

const router = Router();

const GEO_DATA_PATH = path.resolve(process.cwd(), 'public/geo-data.json');

interface CountryMeta {
  code: string;
  tr: string;
  en: string;
  currency: string;
  flag: string;
}

let countryCache: { data: CountryMeta[] | null; expiresAt: number } = { data: null, expiresAt: 0 };

async function loadCountries(): Promise<CountryMeta[]> {
  if (countryCache.data && countryCache.expiresAt > Date.now()) return countryCache.data;
  try {
    const raw = await fs.readFile(GEO_DATA_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as { countries: CountryMeta[] };
    countryCache = { data: parsed.countries, expiresAt: Date.now() + 5 * 60_000 };
    return parsed.countries;
  } catch {
    // Fallback minimum set
    const fallback: CountryMeta[] = [
      { code: 'TR', tr: 'Türkiye', en: 'Turkey', currency: 'TRY', flag: '🇹🇷' },
      { code: 'US', tr: 'Amerika', en: 'United States', currency: 'USD', flag: '🇺🇸' },
      { code: 'GB', tr: 'Birleşik Krallık', en: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
      { code: 'DE', tr: 'Almanya', en: 'Germany', currency: 'EUR', flag: '🇩🇪' },
    ];
    countryCache = { data: fallback, expiresAt: Date.now() + 60_000 };
    return fallback;
  }
}

// ── GET /api/geo/lookup ─────────────────────────────────────
router.get('/lookup', async (req: Request, res: Response): Promise<void> => {
  try {
    const ip = extractIp(req);
    const cfCountry = (req.headers['cf-ipcountry'] as string) || null;
    const result = await lookupGeo(ip, cfCountry);
    res.json({
      status: 'success',
      data: {
        country: result.country,
        city: result.city,
        source: result.source,
      },
    });
  } catch (err) {
    logger.error('[geo/lookup] error', { message: (err as Error).message });
    res.status(500).json({ status: 'error', message: 'Geo lookup failed' });
  }
});

// ── GET /api/geo/banner ─────────────────────────────────────
router.get('/banner', async (req: Request, res: Response): Promise<void> => {
  try {
    const ip = extractIp(req);
    const cfCountry = (req.headers['cf-ipcountry'] as string) || null;
    const geo = await lookupGeo(ip, cfCountry);
    const countries = await loadCountries();

    const meta =
      countries.find((c) => c.code === geo.country) || countries.find((c) => c.code === 'TR');

    if (!meta) {
      res.json({ status: 'success', data: null });
      return;
    }

    res.json({
      status: 'success',
      data: {
        country: meta.code,
        nameTr: meta.tr,
        nameEn: meta.en,
        currency: meta.currency,
        flag: meta.flag,
        suggestedLang: meta.code === 'TR' ? 'tr' : 'en',
        message:
          meta.code === 'TR'
            ? `${meta.flag} Türkiye'den ziyaret ediyorsunuz — TRY fiyatlandırma aktif.`
            : `${meta.flag} Visiting from ${meta.en} — pricing in ${meta.currency}.`,
      },
    });
  } catch (err) {
    logger.error('[geo/banner] error', { message: (err as Error).message });
    res.status(500).json({ status: 'error', message: 'Geo banner failed' });
  }
});

// ── GET /api/geo/countries ──────────────────────────────────
router.get('/countries', async (_req: Request, res: Response): Promise<void> => {
  try {
    const countries = await loadCountries();
    res.json({ status: 'success', data: { items: countries, total: countries.length } });
  } catch (err) {
    logger.error('[geo/countries] error', { message: (err as Error).message });
    res.status(500).json({ status: 'error', message: 'Countries list failed' });
  }
});

// ── GET /api/geo/cache/stats (admin) ────────────────────────
router.get(
  '/cache/stats',
  authenticate,
  requireRole('ADMIN'),
  (_req: Request, res: Response): void => {
    res.json({ status: 'success', data: getCacheStats() });
  },
);

export default router;
