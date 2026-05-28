/**
 * L1-6 — /founder page existence + route registration tests.
 *
 * Why: route was /founder → Navigate to="/about" (bare redirect).
 * Now must render real FounderPage with bio + Big4 vs Boutique section.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('FounderPage — L1-6', () => {
  it('FounderPage module exports named component', async () => {
    const mod = await import('./FounderPage');
    expect(mod.FounderPage, 'FounderPage not exported').toBeDefined();
    expect(typeof mod.FounderPage, 'FounderPage is not a function').toBe('function');
  });

  it('/founder route renders FounderPage — not Navigate redirect to /about', () => {
    const appPath = resolve(__dirname, '../App.tsx');
    const content = readFileSync(appPath, 'utf-8');
    // Must NOT have the old redirect pattern
    expect(content, 'Old /founder redirect still present').not.toMatch(
      /path="\/founder"[^>]*Navigate[^>]*to="\/about"/,
    );
    // Must import FounderPage
    expect(content, 'FounderPage not imported in App.tsx').toContain('FounderPage');
  });

  it('FounderPage content includes Big4 vs Boutique section', async () => {
    const pagePath = resolve(__dirname, './FounderPage.tsx');
    const content = readFileSync(pagePath, 'utf-8');
    expect(content, 'Big4 comparison section missing').toContain('Big4');
    expect(content, 'Boutique positioning missing').toContain('Boutique');
  });
});
