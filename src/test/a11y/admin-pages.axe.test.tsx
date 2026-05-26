/**
 * Phase 0.5 — Admin Pages A11y Static Audit
 *
 * Scans Phase 0 admin components for WCAG 2.1 AA violations using
 * the same static-scanner approach as static-rules.test.tsx.
 * (vitest-axe runtime not available in this sandbox — arm64 mismatch.)
 *
 * Targets: AdminBlogPage, AdminGuard, LiveLeadFeed, Drawer, Modal (Phase 0 touched)
 */

import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';

const ADMIN_TARGETS = [
  'src/pages/admin/AdminBlogPage.tsx',
  'src/components/admin/auth/AdminGuard.tsx',
  'src/components/admin/LiveLeadFeed.tsx',
  'src/components/admin/ui/Drawer.tsx',
  'src/components/admin/ui/Modal.tsx',
];

const ROOT = path.resolve(__dirname, '../../..');

interface Finding {
  rule: string;
  file: string;
  line: number;
  snippet: string;
}

async function scanFile(relPath: string, rules: string[]): Promise<Finding[]> {
  const absPath = path.join(ROOT, relPath);
  let src: string;
  try {
    src = await fs.readFile(absPath, 'utf8');
  } catch {
    return [{ rule: 'FILE_NOT_FOUND', file: relPath, line: 0, snippet: absPath }];
  }

  const lines = src.split('\n');
  const findings: Finding[] = [];

  for (const rule of rules) {
    switch (rule) {
      case 'IMG_NO_ALT': {
        const re = /<img\b[^>]*?>/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(src))) {
          if (!/\balt\s*=/.test(m[0])) {
            const line = src.slice(0, m.index).split('\n').length;
            findings.push({ rule, file: relPath, line, snippet: m[0].slice(0, 60) });
          }
        }
        break;
      }
      case 'EMPTY_ARIA_LABEL': {
        const re = /aria-label\s*=\s*['"]\s*['"]/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(src))) {
          const line = src.slice(0, m.index).split('\n').length;
          findings.push({ rule, file: relPath, line, snippet: lines[line - 1]?.trim() ?? '' });
        }
        break;
      }
      case 'BUTTON_NO_TYPE': {
        // <button> without type= (defaults to submit, causes unintended form submits)
        const re = /<button\b(?![^>]*\btype\s*=)[^>]*>/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(src))) {
          if (!m[0].includes('type=')) {
            const line = src.slice(0, m.index).split('\n').length;
            findings.push({ rule, file: relPath, line, snippet: m[0].slice(0, 60) });
          }
        }
        break;
      }
      case 'ROLE_PRESENTATION_INTERACTIVE': {
        // role="presentation" on elements with onClick (removes semantics from interactive)
        const re =
          /role\s*=\s*["']presentation["'][^>]*onClick|onClick[^>]*role\s*=\s*["']presentation["']/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(src))) {
          const line = src.slice(0, m.index).split('\n').length;
          findings.push({ rule, file: relPath, line, snippet: m[0].slice(0, 60) });
        }
        break;
      }
      case 'ARIA_LABEL_SPINNER': {
        // animate-spin elements must have aria-label or aria-hidden
        const re = /className[^>]*animate-spin[^>]*>/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(src))) {
          const tag = m[0];
          if (!/aria-label|aria-hidden/.test(tag)) {
            const line = src.slice(0, m.index).split('\n').length;
            findings.push({ rule, file: relPath, line, snippet: tag.slice(0, 60) });
          }
        }
        break;
      }
    }
  }

  return findings;
}

async function scanAll(rules: string[]): Promise<Finding[]> {
  const all: Finding[] = [];
  for (const f of ADMIN_TARGETS) {
    all.push(...(await scanFile(f, rules)));
  }
  return all;
}

describe('Phase 0 admin pages — a11y static audit (WCAG 2.1 AA)', () => {
  it('no <img> without alt attribute', async () => {
    const findings = await scanAll(['IMG_NO_ALT']);
    expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
  });

  it('no empty aria-label (empty string = worse than no label)', async () => {
    const findings = await scanAll(['EMPTY_ARIA_LABEL']);
    expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
  });

  it('no <button> without type attribute in admin pages', async () => {
    const findings = await scanAll(['BUTTON_NO_TYPE']);
    expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
  });

  it('no role=presentation on interactive elements', async () => {
    const findings = await scanAll(['ROLE_PRESENTATION_INTERACTIVE']);
    expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
  });

  it('loading spinners have aria-label or aria-hidden (AdminGuard spinner)', async () => {
    const findings = await scanAll(['ARIA_LABEL_SPINNER']);
    expect(findings, JSON.stringify(findings, null, 2)).toEqual([]);
  });
});
