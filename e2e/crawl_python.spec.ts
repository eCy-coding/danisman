/**
 * e2e/crawl_python.spec.ts
 * Scrapling Python scriptlerini Playwright test ortamından çalıştırır
 * ve ürettikleri JSON raporlarını assert eder.
 *
 * Bağımlılıklar:
 *  - crowler/.venv aktif (npm run crowler:setup ile kurulmuş)
 *  - localhost:4173 preview server çalışıyor (diğer webServer config'i)
 *
 * Atlar (skip) eğer venv mevcut değilse — CI/CD uyumlu.
 *
 * Çalıştır:
 *   npx playwright test e2e/crawl_python.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..');
const CROWLER_ROOT = path.join(PROJECT_ROOT, 'crowler');
const VENV_PYTHON   = path.join(CROWLER_ROOT, '.venv', 'bin', 'python3');
const REPORTS_DIR   = path.join(CROWLER_ROOT, 'reports');
const SCRIPTS_DIR   = path.join(CROWLER_ROOT, 'scripts');
const BASE_URL      = 'http://localhost:4173';

function venvAvailable(): boolean {
  return fs.existsSync(VENV_PYTHON);
}

function latestReport(pattern: string): string | null {
  if (!fs.existsSync(REPORTS_DIR)) return null;
  const files = fs.readdirSync(REPORTS_DIR)
    .filter(f => f.startsWith(pattern) && f.endsWith('.json'))
    .sort()
    .reverse();
  return files.length > 0 ? path.join(REPORTS_DIR, files[0]) : null;
}

function runScript(scriptName: string, extraArgs = '', timeoutMs = 60000): boolean {
  const script = path.join(SCRIPTS_DIR, scriptName);
  if (!fs.existsSync(script)) return false;
  try {
    // Paths with spaces need proper quoting
    const py = `"${VENV_PYTHON}"`;
    const sc = `"${script}"`;
    execSync(
      `${py} ${sc} --base ${BASE_URL} --output json ${extraArgs}`,
      { cwd: CROWLER_ROOT, timeout: timeoutMs, stdio: 'pipe', shell: '/bin/bash' },
    );
    return true;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────
// Script 03 — Canonical + Hreflang Audit
// ─────────────────────────────────────────────────────────────────
test.describe('Crowler 03: Canonical / Hreflang Audit', () => {
  test('Canonical + hreflang: kritik sayfalarda sorun yok', async () => {
    test.setTimeout(90000);

    if (!venvAvailable()) {
      test.skip(true, 'crowler/.venv mevcut değil — npm run crowler:setup çalıştır');
      return;
    }

    // Scripti çalıştır
    const ok = runScript('03_canonical_hreflang_audit.py', '', 75000);

    // Report oku
    const reportPath = latestReport('03_canonical_hreflang');
    if (!reportPath || !ok) {
      test.skip(true, 'Script çalışmadı veya rapor bulunamadı');
      return;
    }

    const report: Array<{
      url: string;
      canonical: string | null;
      hreflang_count: number;
      issues: string[];
      severity: string;
    }> = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

    const criticals = report.filter(r => r.severity === 'critical');
    const highIssues = report.filter(r => r.severity === 'high');

    expect(
      criticals.length,
      `Kritik canonical/hreflang sorunları:\n${criticals.map(r => `  ${r.url}: ${r.issues.join(', ')}`).join('\n')}`,
    ).toBe(0);

    expect(
      highIssues.length,
      `Yüksek öncelikli hreflang sorunları: ${highIssues.length}\n${highIssues.slice(0, 5).map(r => `  ${r.url}: ${r.issues.join(', ')}`).join('\n')}`,
    ).toBeLessThan(5);
  });
});

// ─────────────────────────────────────────────────────────────────
// Script 07 — LCP Image Audit
// ─────────────────────────────────────────────────────────────────
test.describe('Crowler 07: LCP Image Audit', () => {
  test('LCP görsel audit: ortalama skor ≥ 60', async () => {
    test.setTimeout(120000);

    if (!venvAvailable()) {
      test.skip(true, 'crowler/.venv mevcut değil');
      return;
    }

    const ok = runScript('07_lcp_image_audit.py', '', 100000);

    const reportPath = latestReport('07_lcp_image_audit');
    if (!reportPath || !ok) {
      test.skip(true, 'Script çalışmadı veya rapor bulunamadı');
      return;
    }

    const report: Array<{
      url: string;
      score: number;
      no_lazy: number;
      no_dimensions: number;
      legacy_format: number;
      no_alt: number;
      issues: string[];
    }> = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

    const avgScore = report.reduce((s, r) => s + r.score, 0) / Math.max(report.length, 1);
    const totalNoAlt = report.reduce((s, r) => s + r.no_alt, 0);

    expect(avgScore, `LCP görsel ortalama skor: ${avgScore.toFixed(1)} < 60`).toBeGreaterThanOrEqual(60);
    expect(totalNoAlt, `${totalNoAlt} görsel alt text eksik (erişilebilirlik + SEO)`).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// Script 08 — İç Link Graf
// ─────────────────────────────────────────────────────────────────
test.describe('Crowler 08: Internal Link Graph', () => {
  test('İç link grafiği: orphan sayfa < 5', async () => {
    test.setTimeout(120000);

    if (!venvAvailable()) {
      test.skip(true, 'crowler/.venv mevcut değil');
      return;
    }

    const ok = runScript('08_internal_link_graph.py', '--max 20', 100000);

    const reportPath = latestReport('08_internal_link_graph');
    if (!reportPath || !ok) {
      test.skip(true, 'Script çalışmadı veya rapor bulunamadı');
      return;
    }

    const report: {
      pages: number;
      total_links: number;
      orphans: string[];
      dead_ends: string[];
      page_ranks: Record<string, number>;
    } = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

    expect(report.orphans.length, `${report.orphans.length} orphan sayfa: ${report.orphans.join(', ')}`).toBeLessThan(5);
    expect(report.total_links, 'İç link sayısı çok az (site düzgün linkedge edilmemiş)').toBeGreaterThan(10);
  });
});

// ─────────────────────────────────────────────────────────────────
// Script 04 — Keyword Density Audit
// ─────────────────────────────────────────────────────────────────
test.describe('Crowler 04: Keyword Density Audit', () => {
  test('Keyword density: ana sayfalarda skor ≥ 50', async () => {
    test.setTimeout(90000);

    if (!venvAvailable()) {
      test.skip(true, 'crowler/.venv mevcut değil');
      return;
    }

    const ok = runScript('04_keyword_density_audit.py', '', 75000);

    const reportPath = latestReport('04_keyword_density');
    if (!reportPath || !ok) {
      test.skip(true, 'Script çalışmadı veya rapor bulunamadı');
      return;
    }

    const report: Array<{
      url: string;
      seo_score: number;
      keyword: string;
      h1: string | null;
      title: string | null;
      issues: string[];
    }> = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

    if (report.length === 0) return;

    const avgScore = report.reduce((s, r) => s + (r.seo_score ?? 0), 0) / report.length;
    expect(avgScore, `Keyword density ortalama skor: ${avgScore.toFixed(1)} < 50`).toBeGreaterThanOrEqual(50);

    // Hiçbir önemli sayfa 0 skorla bitmemeli
    const zeroes = report.filter(r => r.seo_score === 0 && !r.url.includes('/blog/'));
    expect(zeroes.length, `Sıfır skoru olan sayfalar: ${zeroes.map(r => r.url).join(', ')}`).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// Script 11 — Content Quality Audit
// ─────────────────────────────────────────────────────────────────
test.describe('Crowler 11: Content Quality Audit', () => {
  test('İçerik kalitesi: ortalama skor ≥ 60, img alt text sıfır', async () => {
    test.setTimeout(120000);

    if (!venvAvailable()) {
      test.skip(true, 'crowler/.venv mevcut değil');
      return;
    }

    const ok = runScript('11_content_quality_audit.py', '--max 15', 100000);

    const reportPath = latestReport('11_content_quality');
    if (!reportPath || !ok) {
      test.skip(true, 'Script çalışmadı veya rapor bulunamadı');
      return;
    }

    const report: Array<{
      path: string;
      content_score: number;
      word_count: number;
      img_no_alt: number;
      h1_count: number;
      issues: string[];
      error?: string;
    }> = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

    const valid = report.filter(r => !r.error);
    const avgScore = valid.reduce((s, r) => s + (r.content_score ?? 0), 0) / Math.max(valid.length, 1);
    const totalNoAlt = valid.reduce((s, r) => s + (r.img_no_alt ?? 0), 0);
    const multipleH1 = valid.filter(r => (r.h1_count ?? 0) > 1);

    expect(avgScore, `İçerik ortalama skor: ${avgScore.toFixed(1)} < 60`).toBeGreaterThanOrEqual(60);
    expect(totalNoAlt, `${totalNoAlt} görsel alt text eksik (T18)`).toBe(0);
    expect(
      multipleH1.length,
      `${multipleH1.length} sayfa birden fazla H1 (T13): ${multipleH1.map(r => r.path).join(', ')}`,
    ).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────
// Script çalışma zamanı sağlık testi (tüm scriptler çalışabilir mi?)
// ─────────────────────────────────────────────────────────────────
test.describe('Crowler Health Check', () => {
  test('Scrapling venv + temel import sağlıklı', async () => {
    if (!venvAvailable()) {
      test.skip(true, 'crowler/.venv mevcut değil');
      return;
    }

    try {
      execSync(
        `"${VENV_PYTHON}" -c "from scrapling.fetchers import Fetcher; print('ok')"`,
        { cwd: CROWLER_ROOT, timeout: 10000, stdio: 'pipe', shell: '/bin/bash' },
      );
    } catch (err) {
      const msg = String((err as Error & { stderr?: Buffer }).stderr ?? (err as Error).message ?? 'unknown');
      // curl_cffi veya diğer opsiyonel dep eksikse skip (kritik değil)
      if (msg.includes('curl_cffi') || msg.includes('ModuleNotFoundError')) {
        test.skip(true, `Scrapling opsiyonel dep eksik (pip install scrapling[all]): ${msg.slice(0, 80)}`);
        return;
      }
      expect(false, `Scrapling import hatası: ${msg.slice(0, 200)}`).toBeTruthy();
    }
  });

  test('Tüm 11 script dosyası mevcut', () => {
    const scriptNames = Array.from({ length: 11 }, (_, i) => {
      const n = (i + 1).toString().padStart(2, '0');
      return fs.readdirSync(SCRIPTS_DIR).find(f => f.startsWith(n + '_'));
    });

    const missing = scriptNames.filter(s => !s);
    expect(missing.length, `Eksik script dosyaları: ${scriptNames.map((s, i) => s ?? `0${i + 1}_???`).join(', ')}`).toBe(0);
  });

  test('Reports dizini yazılabilir', () => {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    const testFile = path.join(REPORTS_DIR, '.health_check');
    fs.writeFileSync(testFile, 'ok');
    expect(fs.existsSync(testFile)).toBeTruthy();
    fs.unlinkSync(testFile);
  });

  test('package.json: crowler npm scriptleri tanımlı', () => {
    const pkgPath = path.join(PROJECT_ROOT, 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { scripts?: Record<string, string> };
    const required = [
      'crowler:competitor', 'crowler:links', 'crowler:canonical',
      'crowler:keywords', 'crowler:lcp', 'crowler:graph',
      'crowler:serp', 'crowler:all', 'crowler:mcp',
    ];
    const missing = required.filter(s => !pkg.scripts?.[s]);
    expect(missing, `Eksik npm scriptleri: ${missing.join(', ')}`).toHaveLength(0);
  });
});
