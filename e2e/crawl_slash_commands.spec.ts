/**
 * e2e/crawl_slash_commands.spec.ts
 * istek4.txt: "/model, /compact, /ultrathink gibi GitHub repolarında ileri düzey çalışacak '/' leri bul ve e2e ekle"
 *
 * Windsurf Workflow + Claude Code Command E2E Validator.
 * Tüm slash komutları:
 *   1. Dosya mevcut
 *   2. YAML frontmatter geçerli (description zorunlu)
 *   3. İçerik dolmuş (min uzunluk)
 *   4. Roadmap fazlarıyla eşleşiyor (P31-P40 referansı)
 *   5. Turbo annotation doğru kullanılıyor
 *   6. docs/prompts/ referansı var (prompt engineering docs)
 *
 * Çalıştır:
 *   npx playwright test e2e/crawl_slash_commands.spec.ts --project=chromium
 */
import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.join(process.cwd());
const WORKFLOWS_DIR = path.join(PROJECT_ROOT, '.windsurf', 'workflows');
const COMMANDS_DIR = path.join(PROJECT_ROOT, '.claude', 'commands');

// ─── Beklenen Windsurf Workflows ─────────────────────────────────
const EXPECTED_WORKFLOWS: Array<{ slug: string; mustContain?: string[]; roadmapRef?: string }> = [
  { slug: 'ultrathink', mustContain: ['ICE', 'opus', 'Planla'], roadmapRef: 'roadmap' },
  { slug: 'plan', mustContain: ['⬜', 'Tier', 'roadmap'], roadmapRef: 'roadmap_10' },
  { slug: 'implement', mustContain: ['typecheck', 'lint', 'Sonnet'], roadmapRef: 'roadmap' },
  { slug: 'fix', mustContain: ['root cause', 'git log', 'minimal'] },
  { slug: 'crawl', mustContain: ['test:crawl', 'crawl_seo'], roadmapRef: 'crowler' },
  { slug: 'security-hardening', mustContain: ['P35', 'OWASP', 'CSP'], roadmapRef: 'roadmap_50' },
  { slug: 'performance-vitals', mustContain: ['LCP', 'P33', 'CLS'], roadmapRef: 'roadmap_30' },
  { slug: 'roadmap-status', mustContain: ['Tier', '⬜', 'roadmap'], roadmapRef: 'roadmap_100' },
  { slug: 'review', mustContain: ['docs/prompts/04', 'typecheck'], roadmapRef: 'prompts2' },
  { slug: 'phase-start', mustContain: ['⬜', 'Tier', 'roadmap'], roadmapRef: 'roadmap' },
  { slug: 'commit-smart', mustContain: ['typecheck', 'lint', 'Conventional'] },
  { slug: 'model', mustContain: ['opus', 'sonnet', 'Ollama'], roadmapRef: 'docs/prompts/03' },
  {
    slug: 'test-gen',
    mustContain: ['Vitest', 'Playwright', 'piramit'],
    roadmapRef: 'docs/prompts/07',
  },
  { slug: 'claude-doctor', mustContain: ['claude'] },
  { slug: 'claude-install', mustContain: ['claude'] },
  { slug: 'claude-publish-check', mustContain: ['lint', 'typecheck'] },
  { slug: 'orchestrator-next', mustContain: ['mission', 'SwarmBus'] },
];

// ─── Beklenen Claude Code Commands ───────────────────────────────
const EXPECTED_COMMANDS: Array<{ slug: string; mustContain?: string[] }> = [
  { slug: 'ultrathink', mustContain: ['ICE', 'opus', 'roadmap'] },
  { slug: 'plan', mustContain: ['⬜', 'Tier'] },
  { slug: 'implement', mustContain: ['typecheck', 'lint', 'Sonnet'] },
  { slug: 'fix', mustContain: ['root cause', 'git'] },
  { slug: 'crawl', mustContain: ['test:crawl', 'playwright'] },
  { slug: 'review', mustContain: ['docs/prompts/04', 'typecheck'] },
  { slug: 'security', mustContain: ['P35', 'OWASP'] },
  { slug: 'performance', mustContain: ['LCP', 'P33'] },
  { slug: 'test-gen', mustContain: ['Vitest', 'Playwright'] },
  { slug: 'commit', mustContain: ['typecheck', 'Conventional'] },
  { slug: 'memory-sync', mustContain: ['brain/memory', 'roadmap'] },
  // .claude/commands/phase-status.md uses the plain typographic checkmark
  // "✓" (U+2713) in its output-format block, not the "✅" emoji (U+2705) —
  // different codepoints. .claude/** is out of scope to edit; match reality.
  { slug: 'phase-status', mustContain: ['✓', 'roadmap'] },
  { slug: 'publish-check', mustContain: ['lint', 'typecheck'] },
  { slug: 'secret-scan', mustContain: ['gitleaks', 'secret'] },
  { slug: 'typecheck', mustContain: ['tsc', 'typecheck'] },
  { slug: 'lint-fix', mustContain: ['eslint', 'lint'] },
  { slug: 'e2e', mustContain: ['playwright', 'test'] },
  // .claude/commands/e2e-fast.md describes the flow via
  // `npm run test:e2e:fast` / "sanity_check spec" / "list reporter" — it
  // never spells out the literal word "playwright". .claude/** is out of
  // scope to edit; match reality.
  { slug: 'e2e-fast', mustContain: ['sanity_check', 'test'] },
];

// ─── Yardımcı ────────────────────────────────────────────────────
function parseFrontmatter(content: string): { description?: string; allowedTools?: string } {
  const match = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};
  const fm = match[1];
  const descMatch = fm.match(/description:\s*(.+)/);
  const toolsMatch = fm.match(/allowed-tools:\s*(.+)/);
  return {
    description: descMatch?.[1]?.trim(),
    allowedTools: toolsMatch?.[1]?.trim(),
  };
}

function readCommand(
  dir: string,
  slug: string,
): { exists: boolean; content: string; size: number } {
  const filePath = path.join(dir, `${slug}.md`);
  if (!fs.existsSync(filePath)) return { exists: false, content: '', size: 0 };
  const content = fs.readFileSync(filePath, 'utf-8');
  return { exists: true, content, size: content.length };
}

// ─────────────────────────────────────────────────────────────────
test.describe('Slash Commands: Windsurf Workflows', () => {
  test('Workflows dizini mevcut', () => {
    expect(fs.existsSync(WORKFLOWS_DIR), `.windsurf/workflows/ dizini yok`).toBeTruthy();
  });

  test(`${EXPECTED_WORKFLOWS.length} beklenen workflow dosyası mevcut`, () => {
    const missing = EXPECTED_WORKFLOWS.filter(
      (w) => !fs.existsSync(path.join(WORKFLOWS_DIR, `${w.slug}.md`)),
    ).map((w) => w.slug);
    expect(missing.length, `Eksik workflows: ${missing.join(', ')}`).toBe(0);
  });

  test("Tüm workflow'lar YAML frontmatter description içeriyor", () => {
    const violations: string[] = [];
    for (const { slug } of EXPECTED_WORKFLOWS) {
      const { content, exists } = readCommand(WORKFLOWS_DIR, slug);
      if (!exists) continue;
      const { description } = parseFrontmatter(content);
      if (!description || description.length < 10) {
        violations.push(`${slug}: description eksik/kısa`);
      }
    }
    expect(violations, `Frontmatter ihlali:\n${violations.join('\n')}`).toHaveLength(0);
  });

  test('Workflow içerikleri minimum 200 karakter (dolmuş)', () => {
    const thin: string[] = [];
    for (const { slug } of EXPECTED_WORKFLOWS) {
      const { content, size, exists } = readCommand(WORKFLOWS_DIR, slug);
      void content;
      if (!exists) continue;
      if (size < 200) thin.push(`${slug}: ${size} char < 200`);
    }
    expect(thin, `İnce workflow'lar:\n${thin.join('\n')}`).toHaveLength(0);
  });

  for (const workflow of EXPECTED_WORKFLOWS) {
    if (!workflow.mustContain?.length) continue;
    test(`/${workflow.slug}: zorunlu içerik anahtar kelimeler`, () => {
      const { content, exists } = readCommand(WORKFLOWS_DIR, workflow.slug);
      if (!exists) return; // zaten varlık testinde yakalandı
      for (const kw of workflow.mustContain ?? []) {
        expect(
          content.toLowerCase(),
          `/${workflow.slug}: "${kw}" anahtar kelimesi eksik`,
        ).toContain(kw.toLowerCase());
      }
    });
  }

  test('istek4.txt: /ultrathink ICE scoring var', () => {
    const { content } = readCommand(WORKFLOWS_DIR, 'ultrathink');
    expect(content).toContain('ICE');
    expect(content.toLowerCase()).toContain('opus');
  });

  test('istek4.txt: /model Opus→planlama, Sonnet→kodlama matrisi', () => {
    const { content } = readCommand(WORKFLOWS_DIR, 'model');
    expect(content.toLowerCase()).toContain('opus');
    expect(content.toLowerCase()).toContain('sonnet');
    expect(content.toLowerCase()).toContain('planla');
  });

  test('istek4.txt: /crawl test:crawl komutunu içeriyor', () => {
    const { content } = readCommand(WORKFLOWS_DIR, 'crawl');
    expect(content).toContain('test:crawl');
  });

  test('/turbo annotation: turbo destekli adımlar // turbo ile işaretli', () => {
    const turboWorkflows = ['plan', 'implement', 'fix', 'roadmap-status', 'orchestrator-next'];
    for (const slug of turboWorkflows) {
      const { content, exists } = readCommand(WORKFLOWS_DIR, slug);
      if (!exists) continue;
      const hasTurbo = content.includes('// turbo');
      if (!hasTurbo) {
        console.warn(`⚠ /${slug}: // turbo annotation yok — hızlı adımlar otomatik çalışamaz`);
      }
    }
    // Soft check — turbo opsiyonel ama kritik workflow'larda olmalı
  });

  test('Roadmap referansları: P31-P40 coverage', () => {
    const roadmapWorkflows = EXPECTED_WORKFLOWS.filter((w) => w.roadmapRef);
    const missing: string[] = [];
    for (const { slug, roadmapRef } of roadmapWorkflows) {
      const { content, exists } = readCommand(WORKFLOWS_DIR, slug);
      if (!exists) continue;
      if (roadmapRef && !content.toLowerCase().includes(roadmapRef.toLowerCase())) {
        missing.push(`/${slug}: "${roadmapRef}" referansı eksik`);
      }
    }
    if (missing.length) console.warn('⚠ Roadmap ref eksik:\n' + missing.join('\n'));
    // Soft — tüm workflow'lar roadmap'e link vermek zorunda değil
  });
});

// ─────────────────────────────────────────────────────────────────
test.describe('Slash Commands: Claude Code Commands', () => {
  test('Claude commands dizini mevcut', () => {
    expect(fs.existsSync(COMMANDS_DIR), `.claude/commands/ dizini yok`).toBeTruthy();
  });

  test(`${EXPECTED_COMMANDS.length} beklenen command dosyası mevcut`, () => {
    const missing = EXPECTED_COMMANDS.filter(
      (c) => !fs.existsSync(path.join(COMMANDS_DIR, `${c.slug}.md`)),
    ).map((c) => c.slug);
    expect(missing.length, `Eksik commands: ${missing.join(', ')}`).toBe(0);
  });

  test('Tüm commands YAML frontmatter description içeriyor', () => {
    const violations: string[] = [];
    for (const { slug } of EXPECTED_COMMANDS) {
      const { content, exists } = readCommand(COMMANDS_DIR, slug);
      if (!exists) continue;
      const { description } = parseFrontmatter(content);
      if (!description || description.length < 10) {
        violations.push(`${slug}: description eksik/kısa`);
      }
    }
    expect(violations, `Frontmatter ihlali:\n${violations.join('\n')}`).toHaveLength(0);
  });

  test('Command içerikleri minimum 100 karakter', () => {
    const thin: string[] = [];
    for (const { slug } of EXPECTED_COMMANDS) {
      const { content, size, exists } = readCommand(COMMANDS_DIR, slug);
      void content;
      if (!exists) continue;
      if (size < 100) thin.push(`${slug}: ${size} char < 100`);
    }
    expect(thin, `İnce commands: ${thin.join(', ')}`).toHaveLength(0);
  });

  for (const cmd of EXPECTED_COMMANDS) {
    if (!cmd.mustContain?.length) continue;
    test(`/${cmd.slug}: zorunlu anahtar kelimeler`, () => {
      const { content, exists } = readCommand(COMMANDS_DIR, cmd.slug);
      if (!exists) return;
      for (const kw of cmd.mustContain ?? []) {
        expect(content.toLowerCase(), `/${cmd.slug}: "${kw}" eksik`).toContain(kw.toLowerCase());
      }
    });
  }

  test('/ultrathink: allowed-tools tanımlı', () => {
    const { content } = readCommand(COMMANDS_DIR, 'ultrathink');
    const { allowedTools } = parseFrontmatter(content);
    expect(allowedTools, '/ultrathink: allowed-tools eksik').toBeTruthy();
  });

  test('/implement: Sonnet model referansı + typecheck adımı', () => {
    const { content } = readCommand(COMMANDS_DIR, 'implement');
    expect(content.toLowerCase()).toContain('sonnet');
    expect(content).toContain('typecheck');
  });

  test('/memory-sync: brain/memory.md referansı', () => {
    const { content, exists } = readCommand(COMMANDS_DIR, 'memory-sync');
    if (!exists) {
      console.warn('⚠ /memory-sync command eksik');
      return;
    }
    expect(content).toContain('brain/memory');
  });
});

// ─────────────────────────────────────────────────────────────────
test.describe('Slash Commands: Komut Matrix Bütünlüğü', () => {
  test('istek4.txt tam coverage: /model + /plan + /ultrathink + /crawl hepsi var', () => {
    const critical = ['model', 'plan', 'ultrathink', 'crawl'];
    for (const slug of critical) {
      const wf = fs.existsSync(path.join(WORKFLOWS_DIR, `${slug}.md`));
      const cc = fs.existsSync(path.join(COMMANDS_DIR, `${slug}.md`));
      expect(wf || cc, `/${slug}: ne workflow ne command var`).toBeTruthy();
    }
  });

  test('docs/prompts/ entegrasyonu: en az 5 workflow docs/prompts referans içeriyor', () => {
    // The knowledge base directory is docs/prompts/ (no "2" suffix) — the
    // "prompts2" string this test looked for was a stale pre-rename
    // reference (still findable in archive/prompts-raw/); actual workflows
    // cite "docs/prompts" directly (11 of 17 files).
    const files = fs.readdirSync(WORKFLOWS_DIR).filter((f) => f.endsWith('.md'));
    const withRef = files.filter((f) => {
      const content = fs.readFileSync(path.join(WORKFLOWS_DIR, f), 'utf-8');
      return content.includes('docs/prompts');
    });
    expect(
      withRef.length,
      `docs/prompts referanslı workflow sayısı: ${withRef.length} < 5`,
    ).toBeGreaterThanOrEqual(5);
  });

  test('Roadmap P31-P40 tam coverage: her phase için en az 1 workflow/command', () => {
    const phaseCoverage: Record<string, boolean> = {
      P31: false,
      P32: false,
      P33: false,
      P34: false,
      P35: false,
      P36: false,
      P37: false,
      P38: false,
      P39: false,
      P40: false,
    };

    // Workflow'larda tarama
    const allFiles = [
      ...fs.readdirSync(WORKFLOWS_DIR).map((f) => path.join(WORKFLOWS_DIR, f)),
      ...fs.readdirSync(COMMANDS_DIR).map((f) => path.join(COMMANDS_DIR, f)),
    ].filter((f) => f.endsWith('.md'));

    for (const file of allFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const phase of Object.keys(phaseCoverage)) {
        if (content.includes(phase)) phaseCoverage[phase] = true;
      }
    }

    const uncovered = Object.entries(phaseCoverage)
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (uncovered.length > 0) {
      console.warn(`⚠ Workflow'larda referans verilmeyen phase'ler: ${uncovered.join(', ')}`);
    }
    // P31-P35 tier 1 zorunlu
    expect(phaseCoverage['P31'], 'P31 workflow/command coverage yok').toBeTruthy();
    expect(phaseCoverage['P33'], 'P33 workflow/command coverage yok').toBeTruthy();
    expect(phaseCoverage['P35'], 'P35 workflow/command coverage yok').toBeTruthy();
  });

  test('Windsurf toplam workflow sayısı ≥ 15', () => {
    const count = fs.readdirSync(WORKFLOWS_DIR).filter((f) => f.endsWith('.md')).length;
    expect(count, `Workflow sayısı: ${count} < 15`).toBeGreaterThanOrEqual(15);
  });

  test('Claude commands toplam sayısı ≥ 12', () => {
    const count = fs.readdirSync(COMMANDS_DIR).filter((f) => f.endsWith('.md')).length;
    expect(count, `Command sayısı: ${count} < 12`).toBeGreaterThanOrEqual(12);
  });

  test('Hiçbir workflow boş (0 byte)', () => {
    const empty = fs
      .readdirSync(WORKFLOWS_DIR)
      .filter((f) => f.endsWith('.md'))
      .filter((f) => fs.statSync(path.join(WORKFLOWS_DIR, f)).size === 0);
    expect(empty, `Boş workflow'lar: ${empty.join(', ')}`).toHaveLength(0);
  });

  test('Hiçbir command boş (0 byte)', () => {
    const empty = fs
      .readdirSync(COMMANDS_DIR)
      .filter((f) => f.endsWith('.md'))
      .filter((f) => fs.statSync(path.join(COMMANDS_DIR, f)).size === 0);
    expect(empty, `Boş command'ler: ${empty.join(', ')}`).toHaveLength(0);
  });

  test('istek4.txt: Opus planlama + Sonnet kodlama kalıcı modelleme belgesi', () => {
    const modelFile = path.join(WORKFLOWS_DIR, 'model.md');
    expect(fs.existsSync(modelFile), '/model.md yok').toBeTruthy();
    const content = fs.readFileSync(modelFile, 'utf-8');
    expect(content.toLowerCase()).toContain('opus');
    expect(content.toLowerCase()).toContain('sonnet');
    expect(content.toLowerCase()).toContain('haiku');
    // Her işlem için model seçimi tablosu
    expect(content).toContain('|');
  });
});

// ─────────────────────────────────────────────────────────────────
test.describe('Slash Commands: CLAUDE.md Entegrasyonu', () => {
  test('CLAUDE.md mevcut ve slash command bilgisi içeriyor', () => {
    const claudeFile = path.join(PROJECT_ROOT, 'CLAUDE.md');
    expect(fs.existsSync(claudeFile), 'CLAUDE.md yok').toBeTruthy();
    const content = fs.readFileSync(claudeFile, 'utf-8');
    // CLAUDE.md komut içermeli
    expect(content.length, 'CLAUDE.md boş').toBeGreaterThan(100);
  });

  test('.claude/settings.json Edit(.claude/**) izni var', () => {
    const settingsFile = path.join(PROJECT_ROOT, '.claude', 'settings.json');
    expect(fs.existsSync(settingsFile), '.claude/settings.json yok').toBeTruthy();
    const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8')) as {
      permissions?: { allow?: string[]; deny?: string[] };
    };
    const allow = settings.permissions?.allow ?? [];
    const hasClaudeEdit = allow.some((r) => r.includes('.claude'));
    expect(hasClaudeEdit, 'settings.json: .claude/** edit izni yok').toBeTruthy();
  });

  test('docs/prompts/README.md AI OS yapısı tanımlı', () => {
    // Stale pre-rename path — the directory is docs/prompts/, not the old
    // "prompts2" naming (still findable in archive/prompts-raw/).
    const readmePath = path.join(PROJECT_ROOT, 'docs', 'prompts', 'README.md');
    expect(fs.existsSync(readmePath), 'docs/prompts/README.md yok').toBeTruthy();
    const content = fs.readFileSync(readmePath, 'utf-8');
    expect(content).toContain('Cascade');
    expect(content).toContain('Claude Code');
  });
});
