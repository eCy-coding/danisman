/**
 * Phase 104a: Spacing-token compliance audit.
 *
 * Walks the `src/` tree and reports Tailwind utility class usages whose
 * numeric step is NOT in the Fibonacci sequence (1, 2, 3, 5, 8, 13, 21, 34, 55).
 * Tailwind defaults `p-4`, `p-6`, `p-7`, `p-9`, `p-10`, `p-11`, `p-12`, `p-14`,
 * `p-15`, `p-16` (etc.) are the violators we want to retire in Phase 104b.
 *
 * Output:
 *   - Per-step counts (top offenders) — visible during migration
 *   - File-level breakdown — useful for routing follow-up work
 *   - Total — feeds into the regression-trap threshold
 *
 * Exit code:
 *   0 — total is at or below the configured ceiling
 *   1 — total exceeds the ceiling (regression)
 *
 * Configure the ceiling via `--max=<n>` or env `SPACING_AUDIT_MAX`. Default
 * matches the baseline measured on 2026-05-08 so an unmodified clone stays
 * green; tighten as components are migrated.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'src');
const FIB = new Set([1, 2, 3, 5, 8, 13, 21, 34, 55]);
const PROPS = [
  'p',
  'px',
  'py',
  'pt',
  'pb',
  'pl',
  'pr',
  'm',
  'mx',
  'my',
  'mt',
  'mb',
  'ml',
  'mr',
  'gap',
  'space-x',
  'space-y',
  'w',
  'h',
  'min-w',
  'min-h',
  'max-w',
  'max-h',
] as const;

const PROP_ALT = PROPS.map((p) => p.replace(/[-]/g, '\\-')).join('|');
const CLASS_REGEX = new RegExp(`\\b(${PROP_ALT})-([0-9]+)(?:[\\s"'\\\`}<>])`, 'g');

/**
 * Baseline (2026-05-08): 1544 non-Fibonacci utilities.
 * Ceiling = baseline + 6 (regression-trap with tiny tolerance for trivial
 * additions until P104b lands a wave of migrations and tightens this).
 */
const DEFAULT_CEILING = Number(process.env.SPACING_AUDIT_MAX ?? 1550);
const ceilingArg = process.argv.find((a) => a.startsWith('--max='));
const CEILING = ceilingArg ? Number(ceilingArg.split('=')[1]) : DEFAULT_CEILING;

interface Hit {
  file: string;
  prop: string;
  step: number;
}

async function* walk(dir: string): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'generated' || entry.name === 'node_modules') continue;
      yield* walk(full);
    } else if (/\.(tsx?|jsx?|css|html|mdx?)$/.test(entry.name)) {
      yield full;
    }
  }
}

async function scanFile(file: string): Promise<Hit[]> {
  const text = await fs.readFile(file, 'utf8');
  const out: Hit[] = [];
  for (const m of text.matchAll(CLASS_REGEX)) {
    const prop = m[1];
    const step = Number(m[2]);
    if (!FIB.has(step)) {
      out.push({ file: path.relative(process.cwd(), file), prop, step });
    }
  }
  return out;
}

async function main() {
  const allHits: Hit[] = [];
  for await (const file of walk(ROOT)) {
    const hits = await scanFile(file);
    allHits.push(...hits);
  }

  const byStep = new Map<number, number>();
  const byFile = new Map<string, number>();
  for (const h of allHits) {
    byStep.set(h.step, (byStep.get(h.step) ?? 0) + 1);
    byFile.set(h.file, (byFile.get(h.file) ?? 0) + 1);
  }

  const total = allHits.length;
  const stepRows = [...byStep.entries()].sort((a, b) => b[1] - a[1]);
  const topFiles = [...byFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  process.stdout.write(`[audit-spacing] total non-Fibonacci utilities: ${total}\n`);
  process.stdout.write(`  ceiling: ${CEILING} ${total <= CEILING ? '✅' : '❌'}\n\n`);
  process.stdout.write(`  by step:\n`);
  for (const [step, count] of stepRows) {
    process.stdout.write(`    -${step.toString().padStart(3, ' ')} : ${count}\n`);
  }
  process.stdout.write(`\n  top 10 files:\n`);
  for (const [file, count] of topFiles) {
    process.stdout.write(`    ${count.toString().padStart(4, ' ')}  ${file}\n`);
  }

  if (total > CEILING) {
    process.stderr.write(`\n[audit-spacing] ❌ regression — ${total} > ${CEILING}\n`);
    process.exit(1);
  }
  process.stdout.write(`\n[audit-spacing] ✅ within ceiling\n`);
}

main().catch((err) => {
  process.stderr.write(
    `[audit-spacing] crash: ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(2);
});
