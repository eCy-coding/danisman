/**
 * P46 C2: react-helmet-async@2.0.5 + React 19 uyumsuzluğu workaround.
 *
 * Bu modül `react-helmet-async`'in API'ini taklit eder (Helmet + HelmetProvider)
 * ama useEffect ile doğrudan DOM manipülasyonu yapar. Mevcut import path'leri
 * korur, kod değişikliği gerektirmez: `import { Helmet } from 'react-helmet-async'`
 * yerine `from '@/lib/seo-helmet'` kullan.
 *
 * Desteklenen child element'ler:
 *   <title>...</title>
 *   <meta name|property="..." content="..." />
 *   <link rel="..." href="..." />
 *   <script type="application/ld+json">{...}</script>
 *   <html lang="..." />
 *
 * Helmet'in tüm gelişmiş özellikleri (priority, defer, async children gibi)
 * implemente edilmemiştir; ihtiyaç olmadıkça eklenmez.
 */

import React, { useEffect } from 'react';

type HelmetChild = React.ReactElement | string | null | undefined | false;

interface HelmetProps {
  children?: HelmetChild | HelmetChild[];
}

interface ParsedTag {
  tag: string;
  attrs: Record<string, string>;
  text?: string;
}

function flattenChildren(children: HelmetProps['children']): React.ReactElement[] {
  const result: React.ReactElement[] = [];
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      result.push(child);
    }
  });
  return result;
}

function parseTag(el: React.ReactElement): ParsedTag | null {
  const tag = typeof el.type === 'string' ? el.type : null;
  if (!tag) return null;

  const props = (el.props ?? {}) as Record<string, unknown>;
  const attrs: Record<string, string> = {};
  let text: string | undefined;

  for (const [key, value] of Object.entries(props)) {
    if (key === 'children') {
      if (typeof value === 'string') text = value;
      else if (typeof value === 'number') text = String(value);
      continue;
    }
    if (value == null || typeof value === 'boolean') continue;
    if (typeof value === 'string' || typeof value === 'number') {
      attrs[key] = String(value);
    }
  }

  return { tag, attrs, text };
}

function selectorFor(parsed: ParsedTag): string {
  const { tag, attrs } = parsed;
  if (tag === 'meta') {
    if (attrs.name) return `meta[name="${attrs.name}"][data-seo-helmet]`;
    if (attrs.property) return `meta[property="${attrs.property}"][data-seo-helmet]`;
    if (attrs['http-equiv']) return `meta[http-equiv="${attrs['http-equiv']}"][data-seo-helmet]`;
    return '';
  }
  if (tag === 'link') {
    if (attrs.rel) return `link[rel="${attrs.rel}"][data-seo-helmet]`;
    return '';
  }
  if (tag === 'script') {
    return '';
  }
  return '';
}

function applyTag(parsed: ParsedTag): HTMLElement | null {
  const { tag, attrs, text } = parsed;

  if (tag === 'title' && text) {
    document.title = text;
    return null;
  }

  if (tag === 'html' && attrs.lang) {
    document.documentElement.setAttribute('lang', attrs.lang);
    return null;
  }

  if (tag === 'meta' || tag === 'link' || tag === 'script') {
    const selector = selectorFor(parsed);
    let el = selector ? document.head.querySelector<HTMLElement>(selector) : null;
    if (!el) {
      el = document.createElement(tag);
      el.setAttribute('data-seo-helmet', 'true');
      document.head.appendChild(el);
    }
    for (const [k, v] of Object.entries(attrs)) {
      // React style attribute namespacing — http-equiv kept as-is
      el.setAttribute(k, v);
    }
    if (tag === 'script' && text) {
      el.textContent = text;
    }
    return el;
  }

  return null;
}

export const Helmet: React.FC<HelmetProps> = ({ children }) => {
  useEffect(() => {
    const created: HTMLElement[] = [];
    const children0 = flattenChildren(children);

    for (const child of children0) {
      const parsed = parseTag(child);
      if (!parsed) continue;
      const node = applyTag(parsed);
      if (node) created.push(node);
    }

    return () => {
      // Cleanup tags we own (have data-seo-helmet attr)
      for (const node of created) {
        if (node.getAttribute('data-seo-helmet') === 'true' && node.parentNode) {
          // Note: we do NOT remove on unmount — leaving the last value
          // lets transient page changes keep the last canonical etc.
          // If pages need to swap (e.g. title), the next mount overwrites.
        }
      }
    };
  });

  return null;
};

export const HelmetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export default Helmet;
