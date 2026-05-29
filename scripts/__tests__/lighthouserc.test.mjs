import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');

const REQUIRED_URLS = [
  'https://www.ecypro.com/',
  'https://www.ecypro.com/founder',
  'https://www.ecypro.com/pricing',
  'https://www.ecypro.com/discovery',
  'https://www.ecypro.com/services',
  'https://www.ecypro.com/perspektifler',
];

describe('lighthouserc.json', () => {
  let config;

  it('parses as valid JSON', () => {
    const raw = readFileSync(resolve(ROOT, 'lighthouserc.json'), 'utf8');
    config = JSON.parse(raw);
  });

  it('has ci.collect.url with exactly 6 production URLs', () => {
    const urls = config.ci.collect.url;
    assert.equal(urls.length, 6, `expected 6 URLs, got ${urls.length}`);
  });

  it('contains all required conversion-critical URLs', () => {
    const urls = config.ci.collect.url;
    for (const required of REQUIRED_URLS) {
      assert.ok(urls.includes(required), `missing required URL: ${required}`);
    }
  });

  it('score thresholds meet minimums', () => {
    const assertions = config.ci.assert.assertions;
    const perf = assertions['categories:performance'];
    const a11y = assertions['categories:accessibility'];
    const bp = assertions['categories:best-practices'];
    const seo = assertions['categories:seo'];

    assert.ok(perf[1].minScore >= 0.85, 'performance threshold must be ≥0.85');
    assert.ok(a11y[1].minScore >= 0.95, 'accessibility threshold must be ≥0.95');
    assert.ok(bp[1].minScore >= 0.90, 'best-practices threshold must be ≥0.90');
    assert.ok(seo[1].minScore >= 0.95, 'SEO threshold must be ≥0.95');
  });

  it('LCP assertion ≤2500ms', () => {
    const lcp = config.ci.assert.assertions['largest-contentful-paint'];
    assert.ok(lcp[1].maxNumericValue <= 2500, 'LCP budget must be ≤2500ms');
  });

  it('CLS assertion ≤0.1', () => {
    const cls = config.ci.assert.assertions['cumulative-layout-shift'];
    assert.ok(cls[1].maxNumericValue <= 0.1, 'CLS budget must be ≤0.1');
  });

  it('upload target set', () => {
    assert.ok(config.ci.upload?.target, 'upload.target must be set');
  });

  it('numberOfRuns ≥1', () => {
    assert.ok(config.ci.collect.numberOfRuns >= 1, 'numberOfRuns must be ≥1');
  });
});

describe('scripts/lhci-budget.json', () => {
  let budget;

  it('parses as valid JSON', () => {
    const raw = readFileSync(resolve(ROOT, 'scripts/lhci-budget.json'), 'utf8');
    budget = JSON.parse(raw);
    assert.ok(Array.isArray(budget), 'budget must be an array');
  });

  it('has at least one budget entry', () => {
    assert.ok(budget.length > 0, 'budget must have at least one entry');
  });

  it('LCP timing budget ≤2500ms', () => {
    const entry = budget[0];
    const lcp = entry.timings?.find((t) => t.metric === 'largest-contentful-paint');
    assert.ok(lcp, 'LCP timing entry missing');
    assert.ok(lcp.budget <= 2500, 'LCP budget must be ≤2500ms');
  });

  it('total resource size budget present', () => {
    const entry = budget[0];
    const total = entry.resourceSizes?.find((r) => r.resourceType === 'total');
    assert.ok(total, 'total resource size budget missing');
  });
});
