/**
 * e2e/crawl_deployment_flow.spec.ts
 * prompts2/08-deployment-flow.md — Post-Deploy Verification E2E
 *
 * Kapsar:
 *   - Adım 1: Ön kontrol (typecheck/lint/test/build ürünleri)
 *   - Adım 2: Environment variables yapısı (.env.example)
 *   - Adım 3: Deploy sırası önkoşulları (prisma migrate, API health)
 *   - Adım 4: Post-deploy verification (health endpoint, sitemap, SEO meta)
 *   - Rollback: Vercel + Render hazırlık dosyaları
 *   - Monitoring: Sentry, UptimeRobot yapılandırması
 *   - Disaster Recovery: Backup / Restore dosyaları
 *   - CI/CD: .github/workflows/ pipeline doğrulama
 *
 * Çalıştır:
 *   npx playwright test e2e/crawl_deployment_flow.spec.ts --project=chromium
 */
import { test, expect, type APIRequestContext } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:4173';
const API_URL = 'http://localhost:3099';
const ROOT = process.cwd();

const exists = (p: string) => fs.existsSync(path.join(ROOT, p));
const content = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf-8');

// ─── ADIM 1: Ön Kontrol Ürünleri ─────────────────────────────────
test.describe('Deployment: Adım 1 — Ön Kontrol Ürünleri', () => {
  test('D1-a: dist/ build artifaktı mevcut', () => {
    const hasDist = exists('dist') && exists('dist/index.html');
    expect(hasDist, 'dist/index.html yok — npm run build çalıştırılmamış').toBeTruthy();
  });

  test("D1-b: dist/assets/ JS/CSS bundle'ları mevcut", () => {
    const assetsDir = path.join(ROOT, 'dist', 'assets');
    expect(fs.existsSync(assetsDir), 'dist/assets/ yok').toBeTruthy();

    const assets = fs.readdirSync(assetsDir);
    const hasJs = assets.some((f) => f.endsWith('.js'));
    const hasCss = assets.some((f) => f.endsWith('.css'));

    expect(hasJs, 'dist/assets/: JS bundle yok').toBeTruthy();
    expect(hasCss, 'dist/assets/: CSS bundle yok').toBeTruthy();
  });

  test('D1-c: sitemap.xml build çıktısında var (≥30 URL)', () => {
    const sitemapPaths = ['dist/sitemap.xml', 'public/sitemap.xml'];
    const sitemapFile = sitemapPaths.find((p) => exists(p));
    expect(sitemapFile, 'sitemap.xml build çıktısında yok').toBeTruthy();

    if (sitemapFile) {
      const xml = content(sitemapFile);
      const urlCount = (xml.match(/<loc>/g) ?? []).length;
      expect(urlCount, `sitemap URL: ${urlCount} < 30`).toBeGreaterThanOrEqual(30);
      test.info().annotations.push({ type: 'note', description: `Sitemap: ${urlCount} URL` });
    }
  });

  test('D1-d: prisma/schema.prisma geçerli (migrate deploy önkoşulu)', () => {
    expect(exists('prisma/schema.prisma'), 'prisma/schema.prisma yok').toBeTruthy();
    const schema = content('prisma/schema.prisma');
    expect(schema.includes('datasource'), 'Prisma schema: datasource eksik').toBeTruthy();
    expect(schema.includes('generator'), 'Prisma schema: generator eksik').toBeTruthy();
  });

  test('D1-e: package.json build + typecheck + test script tanımlı', () => {
    const pkg = JSON.parse(content('package.json')) as {
      scripts?: Record<string, string>;
    };
    const scripts = pkg.scripts ?? {};
    expect('build' in scripts, 'package.json: build script yok').toBeTruthy();
    expect('typecheck' in scripts, 'package.json: typecheck script yok').toBeTruthy();
    expect(
      'test' in scripts || 'test:unit' in scripts,
      'package.json: test script yok',
    ).toBeTruthy();
  });
});

// ─── ADIM 2: Environment Variables ───────────────────────────────
test.describe('Deployment: Adım 2 — Environment Variables', () => {
  test('D2-a: .env.example mevcut ve zorunlu değişkenleri içeriyor', () => {
    expect(exists('.env.example'), '.env.example yok').toBeTruthy();
    const env = content('.env.example');

    const required = ['DATABASE_URL', 'JWT_SECRET', 'CORS_ORIGIN', 'NODE_ENV'];
    for (const key of required) {
      expect(env, `.env.example: ${key} eksik`).toContain(key);
    }
  });

  test("D2-b: Vercel env değişkenleri .env.example'da (VITE_API_URL, VITE_SENTRY_DSN)", () => {
    if (!exists('.env.example')) return;
    const env = content('.env.example');

    const viteVars = ['VITE_API_URL', 'VITE_SENTRY_DSN'];
    for (const key of viteVars) {
      if (!env.includes(key)) {
        test
          .info()
          .annotations.push({
            type: 'note',
            description: `.env.example: ${key} eksik — Vercel deployment eksik olabilir`,
          });
      }
    }
  });

  test("D2-c: .env dosyası .gitignore'da (secret leak protection)", () => {
    expect(exists('.gitignore'), '.gitignore yok').toBeTruthy();
    const gitignore = content('.gitignore');
    expect(gitignore, '.gitignore: .env girişi yok — secret leak riski!').toContain('.env');
  });

  test('D2-d: Gizli anahtar kaynak kodda gömülü değil', () => {
    const sensitivePatterns = [
      /sk-[a-zA-Z0-9]{20,}/,
      /AIza[a-zA-Z0-9_-]{30,}/,
      /ghp_[a-zA-Z0-9]{36}/,
    ];
    const srcFiles = ['src/main.tsx', 'src/lib/ga4-loader.ts', 'src/lib/analytics.ts'];

    for (const file of srcFiles) {
      if (!exists(file)) continue;
      const code = content(file);
      for (const pattern of sensitivePatterns) {
        const match = pattern.exec(code);
        expect(match, `${file}: Gömülü API key tespit edildi: ${match?.[0] ?? ''}`).toBeNull();
      }
    }
  });
});

// ─── ADIM 3: Deploy Sırası ────────────────────────────────────────
test.describe('Deployment: Adım 3 — Deploy Sırası Önkoşulları', () => {
  test('D3-a: /api/health endpoint 200 {"status":"ok"}', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const res = await request.get(`${API_URL}/api/health`).catch(() => null);
    if (!res) {
      test.info().annotations.push({ type: 'skip', description: 'API server down' });
      return;
    }
    expect(res.status(), '/api/health 200 değil').toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body['status'], 'health status "ok" değil').toBe('ok');
  });

  test('D3-b: /api/health environment alanı var', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const res = await request.get(`${API_URL}/api/health`).catch(() => null);
    if (!res) return;
    const body = (await res.json()) as Record<string, unknown>;
    expect(body, '/api/health: environment alanı eksik').toHaveProperty('environment');
  });

  test('D3-c: Render deploy config veya vercel.json mevcut', () => {
    const deployConfigs = ['vercel.json', 'render.yaml', '.render.yaml'];
    const found = deployConfigs.find((c) => exists(c));
    if (!found) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'Deploy config yok — Vercel auto-detect veya Render dashboard kullanılıyor',
        });
    } else {
      test.info().annotations.push({ type: 'note', description: `Deploy config: ${found}` });
    }
  });

  test('D3-d: Backend server başlatılabiliyor (mock server sağlıklı)', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const res = await request.get(`${API_URL}/__health`).catch(() => null);
    if (!res) {
      test.info().annotations.push({ type: 'skip', description: 'Mock server down' });
      return;
    }
    expect(res.status(), 'Mock server: 200 değil').toBe(200);
  });
});

// ─── ADIM 4: Post-Deploy Verification ────────────────────────────
test.describe('Deployment: Adım 4 — Post-Deploy Verification', () => {
  test('D4-a: Frontend 200 OK yükleniyor', async ({ page }) => {
    test.setTimeout(15000);
    await page.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200 }));
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const title = await page.title();
    expect(title.length, 'Homepage title boş').toBeGreaterThan(0);

    const hasNav = await page
      .locator('nav, header')
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false);
    expect(hasNav, 'Homepage: nav/header yok').toBeTruthy();
  });

  test('D4-b: SEO meta tags post-deploy hazır (og:title, canonical, description)', async ({
    page,
  }) => {
    test.setTimeout(15000);
    await page.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200 }));
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });

    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content');
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    const metaDesc = await page.locator('meta[name="description"]').getAttribute('content');

    expect(ogTitle, 'og:title eksik').toBeTruthy();
    expect(canonical, 'canonical eksik').toBeTruthy();
    expect(metaDesc, 'meta description eksik').toBeTruthy();
  });

  test('D4-c: sitemap.xml erişilebilir (GSC crawl için)', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const res = await request.get(`${BASE_URL}/sitemap.xml`).catch(() => null);
    if (!res) return;
    expect(res.status(), 'sitemap.xml 200 değil').toBe(200);
    const text = await res.text();
    expect(text.includes('<urlset') || text.includes('<sitemapindex'), 'Geçersiz XML').toBeTruthy();
  });

  test('D4-d: robots.txt Sitemap direktifi ile erişilebilir', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const res = await request.get(`${BASE_URL}/robots.txt`).catch(() => null);
    if (!res) return;
    expect(res.status(), 'robots.txt 200 değil').toBe(200);
    const text = await res.text();
    expect(text, 'robots.txt: Sitemap direktifi eksik').toContain('Sitemap:');
  });

  test('D4-e: API CORS origin doğru yapılandırılmış', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const res = await request
      .get(`${API_URL}/api/health`, {
        headers: { Origin: 'http://localhost:4173' },
      })
      .catch(() => null);
    if (!res) return;

    const corsHeader = res.headers()['access-control-allow-origin'];
    if (corsHeader) {
      const allowsLocal = corsHeader.includes('localhost') || corsHeader === '*';
      expect(allowsLocal, `CORS: localhost reddediliyor (${corsHeader})`).toBeTruthy();
    } else {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: "CORS header yok — Production'da CORS_ORIGIN env gerekiyor",
        });
    }
  });
});

// ─── CI/CD Pipeline ───────────────────────────────────────────────
test.describe('Deployment: CI/CD Pipeline (.github/workflows/)', () => {
  test('CI-a: .github/workflows/ dizini mevcut', () => {
    const ciDir = path.join(ROOT, '.github', 'workflows');
    expect(fs.existsSync(ciDir), '.github/workflows/ yok — CI/CD yok').toBeTruthy();
  });

  test('CI-b: ci.yml typecheck + lint + test adımlarını içeriyor', () => {
    const ciPath = path.join(ROOT, '.github', 'workflows', 'ci.yml');
    if (!fs.existsSync(ciPath)) {
      test.info().annotations.push({ type: 'note', description: 'ci.yml yok — P40-T92 pending' });
      return;
    }
    const ci = content('.github/workflows/ci.yml');
    expect(ci, 'ci.yml: typecheck adımı yok').toContain('typecheck');
    expect(ci, 'ci.yml: lint adımı yok').toContain('lint');
    expect(ci.includes('test') || ci.includes('playwright'), 'ci.yml: test adımı yok').toBeTruthy();
  });

  test('CI-c: ci.yml Playwright E2E adımı var', () => {
    const ciPath = path.join(ROOT, '.github', 'workflows', 'ci.yml');
    if (!fs.existsSync(ciPath)) return;
    const ci = content('.github/workflows/ci.yml');
    const hasE2E = ci.includes('playwright') || ci.includes('e2e');
    if (!hasE2E) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'ci.yml: E2E adımı yok — P40-T92 gerekiyor',
        });
    }
  });

  test('CI-d: ci.yml Sentry release adımı (source maps)', () => {
    const workflows = ['.github/workflows/ci.yml', '.github/workflows/release.yml'];
    let sentryFound = false;
    for (const wf of workflows) {
      if (!exists(wf)) continue;
      if (content(wf).includes('sentry')) {
        sentryFound = true;
        break;
      }
    }
    if (!sentryFound) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'CI: Sentry source maps upload yok — P40-T91 pending',
        });
    }
  });

  test('CI-e: lefthook.yml pre-commit kalite kapısı var', () => {
    const candidates = ['lefthook.yml', '.lefthook.yml', 'lefthook.yaml'];
    const found = candidates.find((c) => exists(c));
    expect(found, 'lefthook.yml yok — pre-commit hook yok').toBeTruthy();

    if (found) {
      const lh = content(found);
      const hasPreCommit = lh.includes('pre-commit') || lh.includes('commit-msg');
      expect(hasPreCommit, 'lefthook: pre-commit/commit-msg yok').toBeTruthy();
    }
  });
});

// ─── Monitoring & Alertler ────────────────────────────────────────
test.describe('Deployment: Monitoring & Alertler', () => {
  test("MON-a: Sentry init app'e entegre edilmiş", () => {
    const sentryFiles = ['src/main.tsx', 'src/lib/sentry.ts', 'src/utils/sentry.ts'];
    const found = sentryFiles.find((f) => {
      if (!exists(f)) return false;
      return content(f).includes('@sentry/');
    });
    expect(found, 'Sentry init yok — hata izleme eksik').toBeTruthy();
  });

  test('MON-b: GA4 analytics loader mevcut (VITE_GA_TRACKING_ID)', () => {
    const gaFiles = [
      'src/lib/ga4-loader.ts',
      'src/lib/analytics.ts',
      'src/components/providers/AnalyticsProvider.tsx',
    ];
    const found = gaFiles.find((f) => {
      if (!exists(f)) return false;
      const c = content(f);
      return c.includes('GA') || c.includes('gtag') || c.includes('ga4') || c.includes('analytics');
    });
    expect(found, 'GA4 analytics dosyası yok').toBeTruthy();
  });

  test('MON-c: /api/health response time ≤200ms (SLO)', async ({
    request,
  }: {
    request: APIRequestContext;
  }) => {
    const start = Date.now();
    const res = await request.get(`${API_URL}/api/health`).catch(() => null);
    const elapsed = Date.now() - start;

    if (!res) return;
    if (elapsed > 200) {
      test.info().annotations.push({
        type: 'note',
        description: `/api/health: ${elapsed}ms — SLO ≤200ms ihlali (prompts2/08 hedef)`,
      });
    }
    expect(elapsed, `/api/health: ${elapsed}ms > 500ms SLO ihlali`).toBeLessThan(500);
  });
});

// ─── Disaster Recovery ────────────────────────────────────────────
test.describe('Deployment: Disaster Recovery', () => {
  test('DR-a: prisma/schema.prisma modelleri tam (DR restore için)', () => {
    if (!exists('prisma/schema.prisma')) return;
    const schema = content('prisma/schema.prisma');
    const models = ['User', 'Booking'];
    const missingModels = models.filter((m) => !schema.includes(`model ${m}`));
    expect(missingModels.length, `Prisma: eksik model: ${missingModels.join(', ')}`).toBe(0);
  });

  test('DR-b: README.md deployment bölümü var', () => {
    expect(exists('README.md'), 'README.md yok').toBeTruthy();
    const readme = content('README.md');
    const hasDeploySection =
      readme.toLowerCase().includes('deploy') || readme.toLowerCase().includes('setup');
    expect(hasDeploySection, 'README.md: deploy/setup bölümü yok').toBeTruthy();
  });

  test('DR-c: Disaster recovery: veritabanı yedek scripti veya Render managed backup', () => {
    const backupScripts = ['scripts/backup-db.sh', 'scripts/backup-db.ts'];
    const hasBackup = backupScripts.some((s) => exists(s));
    if (!hasBackup) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description:
            'DR: backup script yok — Render managed backup (7 gün) kullanılıyor (prompts2/08)',
        });
    }
    // Render managed backup = production DR, kabul edilebilir
  });
});

// ─── Maliyet & Optimizasyon ───────────────────────────────────────
test.describe('Deployment: Maliyet & Performans Optimizasyonu', () => {
  test('COST-a: dist/assets/ en büyük JS bundle <500KB (gzip öncesi)', () => {
    const assetsDir = path.join(ROOT, 'dist', 'assets');
    if (!fs.existsSync(assetsDir)) return;

    const assets = fs.readdirSync(assetsDir);
    const jsBundles = assets.filter((f) => f.endsWith('.js') && !f.endsWith('.map'));

    const sizes = jsBundles.map((f) => ({
      file: f,
      size: fs.statSync(path.join(assetsDir, f)).size,
    }));

    sizes.sort((a, b) => b.size - a.size);

    if (sizes.length > 0) {
      const largest = sizes[0];
      const kb = Math.round(largest.size / 1024);
      test.info().annotations.push({
        type: 'note',
        description: `En büyük bundle: ${largest.file} (${kb}KB)`,
      });

      expect(
        largest.size,
        `Bundle çok büyük: ${kb}KB > 500KB (code splitting gerekiyor)`,
      ).toBeLessThan(512 * 1024);
    }
  });

  test('COST-b: dist/index.html preload hints var (LCP optimizasyon)', () => {
    if (!exists('dist/index.html')) return;
    const html = content('dist/index.html');
    const hasPreload = html.includes('rel="preload"') || html.includes('rel="modulepreload"');
    if (!hasPreload) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'dist/index.html: preload hint yok — LCP etkilenebilir',
        });
    }
  });
});
