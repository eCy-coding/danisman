/**
 * SEO Watcher — blog & sayfalar değiştiğinde otomatik SEO yenile
 *
 * İzler:
 *   - src/content/blog/*.mdx → sitemap + RSS regenerate
 *   - src/pages/*.tsx        → canonical audit
 *
 * Çalıştırır (debounce 1500ms):
 *   - npm run gen:sitemap
 *   - npm run gen:rss
 *   - npm run audit:canonical (uyarı seviyesinde)
 *
 * Phase 31-32 disiplini: her save sonrası SEO bütünlüğü canlı kontrol.
 */
import { watch } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

const ROOT = path.resolve(process.cwd());
const BLOG_DIR = path.join(ROOT, 'src/content/blog');
const PAGES_DIR = path.join(ROOT, 'src/pages');
const DEBOUNCE_MS = 1500;

let pendingTasks = new Set<string>();
let debounceTimer: NodeJS.Timeout | null = null;

function log(level: 'info' | 'warn' | 'error', msg: string): void {
  const stamp = new Date().toISOString().slice(11, 19);
  const tag = level === 'error' ? '✖' : level === 'warn' ? '⚠' : '▶';
  console.log(`[${stamp}] ${tag} seo-watch: ${msg}`);
}

function runScript(scriptName: string): Promise<{ ok: boolean; output: string }> {
  return new Promise((resolve) => {
    const proc = spawn('npm', ['run', scriptName], {
      cwd: ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '0' },
    });

    let output = '';
    proc.stdout.on('data', (d) => (output += d.toString()));
    proc.stderr.on('data', (d) => (output += d.toString()));

    const timeout = setTimeout(() => {
      proc.kill('SIGTERM');
      resolve({ ok: false, output: output + '\n[timeout]' });
    }, 60_000);

    proc.on('close', (code) => {
      clearTimeout(timeout);
      resolve({ ok: code === 0, output });
    });
  });
}

async function flush(): Promise<void> {
  const tasks = Array.from(pendingTasks);
  pendingTasks = new Set();

  if (tasks.includes('blog')) {
    log('info', 'blog değişti → sitemap + RSS yenileniyor...');
    const [sitemap, rss] = await Promise.all([runScript('gen:sitemap'), runScript('gen:rss')]);
    log(
      sitemap.ok ? 'info' : 'warn',
      `sitemap: ${sitemap.ok ? '✅' : '⚠ ' + sitemap.output.split('\n').slice(-3).join(' | ')}`,
    );
    log(
      rss.ok ? 'info' : 'warn',
      `rss: ${rss.ok ? '✅' : '⚠ ' + rss.output.split('\n').slice(-3).join(' | ')}`,
    );
  }

  if (tasks.includes('pages')) {
    log('info', 'sayfa değişti → canonical audit (background)...');
    runScript('audit:canonical')
      .then((r) => {
        log(r.ok ? 'info' : 'warn', `canonical audit: ${r.ok ? '✅' : '⚠ uyarı var'}`);
      })
      .catch(() => {
        /* ignore */
      });
  }
}

async function watchDir(dir: string, taskName: string): Promise<void> {
  try {
    await fs.access(dir);
    watch(dir, { recursive: true }, (_evt, filename) => {
      if (!filename) return;
      const name = filename.toString();
      if (!/\.(mdx?|tsx?)$/.test(name)) return;
      pendingTasks.add(taskName);
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        void flush();
      }, DEBOUNCE_MS);
    });
    log('info', `izleniyor: ${path.relative(ROOT, dir)}/`);
  } catch {
    log('warn', `${path.relative(ROOT, dir)}/ yok → atlandı`);
  }
}

async function main(): Promise<void> {
  log('info', '🔎 eCyPro SEO Watcher başlatılıyor...');
  await Promise.all([watchDir(BLOG_DIR, 'blog'), watchDir(PAGES_DIR, 'pages')]);
  log('info', 'tetikleyiciler: gen:sitemap, gen:rss, audit:canonical');
  log('info', 'CTRL-C ile çıkış');
}

let stopping = false;
async function shutdown(signal: string): Promise<void> {
  if (stopping) return;
  stopping = true;
  log('info', `${signal} → temiz çıkış`);
  if (debounceTimer) clearTimeout(debounceTimer);
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

main().catch((err) => {
  log('error', `fatal: ${(err as Error).message}`);
  process.exit(1);
});
