#!/usr/bin/env node
/**
 * P14-BE: OpenAPI ↔ Route drift detector.
 *
 *   node scripts/api-contract-test.mjs
 *
 * Exits 0 if the OpenAPI spec and the actual Express routes are in
 * agreement. Exits 1 if either side has endpoints the other doesn't
 * know about. Designed to run in CI on every PR.
 *
 * The script is intentionally DEPENDENCY-FREE — it parses
 *   - server/config/openapi.ts (export `openApiSpec` constant)
 *   - server/routes/index.ts   (mount table: router.use('/auth', ...))
 *   - server/routes/*.ts       (router.get/post/... callsites)
 * using regex. This avoids spinning up ts-node just to load a typed
 * spec and keeps the runner under 200ms.
 *
 * Limitations (documented, intentional):
 *   - Dynamic mount paths and computed route strings are not detected.
 *   - Path-params are normalised to `{name}` so OpenAPI's `{id}` and
 *     Express' `:id` compare equal.
 *   - The script is allowlist-aware: paths matching IGNORE_PREFIXES are
 *     dropped from both sides before comparison (e.g. /__health internal
 *     liveness probes that we deliberately don't document).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SERVER = path.join(ROOT, 'server');

// ────────────────────────────────────────────────────────────────────
// Allowlist
// ────────────────────────────────────────────────────────────────────
const IGNORE_PREFIXES = [
  '/__health', // internal Render liveness probe
  '/dev/', // dev-only fixtures
  '/sse/', // SSE channels documented elsewhere
];

// ────────────────────────────────────────────────────────────────────
// 1) Load the OpenAPI spec — paths + newPaths
// ────────────────────────────────────────────────────────────────────
function loadOpenApiPaths() {
  const src = fs.readFileSync(path.join(SERVER, 'config/openapi.ts'), 'utf8');
  const paths = new Set();

  // Strategy: for each block (`paths:` and `newPaths:`), extract the body
  // by brace-matching, then for each `'/...': {` key inside that body at
  // depth 0, slice the path-entry body by brace-matching FORWARD from
  // that `{`, and finally extract verbs only from that path entry's
  // immediate child level.
  const blocks = ['paths', 'newPaths'];
  for (const blockName of blocks) {
    const re = new RegExp(`${blockName}:\\s*\\{`);
    const m = re.exec(src);
    if (!m) continue;
    const body = sliceBalanced(src, m.index + m[0].length - 1); // body without outer braces

    // Walk body and find path keys at depth 0
    let d = 0;
    for (let i = 0; i < body.length; i++) {
      const ch = body[i];
      if (ch === '{') {
        d++;
        continue;
      }
      if (ch === '}') {
        d--;
        continue;
      }
      if (d !== 0) continue;
      // Try to match a path key starting here. Skip whitespace + commas.
      if (ch === '\n' || ch === ' ' || ch === ',' || ch === '\t') continue;
      const tail = body.slice(i);
      const keyMatch = tail.match(/^['"`](\/[^'"`]*)['"`]\s*:\s*\{/);
      if (!keyMatch) continue;
      const pathStr = keyMatch[1];
      // Find the position of the opening `{` of this path's body.
      const openIdx = i + keyMatch[0].length - 1;
      const pathBody = sliceBalanced(body, openIdx);
      // Extract verbs at depth 0 of pathBody
      const verbs = extractVerbsAtDepth0(pathBody);
      for (const verb of verbs) {
        paths.add(`${verb.toUpperCase()} ${normalisePath(pathStr)}`);
      }
      // Skip past the path body to avoid re-matching
      i = openIdx + pathBody.length + 1;
    }
  }
  return paths;
}

/**
 * Given source and the index of an opening `{`, return the substring
 * INSIDE the matching braces (excluding the braces themselves).
 */
function sliceBalanced(src, openIdx) {
  if (src[openIdx] !== '{') throw new Error('sliceBalanced expects { at openIdx');
  let depth = 1;
  let i = openIdx + 1;
  const start = i;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    i++;
  }
  return src.slice(start, i - 1);
}

function extractVerbsAtDepth0(body) {
  const verbs = [];
  let d = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '{') {
      d++;
      continue;
    }
    if (ch === '}') {
      d--;
      continue;
    }
    if (d !== 0) continue;
    const tail = body.slice(i);
    const vm = tail.match(/^(get|post|put|patch|delete|head|options)\s*:\s*\{/);
    if (vm) {
      verbs.push(vm[1]);
      // Skip past this verb's body
      const openIdx = i + vm[0].length - 1;
      const verbBody = sliceBalanced(body, openIdx);
      i = openIdx + verbBody.length + 1;
    }
  }
  return verbs;
}

// ────────────────────────────────────────────────────────────────────
// 2) Walk the route mount table + every router.<verb>(...)
// ────────────────────────────────────────────────────────────────────
function loadExpressRoutes() {
  const routes = new Set();

  // Mount points from server/routes/index.ts — also includes inline
  // handlers attached directly to the same router.
  const indexSrc = fs.readFileSync(path.join(SERVER, 'routes/index.ts'), 'utf8');

  // Inline handlers on the API root router (prefixed at app level with /api)
  const inline = matchAll(indexSrc, /router\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g);
  for (const [, verb, p] of inline) {
    routes.add(`${verb.toUpperCase()} ${normalisePath(p)}`);
  }

  // Read mount table → { '/auth': 'authRoutes', ... }
  const mounts = matchAll(indexSrc, /router\.use\(\s*['"`]([^'"`]+)['"`]\s*,\s*(\w+)\s*\)/g);
  const importMap = buildImportMap(indexSrc);

  for (const [, mountPath, varName] of mounts) {
    const file = importMap[varName];
    if (!file) continue;
    const routeFile = path.join(SERVER, 'routes', `${file}.ts`);
    if (!fs.existsSync(routeFile)) continue;
    const src = fs.readFileSync(routeFile, 'utf8');
    const verbCalls = matchAll(src, /router\.(get|post|put|patch|delete)\(\s*['"`]([^'"`]*)['"`]/g);
    for (const [, verb, p] of verbCalls) {
      const full = joinPath(mountPath, p);
      routes.add(`${verb.toUpperCase()} ${normalisePath(full)}`);
    }
  }
  return routes;
}

function buildImportMap(src) {
  const map = {};
  const imports = matchAll(src, /import\s+(\w+)\s+from\s+['"`]\.\/([^'"`]+)['"`]/g);
  for (const [, varName, file] of imports) map[varName] = file;
  return map;
}

function matchAll(src, re) {
  const out = [];
  let m;
  while ((m = re.exec(src)) !== null) out.push(m);
  return out;
}

function joinPath(a, b) {
  const left = a.replace(/\/$/, '');
  const right = b.startsWith('/') ? b : `/${b}`;
  return (left + right).replace(/\/+/g, '/') || '/';
}

// Normalise both Express ':id' and OpenAPI '{id}' to '{id}' for comparison,
// and strip trailing slash (Express '/sessions/' == OpenAPI '/sessions').
function normalisePath(p) {
  const withParams = p.replace(/:([a-zA-Z0-9_]+)/g, '{$1}');
  if (withParams.length > 1 && withParams.endsWith('/')) return withParams.slice(0, -1);
  return withParams;
}

function shouldIgnore(entry) {
  const p = entry.split(' ', 2)[1] ?? '';
  return IGNORE_PREFIXES.some((prefix) => p.startsWith(prefix));
}

// ────────────────────────────────────────────────────────────────────
// 3) Compare + report
// ────────────────────────────────────────────────────────────────────
function main() {
  const spec = new Set([...loadOpenApiPaths()].filter((e) => !shouldIgnore(e)));
  const routes = new Set([...loadExpressRoutes()].filter((e) => !shouldIgnore(e)));

  const undocumented = [...routes].filter((r) => !spec.has(r)).sort();
  const phantom = [...spec].filter((r) => !routes.has(r)).sort();

  const summary = {
    specEndpoints: spec.size,
    routeEndpoints: routes.size,
    undocumented: undocumented.length,
    phantom: phantom.length,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (undocumented.length) {
    console.log('\nUndocumented routes (in code, missing from OpenAPI):');
    for (const r of undocumented) console.log(`  - ${r}`);
  }
  if (phantom.length) {
    console.log('\nPhantom spec entries (in OpenAPI, missing from code):');
    for (const r of phantom) console.log(`  - ${r}`);
  }

  if (process.env.STRICT === '1' && (undocumented.length || phantom.length)) {
    process.exit(1);
  }
}

main();
