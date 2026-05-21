/**
 * Geo Watcher — GeoIP veri yenileme + ülke banner data üretimi
 *
 * Görev:
 *   1. MaxMind GeoLite2-Country.mmdb haftalık yenile (varsa MAXMIND_LICENSE_KEY)
 *   2. public/geo-data.json üret: top 50 ülke kod/isim + currency mapping
 *   3. server/lib/geoip.ts cache'ini invalidate et (HUP signal)
 *
 * Çalışma: dakikada 1 idle check, haftada 1 gerçek refresh.
 */
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

const ROOT = path.resolve(process.cwd());
const GEO_DATA_PATH = path.join(ROOT, 'public/geo-data.json');
const MMDB_PATH = path.join(ROOT, 'data/GeoLite2-Country.mmdb');
const CHECK_INTERVAL_MS = 60_000; // 1 dk idle
const REFRESH_INTERVAL_MS = 7 * 24 * 60 * 60_000; // 7 gün

const TOP_COUNTRIES: Array<{
  code: string;
  tr: string;
  en: string;
  currency: string;
  flag: string;
}> = [
  { code: 'TR', tr: 'Türkiye', en: 'Turkey', currency: 'TRY', flag: '🇹🇷' },
  { code: 'US', tr: 'Amerika', en: 'United States', currency: 'USD', flag: '🇺🇸' },
  { code: 'GB', tr: 'Birleşik Krallık', en: 'United Kingdom', currency: 'GBP', flag: '🇬🇧' },
  { code: 'DE', tr: 'Almanya', en: 'Germany', currency: 'EUR', flag: '🇩🇪' },
  { code: 'FR', tr: 'Fransa', en: 'France', currency: 'EUR', flag: '🇫🇷' },
  { code: 'NL', tr: 'Hollanda', en: 'Netherlands', currency: 'EUR', flag: '🇳🇱' },
  { code: 'AE', tr: 'BAE', en: 'UAE', currency: 'AED', flag: '🇦🇪' },
  { code: 'SA', tr: 'Suudi Arabistan', en: 'Saudi Arabia', currency: 'SAR', flag: '🇸🇦' },
  { code: 'AZ', tr: 'Azerbaycan', en: 'Azerbaijan', currency: 'AZN', flag: '🇦🇿' },
  { code: 'CA', tr: 'Kanada', en: 'Canada', currency: 'CAD', flag: '🇨🇦' },
  { code: 'AU', tr: 'Avustralya', en: 'Australia', currency: 'AUD', flag: '🇦🇺' },
  { code: 'IT', tr: 'İtalya', en: 'Italy', currency: 'EUR', flag: '🇮🇹' },
  { code: 'ES', tr: 'İspanya', en: 'Spain', currency: 'EUR', flag: '🇪🇸' },
  { code: 'CH', tr: 'İsviçre', en: 'Switzerland', currency: 'CHF', flag: '🇨🇭' },
  { code: 'AT', tr: 'Avusturya', en: 'Austria', currency: 'EUR', flag: '🇦🇹' },
  { code: 'BE', tr: 'Belçika', en: 'Belgium', currency: 'EUR', flag: '🇧🇪' },
  { code: 'SE', tr: 'İsveç', en: 'Sweden', currency: 'SEK', flag: '🇸🇪' },
  { code: 'NO', tr: 'Norveç', en: 'Norway', currency: 'NOK', flag: '🇳🇴' },
  { code: 'DK', tr: 'Danimarka', en: 'Denmark', currency: 'DKK', flag: '🇩🇰' },
  { code: 'PL', tr: 'Polonya', en: 'Poland', currency: 'PLN', flag: '🇵🇱' },
  { code: 'CZ', tr: 'Çekya', en: 'Czechia', currency: 'CZK', flag: '🇨🇿' },
  { code: 'GR', tr: 'Yunanistan', en: 'Greece', currency: 'EUR', flag: '🇬🇷' },
  { code: 'BG', tr: 'Bulgaristan', en: 'Bulgaria', currency: 'BGN', flag: '🇧🇬' },
  { code: 'RO', tr: 'Romanya', en: 'Romania', currency: 'RON', flag: '🇷🇴' },
  { code: 'EG', tr: 'Mısır', en: 'Egypt', currency: 'EGP', flag: '🇪🇬' },
  { code: 'QA', tr: 'Katar', en: 'Qatar', currency: 'QAR', flag: '🇶🇦' },
  { code: 'KW', tr: 'Kuveyt', en: 'Kuwait', currency: 'KWD', flag: '🇰🇼' },
  { code: 'IL', tr: 'İsrail', en: 'Israel', currency: 'ILS', flag: '🇮🇱' },
  { code: 'IN', tr: 'Hindistan', en: 'India', currency: 'INR', flag: '🇮🇳' },
  { code: 'JP', tr: 'Japonya', en: 'Japan', currency: 'JPY', flag: '🇯🇵' },
  { code: 'KR', tr: 'Güney Kore', en: 'South Korea', currency: 'KRW', flag: '🇰🇷' },
  { code: 'CN', tr: 'Çin', en: 'China', currency: 'CNY', flag: '🇨🇳' },
  { code: 'SG', tr: 'Singapur', en: 'Singapore', currency: 'SGD', flag: '🇸🇬' },
  { code: 'BR', tr: 'Brezilya', en: 'Brazil', currency: 'BRL', flag: '🇧🇷' },
  { code: 'MX', tr: 'Meksika', en: 'Mexico', currency: 'MXN', flag: '🇲🇽' },
  { code: 'AR', tr: 'Arjantin', en: 'Argentina', currency: 'ARS', flag: '🇦🇷' },
  { code: 'ZA', tr: 'Güney Afrika', en: 'South Africa', currency: 'ZAR', flag: '🇿🇦' },
  { code: 'NG', tr: 'Nijerya', en: 'Nigeria', currency: 'NGN', flag: '🇳🇬' },
  { code: 'KE', tr: 'Kenya', en: 'Kenya', currency: 'KES', flag: '🇰🇪' },
  { code: 'MA', tr: 'Fas', en: 'Morocco', currency: 'MAD', flag: '🇲🇦' },
  { code: 'PT', tr: 'Portekiz', en: 'Portugal', currency: 'EUR', flag: '🇵🇹' },
  { code: 'IE', tr: 'İrlanda', en: 'Ireland', currency: 'EUR', flag: '🇮🇪' },
  { code: 'FI', tr: 'Finlandiya', en: 'Finland', currency: 'EUR', flag: '🇫🇮' },
  { code: 'HU', tr: 'Macaristan', en: 'Hungary', currency: 'HUF', flag: '🇭🇺' },
  { code: 'UA', tr: 'Ukrayna', en: 'Ukraine', currency: 'UAH', flag: '🇺🇦' },
  { code: 'GE', tr: 'Gürcistan', en: 'Georgia', currency: 'GEL', flag: '🇬🇪' },
  { code: 'RU', tr: 'Rusya', en: 'Russia', currency: 'RUB', flag: '🇷🇺' },
  { code: 'TH', tr: 'Tayland', en: 'Thailand', currency: 'THB', flag: '🇹🇭' },
  { code: 'ID', tr: 'Endonezya', en: 'Indonesia', currency: 'IDR', flag: '🇮🇩' },
  { code: 'MY', tr: 'Malezya', en: 'Malaysia', currency: 'MYR', flag: '🇲🇾' },
];

function log(level: 'info' | 'warn' | 'error', msg: string): void {
  const stamp = new Date().toISOString().slice(11, 19);
  const tag = level === 'error' ? '✖' : level === 'warn' ? '⚠' : '▶';
  console.log(`[${stamp}] ${tag} geo-watch: ${msg}`);
}

async function writeGeoData(): Promise<void> {
  const data = {
    countries: TOP_COUNTRIES,
    updatedAt: new Date().toISOString(),
    version: '1.0',
  };
  await fs.mkdir(path.dirname(GEO_DATA_PATH), { recursive: true });
  await fs.writeFile(GEO_DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
  log('info', `geo-data.json yazıldı (${TOP_COUNTRIES.length} ülke)`);
}

async function downloadMmdb(): Promise<void> {
  const licenseKey = process.env.MAXMIND_LICENSE_KEY;
  if (!licenseKey) {
    log(
      'warn',
      'MAXMIND_LICENSE_KEY yok → MMDB indirme atlandı (Cloudflare CF-IPCountry header fallback aktif)',
    );
    return;
  }

  const url = `https://download.maxmind.com/app/geoip_download?edition_id=GeoLite2-Country&license_key=${licenseKey}&suffix=tar.gz`;
  await fs.mkdir(path.dirname(MMDB_PATH), { recursive: true });

  log('info', 'MaxMind MMDB indiriliyor...');
  const tmpFile = MMDB_PATH + '.tar.gz';

  await new Promise<void>((resolve, reject) => {
    const proc = spawn('curl', ['-fSL', '-o', tmpFile, url], { stdio: 'inherit' });
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`curl exit ${code}`))));
  });

  await new Promise<void>((resolve, reject) => {
    const proc = spawn(
      'tar',
      [
        '-xzf',
        tmpFile,
        '-C',
        path.dirname(MMDB_PATH),
        '--strip-components=1',
        '--wildcards',
        '*/GeoLite2-Country.mmdb',
      ],
      { stdio: 'inherit' },
    );
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`tar exit ${code}`))));
  });

  await fs.unlink(tmpFile).catch(() => {
    /* ignore */
  });
  log('info', `MMDB güncellendi: ${MMDB_PATH}`);
}

async function refresh(): Promise<void> {
  try {
    await writeGeoData();
    await downloadMmdb();
  } catch (err) {
    log('error', `refresh hatası: ${(err as Error).message}`);
  }
}

let stopping = false;
let timer: NodeJS.Timeout | null = null;
let lastRefresh = 0;

async function tick(): Promise<void> {
  if (stopping) return;
  if (Date.now() - lastRefresh > REFRESH_INTERVAL_MS) {
    await refresh();
    lastRefresh = Date.now();
  }
  timer = setTimeout(() => void tick(), CHECK_INTERVAL_MS);
}

async function main(): Promise<void> {
  log('info', '🧭 eCyPro Geo Watcher başlatılıyor...');
  await refresh();
  lastRefresh = Date.now();
  log(
    'info',
    `idle check her ${CHECK_INTERVAL_MS / 1000}s | refresh her ${REFRESH_INTERVAL_MS / 86_400_000} gün`,
  );
  await tick();
}

function shutdown(signal: string): void {
  if (stopping) return;
  stopping = true;
  log('info', `${signal} → temiz çıkış`);
  if (timer) clearTimeout(timer);
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

main().catch((err) => {
  log('error', `fatal: ${(err as Error).message}`);
  process.exit(1);
});
