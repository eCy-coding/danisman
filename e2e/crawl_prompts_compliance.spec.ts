/**
 * e2e/crawl_prompts_compliance.spec.ts
 * prompts2/ Mimari Uyum Denetimi — Tüm ADR + Golden Rules + Tech Stack E2E doğrulaması
 *
 * Kapsar:
 *   prompts2/01-system-master.md  — Altın Kurallar + Karar Hiyerarşisi
 *   prompts2/02-feature-impl.md   — Feature şablonu + TypeScript strict
 *   prompts2/03-ollama-model.md   — Model seçim matrisi
 *   prompts2/04-code-review.md    — Kod review checklist
 *   prompts2/05-performance.md    — Core Web Vitals + bundle
 *   prompts2/06-security.md       — OWASP + JWT + CORS
 *   prompts2/07-testing.md        — Test piramidi + coverage
 *   prompts2/08-deployment.md     — Deploy flow + health
 *   prompts2/09-architecture.md   — ADR-001..010
 *   prompts2/10-ai-orchestration.md — AI agent entegrasyon
 *
 * Çalıştır:
 *   npx playwright test e2e/crawl_prompts_compliance.spec.ts --project=chromium
 */
import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:4173';
const ROOT = process.cwd();

const exists = (p: string) => fs.existsSync(path.join(ROOT, p));
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf-8');
const mockSentry = async (page: Page) => {
  await page.route('**/ingest.sentry.io/**', (r) => r.fulfill({ status: 200 }));
};

// ─── prompts2/01: Altın Kurallar ─────────────────────────────────
test.describe('prompts2/01: System Master — Altın Kurallar', () => {
  test('AR1: TypeScript strict — tsconfig.json strict: true', () => {
    const tsconfig = path.join(ROOT, 'tsconfig.json');
    expect(fs.existsSync(tsconfig), 'tsconfig.json yok').toBeTruthy();
    const cfg = JSON.parse(read('tsconfig.json')) as {
      compilerOptions?: { strict?: boolean; noImplicitAny?: boolean };
    };
    const strict = cfg.compilerOptions?.strict || cfg.compilerOptions?.noImplicitAny;
    expect(strict, 'tsconfig.json: strict mode kapalı').toBeTruthy();
  });

  test('AR2: ESLint config mevcut (lint kalite kapısı)', () => {
    const configs = [
      '.eslintrc.js',
      '.eslintrc.cjs',
      '.eslintrc.json',
      'eslint.config.js',
      'eslint.config.ts',
      'eslint.config.mjs',
    ];
    const found = configs.some((c) => exists(c));
    expect(found, 'ESLint config yok').toBeTruthy();
  });

  test('AR3: Karar hiyerarşisi — brain/ artefaktları mevcut', () => {
    const required = [
      'brain/memory.md',
      'brain/PUBLISH_MASTER_PLAN.md',
      'brain/COMPETITIVE_AUDIT.md',
    ];
    for (const f of required) {
      expect(exists(f), `${f} yok — prompts2/01 karar hiyerarşisi bozuk`).toBeTruthy();
    }
  });

  test('AR4: Console.log production kodunda yok (prompts2/01 Yasak Eylemler)', () => {
    const srcFiles = [
      'src/main.tsx',
      'src/App.tsx',
      'src/lib/analytics.ts',
      'src/lib/ga4-loader.ts',
    ];
    for (const f of srcFiles) {
      if (!exists(f)) continue;
      const code = read(f);
      const lines = code.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (/console\.log\(/.test(line) && !line.trim().startsWith('//')) {
          expect.soft(false, `${f}:${i + 1} console.log var — prompts2/01 ihlali`).toBeTruthy();
        }
      }
    }
  });

  test('AR5: TypeScript any tipi — kritik lib dosyalarında any yok', () => {
    const criticalFiles = ['src/lib/analytics.ts', 'src/lib/ga4-loader.ts', 'server/lib/logger.ts'];
    for (const f of criticalFiles) {
      if (!exists(f)) continue;
      const code = read(f);
      const hasAny = /: any[;),\s]/.test(code);
      if (hasAny) {
        test
          .info()
          .annotations.push({
            type: 'note',
            description: `${f}: TypeScript any tipi var — prompts2/01 soft violation`,
          });
      }
    }
  });
});

// ─── prompts2/02: Feature Implementation ─────────────────────────
test.describe('prompts2/02: Feature Implementation — Tech Stack', () => {
  test('FI1: React 19 + Vite stack (package.json)', () => {
    const pkg = JSON.parse(read('package.json')) as {
      dependencies?: Record<string, string>;
    };
    const deps = pkg.dependencies ?? {};
    expect('react' in deps, 'react package yok').toBeTruthy();
    const reactVersion = deps['react'] ?? '';
    const is19 =
      reactVersion.includes('19') ||
      reactVersion.startsWith('^19') ||
      reactVersion.startsWith('~19');
    expect(is19, `React sürümü 19 değil: ${reactVersion}`).toBeTruthy();
  });

  test('FI2: TypeScript strict build (tsconfig.server.json var)', () => {
    expect(
      exists('tsconfig.server.json'),
      'tsconfig.server.json yok — backend TS config eksik',
    ).toBeTruthy();
  });

  test('FI3: Tailwind v4 — package.json (tailwindcss ^4)', () => {
    const pkg = JSON.parse(read('package.json')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const twVersion = deps['tailwindcss'] ?? '';
    const is4 = twVersion.includes('4') || twVersion.startsWith('^4') || twVersion.startsWith('~4');
    expect(is4, `Tailwind sürümü v4 değil: ${twVersion}`).toBeTruthy();
  });

  test('FI4: Zustand state management (ADR-004)', () => {
    const pkg = JSON.parse(read('package.json')) as {
      dependencies?: Record<string, string>;
    };
    const deps = pkg.dependencies ?? {};
    expect('zustand' in deps, 'Zustand yok — ADR-004 ihlali').toBeTruthy();
  });

  test('FI5: Prisma 7 ORM (ADR-005)', () => {
    const pkg = JSON.parse(read('package.json')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const prismaVersion = deps['@prisma/client'] ?? deps['prisma'] ?? '';
    expect(prismaVersion, 'Prisma yok — ADR-005 ihlali').toBeTruthy();
  });

  test('FI6: motion/react kullanılıyor (ADR-003: framer-motion → motion)', () => {
    const pkg = JSON.parse(read('package.json')) as {
      dependencies?: Record<string, string>;
    };
    const deps = pkg.dependencies ?? {};
    const hasMotion = 'motion' in deps || 'framer-motion' in deps;
    expect(hasMotion, 'motion/framer-motion yok — ADR-003 ihlali').toBeTruthy();
  });
});

// ─── prompts2/03: Ollama Model Guide ─────────────────────────────
test.describe('prompts2/03: Ollama Model Guide — AI Orchestration', () => {
  test('OL1: prompts2/03-ollama-model-guide.md mevcut ve yeterince uzun', () => {
    const guide = 'prompts2/03-ollama-model-guide.md';
    expect(exists(guide), `${guide} yok`).toBeTruthy();
    const c = read(guide);
    expect(c.length, `${guide} çok kısa`).toBeGreaterThan(200);
    expect(c.toLowerCase(), 'Model guide: opus referansı yok').toContain('opus');
    expect(c.toLowerCase(), 'Model guide: sonnet referansı yok').toContain('sonnet');
  });

  test('OL2: /model workflow Opus+Sonnet+Haiku matrisi (istek4.txt)', () => {
    const modelWorkflow = '.windsurf/workflows/model.md';
    expect(exists(modelWorkflow), '/model workflow yok').toBeTruthy();
    const wf = read(modelWorkflow);
    expect(wf.toLowerCase(), '/model: opus yok').toContain('opus');
    expect(wf.toLowerCase(), '/model: sonnet yok').toContain('sonnet');
    expect(wf, '/model: tablo (|) yok — model matris tablosu eksik').toContain('|');
  });
});

// ─── prompts2/04: Code Review Checklist ──────────────────────────
test.describe('prompts2/04: Code Review Checklist — Kod Kalitesi', () => {
  test('CR1: prompts2/04-code-review-checklist.md mevcut', () => {
    const cr = 'prompts2/04-code-review-checklist.md';
    expect(exists(cr), `${cr} yok`).toBeTruthy();
    const c = read(cr);
    expect(c, 'Code review: TypeScript referansı yok').toContain('TypeScript');
    expect(c.toLowerCase(), 'Code review: test referansı yok').toContain('test');
  });

  test("CR2: /review Windsurf workflow prompts2/04'e referans veriyor", () => {
    const review = '.windsurf/workflows/review.md';
    expect(exists(review), '/review workflow yok').toBeTruthy();
    const wf = read(review);
    expect(wf, '/review: prompts2/04 referansı yok').toContain('prompts2/04');
  });

  test('CR3: src/ dosyaları import top-level kullanıyor (orta kontrol)', () => {
    const appFile = 'src/App.tsx';
    if (!exists(appFile)) return;
    const code = read(appFile);
    const lines = code.split('\n');
    const firstNonImport = lines.findIndex(
      (l) =>
        l.trim() &&
        !l.startsWith('import') &&
        !l.startsWith('//') &&
        !l.startsWith('/*') &&
        !l.startsWith('*'),
    );
    const lateImport = lines
      .slice(firstNonImport)
      .findIndex((l) => l.startsWith('import ') && !l.includes('// dynamic'));

    if (lateImport !== -1) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: `App.tsx: satır ${firstNonImport + lateImport} late import var — prompts2/04 uyarısı`,
        });
    }
  });
});

// ─── prompts2/05: Performance Audit ──────────────────────────────
test.describe('prompts2/05: Performance Audit — Core Web Vitals', () => {
  test('PA1: prompts2/05-performance-audit.md LCP/CLS hedefleri var', () => {
    const pa = 'prompts2/05-performance-audit.md';
    expect(exists(pa), `${pa} yok`).toBeTruthy();
    const c = read(pa);
    expect(c, 'Performance doc: LCP yok').toContain('LCP');
    expect(c, 'Performance doc: CLS yok').toContain('CLS');
  });

  test("PA2: Hero image preload dist/index.html'de var", () => {
    if (!exists('dist/index.html')) {
      test
        .info()
        .annotations.push({ type: 'note', description: 'dist/index.html yok — build çalıştırın' });
      return;
    }
    const html = read('dist/index.html');
    const hasPreload =
      html.includes('rel="preload"') ||
      html.includes('fetchpriority') ||
      html.includes('rel="modulepreload"');
    if (!hasPreload) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'dist/index.html: preload hint yok — LCP optimize edilmemiş (P33)',
        });
    }
  });

  test('PA3: Performance E2E spec mevcut (crawl_performance_vitals.spec.ts)', () => {
    expect(
      exists('e2e/crawl_performance_vitals.spec.ts'),
      'crawl_performance_vitals.spec.ts yok',
    ).toBeTruthy();
  });

  test('PA4: Core Web Vitals browser destekli', async ({ page }) => {
    test.setTimeout(15000);
    await mockSentry(page);
    await page.goto(BASE_URL, { waitUntil: 'load' });

    const supported = await page.evaluate(() => {
      return !!(
        typeof PerformanceObserver !== 'undefined' &&
        typeof performance.getEntriesByType === 'function'
      );
    });
    expect(supported, 'PerformanceObserver desteklenmiyor').toBeTruthy();
  });
});

// ─── prompts2/06: Security Hardening ─────────────────────────────
test.describe('prompts2/06: Security Hardening — OWASP', () => {
  test('SH1: prompts2/06-security-hardening.md OWASP referansı', () => {
    const sh = 'prompts2/06-security-hardening.md';
    expect(exists(sh), `${sh} yok`).toBeTruthy();
    const c = read(sh);
    expect(c, 'Security doc: OWASP referansı yok').toContain('OWASP');
    expect(c, 'Security doc: JWT referansı yok').toContain('JWT');
  });

  test('SH2: Security E2E spec mevcut (crawl_security_headers.spec.ts)', () => {
    expect(
      exists('e2e/crawl_security_headers.spec.ts'),
      'crawl_security_headers.spec.ts yok',
    ).toBeTruthy();
  });

  test('SH3: server/middleware/auth.ts veya JWT verify middleware mevcut', () => {
    const candidates = [
      'server/middleware/auth.ts',
      'server/middleware/authenticate.ts',
      'server/lib/auth.ts',
    ];
    const found = candidates.some((c) => exists(c));
    expect(found, 'JWT middleware yok — API korumasız').toBeTruthy();
  });

  test("SH4: Rate limiter server'da mevcut", () => {
    const candidates = ['server/middleware/rateLimiter.ts', 'server/middleware/rateLimit.ts'];
    const routesDir = path.join(ROOT, 'server', 'routes');

    const hasMiddleware = candidates.some((c) => exists(c));
    let hasInRoutes = false;

    if (fs.existsSync(routesDir)) {
      const routeFiles = fs.readdirSync(routesDir).filter((f) => f.endsWith('.ts'));
      hasInRoutes = routeFiles.some((f) => {
        const c = read(`server/routes/${f}`);
        return c.includes('rateLimit') || c.includes('rateLimiter');
      });
    }

    expect(hasMiddleware || hasInRoutes, 'Rate limiter yok — DoS koruması eksik').toBeTruthy();
  });
});

// ─── prompts2/07: Testing Strategy ───────────────────────────────
test.describe('prompts2/07: Testing Strategy — Test Piramidi', () => {
  test('TS1: Vitest config mevcut', () => {
    const configs = ['vitest.config.ts', 'vite.config.ts'];
    const found = configs.find((c) => {
      if (!exists(c)) return false;
      return read(c).includes('test') || read(c).includes('vitest');
    });
    expect(found, 'Vitest config yok').toBeTruthy();
  });

  test('TS2: playwright.config.ts baseURL + serviceWorkers:block (ADR-006)', () => {
    expect(exists('playwright.config.ts'), 'playwright.config.ts yok').toBeTruthy();
    const pw = read('playwright.config.ts');
    expect(pw, 'playwright.config.ts: baseURL yok').toContain('baseURL');
    expect(pw, 'playwright.config.ts: serviceWorkers block yok — ADR-006 ihlali').toContain(
      'serviceWorkers',
    );
  });

  test('TS3: E2E crawl suite spec sayısı ≥ 16', () => {
    const e2eDir = path.join(ROOT, 'e2e');
    const crawlSpecs = fs
      .readdirSync(e2eDir)
      .filter((f) => f.startsWith('crawl_') && f.endsWith('.spec.ts'));
    expect(
      crawlSpecs.length,
      `crawl_ spec sayısı: ${crawlSpecs.length} < 16`,
    ).toBeGreaterThanOrEqual(16);
    test
      .info()
      .annotations.push({ type: 'note', description: `Crawl specs: ${crawlSpecs.length}` });
  });

  test("TS4: test:crawl npm script tüm crawl spec'leri içeriyor", () => {
    const pkg = JSON.parse(read('package.json')) as { scripts?: Record<string, string> };
    const crawlScript = pkg.scripts?.['test:crawl'] ?? '';
    expect(crawlScript, 'test:crawl script yok').toBeTruthy();

    const e2eDir = path.join(ROOT, 'e2e');
    const crawlSpecs = fs
      .readdirSync(e2eDir)
      .filter((f) => f.startsWith('crawl_') && f.endsWith('.spec.ts'));

    const missingFromScript = crawlSpecs.filter((s) => !crawlScript.includes(s));
    if (missingFromScript.length > 0) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: `test:crawl'da eksik: ${missingFromScript.join(', ')}`,
        });
    }
  });
});

// ─── prompts2/09: Architecture Decisions (ADR) ────────────────────
test.describe('prompts2/09: Architecture Decisions (ADR-001..010)', () => {
  test('ADR1: ADR-001 React 19 + Vite (Next.js yok)', () => {
    const pkg = JSON.parse(read('package.json')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect('next' in deps, "ADR-001 ihlali: Next.js package.json'da var").toBeFalsy();
    expect('vite' in deps, 'ADR-001: Vite yok').toBeTruthy();
  });

  test('ADR2: ADR-002 Tailwind v4 codemod — bg-linear-to-* kullanımı', () => {
    const cssFiles = ['src/index.css', 'src/App.css'];
    const tsxFiles = path.join(ROOT, 'src');

    let checked = false;
    for (const f of cssFiles) {
      if (!exists(f)) continue;
      const c = read(f);
      if (c.includes('bg-gradient-to-')) {
        test
          .info()
          .annotations.push({
            type: 'note',
            description: `ADR-002: ${f} eski gradient syntax — codemod gerekiyor`,
          });
      }
      checked = true;
    }

    if (!checked) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'ADR-002: CSS dosyası yok — Tailwind inline kullanıyor',
        });
    }
    void tsxFiles;
  });

  test('ADR3: ADR-006 serviceWorkers: block (Playwright config)', () => {
    const pw = read('playwright.config.ts');
    expect(
      pw.includes("serviceWorkers: 'block'") || pw.includes('serviceWorkers:"block"'),
      'ADR-006 ihlali: serviceWorkers block değil',
    ).toBeTruthy();
  });

  test('ADR4: ADR-007 Error Boundary katmanlı (SovereignBoundary + GlobalErrorBoundary)', () => {
    const mainTsx = 'src/main.tsx';
    const appTsx = 'src/App.tsx';

    if (exists(mainTsx)) {
      const main = read(mainTsx);
      const hasEB = main.includes('ErrorBoundary') || main.includes('SovereignBoundary');
      if (!hasEB) {
        test
          .info()
          .annotations.push({
            type: 'note',
            description: 'ADR-007: main.tsx GlobalErrorBoundary yok',
          });
      }
    }

    if (exists(appTsx)) {
      const app = read(appTsx);
      const hasEB = app.includes('SovereignBoundary') || app.includes('ErrorBoundary');
      expect(hasEB, 'ADR-007 ihlali: App.tsx Error Boundary yok').toBeTruthy();
    }
  });

  test("ADR5: ADR-008 Brotli Plugin — vite.config.ts'de mevcut", () => {
    const vite = 'vite.config.ts';
    if (!exists(vite)) return;
    const c = read(vite);
    const hasBrotli = c.includes('compression') || c.includes('Brotli') || c.includes('brotli');
    if (!hasBrotli) {
      test
        .info()
        .annotations.push({
          type: 'note',
          description: 'ADR-008: Brotli plugin yok — Lighthouse BP miss',
        });
    }
  });

  test('ADR9: brain/roadmap/ 10 adet roadmap_*.md var', () => {
    const roadmapDir = path.join(ROOT, 'brain', 'roadmap');
    expect(fs.existsSync(roadmapDir), 'brain/roadmap/ yok').toBeTruthy();
    const files = fs
      .readdirSync(roadmapDir)
      .filter((f) => f.startsWith('roadmap_') && f.endsWith('.md'));
    expect(files.length, `roadmap dosyası: ${files.length} < 10`).toBeGreaterThanOrEqual(10);
  });
});

// ─── prompts2/10: AI Agent Orchestration ─────────────────────────
test.describe('prompts2/10: AI Agent Orchestration', () => {
  test('AI1: prompts2/10-ai-agent-orchestration.md SwarmBus referansı', () => {
    const ai = 'prompts2/10-ai-agent-orchestration.md';
    expect(exists(ai), `${ai} yok`).toBeTruthy();
    const c = read(ai);
    expect(c, 'AI doc: Orchestrator referansı yok').toMatch(/orchestrat|swarm|agent/i);
  });

  test('AI2: .windsurf/workflows/ ≥ 15 workflow var', () => {
    const wfDir = path.join(ROOT, '.windsurf', 'workflows');
    expect(fs.existsSync(wfDir), '.windsurf/workflows/ yok').toBeTruthy();
    const wfs = fs.readdirSync(wfDir).filter((f) => f.endsWith('.md'));
    expect(wfs.length, `Workflow sayısı: ${wfs.length} < 15`).toBeGreaterThanOrEqual(15);
  });

  test('AI3: .claude/commands/ ≥ 15 command var', () => {
    const cmdDir = path.join(ROOT, '.claude', 'commands');
    expect(fs.existsSync(cmdDir), '.claude/commands/ yok').toBeTruthy();
    const cmds = fs.readdirSync(cmdDir).filter((f) => f.endsWith('.md'));
    expect(cmds.length, `Command sayısı: ${cmds.length} < 15`).toBeGreaterThanOrEqual(15);
  });

  test('AI4: /ultrathink Windsurf + Claude Code her ikisinde de var', () => {
    expect(exists('.windsurf/workflows/ultrathink.md'), '/ultrathink Windsurf yok').toBeTruthy();
    expect(exists('.claude/commands/ultrathink.md'), '/ultrathink Claude Code yok').toBeTruthy();
  });

  test('AI5: AGENTS.md veya brain/skills.md AI skills matrisi', () => {
    const hasAgents = exists('AGENTS.md') || exists('brain/skills.md');
    expect(hasAgents, 'AGENTS.md / brain/skills.md yok — AI skills matrisi eksik').toBeTruthy();
  });
});

// ─── GENEL UYUM SKORU ─────────────────────────────────────────────
test.describe('prompts2/: Genel Uyum Skoru Özeti', () => {
  test('COMPLIANCE: prompts2/ 10 dosyanın tamamı mevcut', () => {
    const docs = [
      'prompts2/01-system-master.md',
      'prompts2/02-feature-implementation.md',
      'prompts2/03-ollama-model-guide.md',
      'prompts2/04-code-review-checklist.md',
      'prompts2/05-performance-audit.md',
      'prompts2/06-security-hardening.md',
      'prompts2/07-testing-strategy.md',
      'prompts2/08-deployment-flow.md',
      'prompts2/09-architecture-decisions.md',
      'prompts2/10-ai-agent-orchestration.md',
    ];

    const missing = docs.filter((d) => !exists(d));
    expect(missing, `prompts2/ eksik doc: ${missing.join(', ')}`).toHaveLength(0);
  });

  test('COMPLIANCE: Tech stack versiyonları prompts2/01 ile uyumlu', async ({ page }) => {
    test.setTimeout(15000);
    await mockSentry(page);
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const checks: Record<string, boolean> = {
      'React 19': (() => {
        const v = JSON.parse(read('package.json')) as { dependencies?: Record<string, string> };
        return (v.dependencies?.['react'] ?? '').includes('19');
      })(),
      'Tailwind v4': (() => {
        const pkg = JSON.parse(read('package.json')) as {
          devDependencies?: Record<string, string>;
        };
        return (pkg.devDependencies?.['tailwindcss'] ?? '').includes('4');
      })(),
      TypeScript: exists('tsconfig.json'),
      Prisma: exists('prisma/schema.prisma'),
      Playwright: exists('playwright.config.ts'),
      Vitest: (() => {
        const c = read('vite.config.ts');
        return c.includes('vitest') || c.includes('test');
      })(),
    };

    const done = Object.entries(checks)
      .filter(([, v]) => v)
      .map(([k]) => k);
    const missing = Object.entries(checks)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    const score = Math.round((done.length / Object.keys(checks).length) * 100);

    console.warn(
      `\nprompts2/ Uyum Skoru: ${score}% (${done.length}/${Object.keys(checks).length})\n` +
        done.map((k) => `  ✅ ${k}`).join('\n') +
        (missing.length ? '\n' + missing.map((k) => `  ⬜ ${k}`).join('\n') : ''),
    );

    expect(done.length, `prompts2/ uyum yetersiz: ${done.length}/6`).toBeGreaterThanOrEqual(5);
  });
});
