/**
 * P17 — Route-based i18n namespace lazy-loader.
 *
 * Why: P17 trimmed `INITIAL_NAMESPACES` in `./i18n-react.ts` to just
 * `['translation', 'common']` so the initial bundle no longer fetches
 * `blog.json`, `pricing.json`, `legal.json`, etc. on first paint. Route
 * components that need an additional namespace must declare it here so
 * the JSON request fires the moment that route mounts (parallel with
 * the route's own JS chunk download — zero serial waterfall cost).
 *
 * Usage in a page:
 *   import { useRouteNamespaces } from '@/lib/useRouteNamespaces';
 *   export const BlogPage = () => {
 *     useRouteNamespaces(['blog']);
 *     // ...
 *   };
 *
 * Or in a leaf component that already calls `useTranslation('foo')`:
 *   the namespace is auto-loaded by react-i18next's bindI18n hook, so
 *   `useRouteNamespaces` is redundant but harmless (idempotent).
 *
 * Important: keys are stringified to keep the effect dep stable even
 * when the caller passes a fresh array literal each render.
 */
import { useEffect } from 'react';
import i18n from './i18n-react';
import { Logger } from './logger';

export type RouteNamespace =
  | 'common'
  | 'blog'
  | 'contact'
  | 'services'
  | 'pricing'
  | 'caseStudies'
  | 'newsletter'
  | 'liveChat'
  | 'legal'
  | 'forms';

/**
 * Load one or more i18n namespaces when the calling component mounts.
 *
 * Safe to call multiple times — i18next's internal cache deduplicates
 * load requests (it tracks in-flight namespaces per language).
 *
 * @param namespaces  Single ns string or array of ns strings.
 */
export function useRouteNamespaces(namespaces: RouteNamespace | readonly RouteNamespace[]): void {
  const list = Array.isArray(namespaces)
    ? (namespaces as readonly RouteNamespace[])
    : ([namespaces as RouteNamespace] as const);
  // Stringify deps so an inline array literal doesn't cause an infinite
  // effect loop. Sorted to make `['a','b']` and `['b','a']` equivalent.
  const key = [...list].sort().join(',');

  useEffect(() => {
    void i18n.loadNamespaces(list as unknown as string[]).catch((err) => {
      Logger.warn('[i18n] loadNamespaces failed', { namespaces: list, err });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/**
 * Static map of route → required namespaces. Used by tooling
 * (content-qa-auditor) to verify every route declares its namespaces.
 * Not consumed at runtime — components import the hook directly.
 */
export const ROUTE_NAMESPACE_MAP = {
  '/': ['common'],
  '/services': ['common', 'services'],
  '/services/:slug': ['common', 'services'],
  '/pricing': ['common', 'pricing'],
  '/blog': ['common', 'blog'],
  '/blog/:slug': ['common', 'blog'],
  '/case-studies': ['common', 'caseStudies'],
  '/case-studies/:slug': ['common', 'caseStudies'],
  '/contact': ['common', 'contact', 'forms'],
  '/privacy': ['common', 'legal'],
  '/privacy/data-rights': ['common', 'forms', 'legal'],
  '/terms': ['common', 'legal'],
  '/cookies': ['common', 'legal'],
  '/admin': ['common', 'forms'],
} as const satisfies Record<string, readonly RouteNamespace[]>;
