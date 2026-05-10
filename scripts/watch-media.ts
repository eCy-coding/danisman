/**
 * Media Watcher — public/ ve src/assets/ izle, kaydedilen image'ları optimize et
 *
 * - PNG/JPG → Sharp ile WebP + AVIF üret (yan yana, override etmez)
 * - Manifest: public/.media-manifest.json (image hash + boyut + format'lar)
 * - Debounce 800ms (toplu save için)
 * - Graceful SIGTERM → manifest flush
 *
 * NOT: Sharp opsiyonel — yoksa graceful skip + uyarı.
 */
import { watch } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const ROOT = path.resolve(process.cwd());
const WATCH_DIRS = ['public', 'src/assets'];
const MANIFEST_PATH = path.join(ROOT, 'public/.media-manifest.json');
const SUPPORTED = /\.(png|jpe?g)$/i;
const DEBOUNCE_MS = 800;

interface ManifestEntry {
  source: string;
  hash: string;
  sizeBytes: number;
  webp?: string;
  avif?: string;
  updatedAt: string;
}

let manifest: Record<string, ManifestEntry> = {};
const pendingFiles = new Set<string>();
let debounceTimer: NodeJS.Timeout | null = null;
let sharp: typeof import('sharp') | null = null;

async function tryLoadSharp(): Promise<void> {
  try {
    sharp = (await import('sharp')).default as unknown as typeof import('sharp');
    log('info', 'sharp yüklendi → WebP/AVIF optimize aktif');
  } catch {
    log('warn', 'sharp yok → sadece manifest tracking aktif (npm i -D sharp ile aktive et)');
  }
}

function log(level: 'info' | 'warn' | 'error', msg: string): void {
  const stamp = new Date().toISOString().slice(11, 19);
  const tag = level === 'error' ? '✖' : level === 'warn' ? '⚠' : '▶';
  console.log(`[${stamp}] ${tag} media-watch: ${msg}`);
}

async function loadManifest(): Promise<void> {
  try {
    const raw = await fs.readFile(MANIFEST_PATH, 'utf-8');
    manifest = JSON.parse(raw) as Record<string, ManifestEntry>;
    log('info', `manifest yüklendi: ${Object.keys(manifest).length} entry`);
  } catch {
    manifest = {};
  }
}

async function saveManifest(): Promise<void> {
  try {
    await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf-8');
  } catch (err) {
    log('error', `manifest yazılamadı: ${(err as Error).message}`);
  }
}

async function hashFile(filePath: string): Promise<string> {
  const buf = await fs.readFile(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex').slice(0, 12);
}

async function processFile(absPath: string): Promise<void> {
  const relPath = path.relative(ROOT, absPath);
  if (!SUPPORTED.test(absPath)) return;

  let stat;
  try {
    stat = await fs.stat(absPath);
  } catch {
    return;
  }

  const hash = await hashFile(absPath);
  if (manifest[relPath]?.hash === hash) return;

  const entry: ManifestEntry = {
    source: relPath,
    hash,
    sizeBytes: stat.size,
    updatedAt: new Date().toISOString(),
  };

  if (sharp) {
    const dir = path.dirname(absPath);
    const base = path.basename(absPath, path.extname(absPath));
    const webpPath = path.join(dir, `${base}.webp`);
    const avifPath = path.join(dir, `${base}.avif`);

    try {
      await sharp(absPath).webp({ quality: 82 }).toFile(webpPath);
      entry.webp = path.relative(ROOT, webpPath);
    } catch (err) {
      log('warn', `webp üretilemedi (${relPath}): ${(err as Error).message}`);
    }
    try {
      await sharp(absPath).avif({ quality: 65, effort: 5 }).toFile(avifPath);
      entry.avif = path.relative(ROOT, avifPath);
    } catch (err) {
      log('warn', `avif üretilemedi (${relPath}): ${(err as Error).message}`);
    }
  }

  manifest[relPath] = entry;
  log('info', `optimize edildi: ${relPath} (${(stat.size / 1024).toFixed(1)} KB)`);
}

async function flush(): Promise<void> {
  const files = Array.from(pendingFiles);
  pendingFiles.clear();
  for (const f of files) {
    try {
      await processFile(f);
    } catch (err) {
      log('error', `${f}: ${(err as Error).message}`);
    }
  }
  await saveManifest();
}

function watchRecursive(dir: string): void {
  const abs = path.join(ROOT, dir);
  fs.access(abs)
    .then(() => {
      watch(abs, { recursive: true }, (_evt, filename) => {
        if (!filename) return;
        const full = path.join(abs, filename.toString());
        if (!SUPPORTED.test(full)) return;
        pendingFiles.add(full);
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          void flush();
        }, DEBOUNCE_MS);
      });
      log('info', `izleniyor: ${dir}/`);
    })
    .catch(() => {
      log('warn', `${dir}/ yok → atlandı`);
    });
}

async function main(): Promise<void> {
  log('info', '🎬 EcyPro Media Watcher başlatılıyor...');
  await tryLoadSharp();
  await loadManifest();
  WATCH_DIRS.forEach(watchRecursive);
  log('info', `manifest: ${MANIFEST_PATH}`);
  log('info', 'CTRL-C ile çıkış');
}

let stopping = false;
async function shutdown(signal: string): Promise<void> {
  if (stopping) return;
  stopping = true;
  log('info', `${signal} alındı, manifest flush ediliyor...`);
  if (debounceTimer) clearTimeout(debounceTimer);
  await flush();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

main().catch((err) => {
  log('error', `fatal: ${(err as Error).message}`);
  process.exit(1);
});
