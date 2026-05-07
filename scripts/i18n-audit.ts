/**
 * Phase 107a: i18n parity audit.
 *
 * Verifies every namespace under `public/locales/` has matching key sets
 * across `tr` and `en`. Reports:
 *   - Keys missing in one language but present in the other
 *   - Empty string values (untranslated placeholders)
 *   - Type mismatches (string vs object) at the same path
 *
 * Exit code 1 on any drift. Run via `tsx scripts/i18n-audit.ts`.
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

const LOCALES_DIR = path.resolve(process.cwd(), 'public/locales');
const LANGS = ['tr', 'en'] as const;

type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
interface JsonObject {
  [k: string]: JsonValue;
}

interface NamespaceData {
  lang: string;
  namespace: string;
  keys: Map<string, 'string' | 'object' | 'array' | 'other'>;
  emptyKeys: string[];
}

async function loadNamespace(lang: string, namespace: string): Promise<NamespaceData> {
  const file = path.join(LOCALES_DIR, lang, `${namespace}.json`);
  const raw = await fs.readFile(file, 'utf8');
  const parsed = JSON.parse(raw) as JsonObject;
  const keys = new Map<string, 'string' | 'object' | 'array' | 'other'>();
  const emptyKeys: string[] = [];

  function walk(node: JsonValue, prefix: string) {
    if (typeof node === 'string') {
      keys.set(prefix, 'string');
      if (node.trim() === '') emptyKeys.push(prefix);
    } else if (Array.isArray(node)) {
      keys.set(prefix, 'array');
    } else if (node !== null && typeof node === 'object') {
      keys.set(prefix, 'object');
      for (const [k, v] of Object.entries(node)) {
        walk(v, prefix === '' ? k : `${prefix}.${k}`);
      }
    } else {
      keys.set(prefix, 'other');
    }
  }

  walk(parsed, '');
  return { lang, namespace, keys, emptyKeys };
}

async function listNamespaces(lang: string): Promise<string[]> {
  const dir = path.join(LOCALES_DIR, lang);
  const entries = await fs.readdir(dir);
  return entries.filter((e) => e.endsWith('.json')).map((e) => e.replace(/\.json$/, ''));
}

interface Drift {
  namespace: string;
  kind: 'missing-in-tr' | 'missing-in-en' | 'type-mismatch' | 'empty-value';
  key: string;
  detail?: string;
}

async function main() {
  const trNamespaces = await listNamespaces('tr');
  const enNamespaces = await listNamespaces('en');

  const drift: Drift[] = [];

  // Namespace presence parity
  for (const ns of trNamespaces) {
    if (!enNamespaces.includes(ns)) {
      drift.push({ namespace: ns, kind: 'missing-in-en', key: '<file>' });
    }
  }
  for (const ns of enNamespaces) {
    if (!trNamespaces.includes(ns)) {
      drift.push({ namespace: ns, kind: 'missing-in-tr', key: '<file>' });
    }
  }

  // Per-namespace key parity
  const sharedNamespaces = trNamespaces.filter((ns) => enNamespaces.includes(ns));
  for (const ns of sharedNamespaces) {
    const trData = await loadNamespace('tr', ns);
    const enData = await loadNamespace('en', ns);

    for (const [key, type] of trData.keys) {
      if (key === '') continue;
      const enType = enData.keys.get(key);
      if (enType === undefined) {
        drift.push({ namespace: ns, kind: 'missing-in-en', key });
      } else if (enType !== type) {
        drift.push({
          namespace: ns,
          kind: 'type-mismatch',
          key,
          detail: `tr=${type} en=${enType}`,
        });
      }
    }
    for (const [key] of enData.keys) {
      if (key === '') continue;
      if (!trData.keys.has(key)) {
        drift.push({ namespace: ns, kind: 'missing-in-tr', key });
      }
    }

    for (const k of trData.emptyKeys) {
      drift.push({ namespace: ns, kind: 'empty-value', key: k, detail: 'tr' });
    }
    for (const k of enData.emptyKeys) {
      drift.push({ namespace: ns, kind: 'empty-value', key: k, detail: 'en' });
    }
  }

  if (drift.length === 0) {
    process.stdout.write(
      `[i18n-audit] ✅ parity OK — ${LANGS.join(' / ')} aligned across ${sharedNamespaces.length} namespace(s)\n`,
    );
    process.exit(0);
  }

  process.stderr.write(`[i18n-audit] ❌ ${drift.length} drift entries:\n`);
  for (const d of drift) {
    const detail = d.detail ? ` (${d.detail})` : '';
    process.stderr.write(`  - [${d.namespace}] ${d.kind}: ${d.key}${detail}\n`);
  }
  process.exit(1);
}

main().catch((err) => {
  process.stderr.write(`[i18n-audit] crash: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(2);
});
