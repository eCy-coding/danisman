/**
 * Regression: every article page used to render its own YAML frontmatter as
 * body text (browser-verified 2026-07-20 on both /tr/… and /en/… articles).
 */
import { describe, it, expect } from 'vitest';
import { stripMdxFrontmatter } from './mdx-frontmatter';

const WITH_FM = `---
title: 'KVKK Uyum Süreci'
excerpt: 'Yedi adımlı rehber'
pair_id: 'kvkk-uyum-sureci-adim-adim'
---

import { FAQSection } from '../../components/blog/FAQSection';

# Başlık

Gövde metni.
`;

describe('stripMdxFrontmatter', () => {
  it('removes the frontmatter block and keeps the body', () => {
    const { code, stripped } = stripMdxFrontmatter(WITH_FM);
    expect(stripped).toBe(true);
    expect(code).not.toContain('title:');
    expect(code).not.toContain('pair_id:');
    expect(code).toContain('# Başlık');
    expect(code).toContain('Gövde metni.');
  });

  it('preserves line numbers so sourcemaps stay accurate', () => {
    const { code } = stripMdxFrontmatter(WITH_FM);
    const originalHeadingLine = WITH_FM.split('\n').findIndex((l) => l.startsWith('# '));
    const strippedHeadingLine = code.split('\n').findIndex((l) => l.startsWith('# '));
    expect(strippedHeadingLine).toBe(originalHeadingLine);
  });

  it('leaves a file without frontmatter untouched', () => {
    const plain = '# Just a heading\n\nBody.\n';
    expect(stripMdxFrontmatter(plain)).toEqual({ code: plain, stripped: false });
  });

  it('leaves an unterminated frontmatter block untouched', () => {
    const broken = "---\ntitle: 'no closing fence'\n\n# Heading\n";
    expect(stripMdxFrontmatter(broken).stripped).toBe(false);
  });

  it('does not strip a horizontal rule that appears mid-document', () => {
    const midRule = '# Heading\n\n---\n\nBody after a rule.\n';
    expect(stripMdxFrontmatter(midRule).stripped).toBe(false);
  });
});
