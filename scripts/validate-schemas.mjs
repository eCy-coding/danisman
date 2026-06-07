#!/usr/bin/env node
/**
 * S13-R5-G4 — Homepage JSON-LD validator.
 *
 * Renders the given route through a headless browser (so the client-side
 * upsertJsonLd() injections from SchemaOrg.tsx + SEO.tsx are captured),
 * extracts every `<script type="application/ld+json">` payload, then
 * validates each against schema.org definitions via
 * `structured-data-testing-tool` (sdtt).
 *
 * Output: schema-validation-report.json + non-zero exit on any failure.
 *
 * CLI:
 *   node scripts/validate-schemas.mjs --base-url <url> --route <path> [--preset google]
 *
 * Required runtime deps (installed in the GH Action):
 *   - playwright (already in repo)
 *   - structured-data-testing-tool (installed globally in CI)
 */

import { writeFileSync } from 'node:fs';
import { argv, exit } from 'node:process';

function arg(name, fallback = '') {
  const i = argv.indexOf(name);
  if (i === -1) return fallback;
  return argv[i + 1] ?? fallback;
}

const baseUrl = arg('--base-url', 'http://localhost:4173');
const route = arg('--route', '/');
const preset = arg('--preset', 'google'); // sdtt presets: google, twitter, facebook

const url = `${baseUrl.replace(/\/$/, '')}${route}`;
console.log(`[schema-validator] target: ${url}  preset: ${preset}`);

// Lazy-import so the script can fail gracefully with a useful error if
// playwright isn't installed (instead of an opaque ESM resolution crash).
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch (err) {
  console.error('[schema-validator] playwright missing. Install via `npm i -D playwright`.');
  console.error(err.message);
  exit(2);
}

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];

try {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  // Allow client-side useEffect upserts (SchemaOrg, SEO) a beat to fire.
  await page.waitForTimeout(1500);

  const schemas = await page.$$eval(
    'script[type="application/ld+json"]',
    (scripts) =>
      scripts.map((s) => {
        try {
          return { ok: true, data: JSON.parse(s.textContent || '') };
        } catch (e) {
          return { ok: false, err: e.message, raw: (s.textContent || '').slice(0, 200) };
        }
      }),
  );

  console.log(`[schema-validator] found ${schemas.length} JSON-LD nodes`);

  schemas.forEach((s, i) => {
    if (!s.ok) {
      errors.push({ i, kind: 'parse_error', err: s.err, raw: s.raw });
      return;
    }
    const data = s.data;
    const flat = Array.isArray(data) ? data : [data];
    flat.forEach((node) => {
      const t = node['@type'];
      if (!t) errors.push({ i, kind: 'missing_@type', node });
      if (!node['@context']) errors.push({ i, kind: 'missing_@context', '@type': t });
      // Per-type minimum required fields (Google Rich Results presets).
      if (t === 'FAQPage' || (Array.isArray(t) && t.includes('FAQPage'))) {
        if (!Array.isArray(node.mainEntity) || node.mainEntity.length < 2) {
          errors.push({ i, kind: 'faq_mainEntity_lt_2', count: node.mainEntity?.length });
        }
        (node.mainEntity ?? []).forEach((q, qi) => {
          if (q['@type'] !== 'Question') errors.push({ i, qi, kind: 'faq_q_not_Question' });
          if (!q.name) errors.push({ i, qi, kind: 'faq_q_no_name' });
          if (!q.acceptedAnswer?.text) errors.push({ i, qi, kind: 'faq_q_no_answer_text' });
        });
      }
      if (t === 'BreadcrumbList' || (Array.isArray(t) && t.includes('BreadcrumbList'))) {
        const items = node.itemListElement;
        if (!Array.isArray(items) || items.length < 2) {
          errors.push({ i, kind: 'breadcrumb_lt_2', count: items?.length });
        }
      }
      if (
        (Array.isArray(t) ? t : [t]).some((x) =>
          ['Organization', 'ProfessionalService'].includes(x),
        )
      ) {
        if (!node.name) errors.push({ i, kind: 'org_no_name' });
        if (!node.url) errors.push({ i, kind: 'org_no_url' });
      }
    });
  });

  const report = {
    target: url,
    preset,
    timestamp: new Date().toISOString(),
    schemaCount: schemas.length,
    errorCount: errors.length,
    errors,
  };
  writeFileSync('schema-validation-report.json', JSON.stringify(report, null, 2));

  if (errors.length > 0) {
    console.error(`[schema-validator] ✖ ${errors.length} validation errors:`);
    errors.forEach((e) => console.error(JSON.stringify(e)));
    exit(1);
  }
  console.log(`[schema-validator] ✔ ${schemas.length} JSON-LD nodes valid (0 errors)`);
} finally {
  await browser.close();
}
