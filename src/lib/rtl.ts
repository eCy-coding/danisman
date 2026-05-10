/**
 * P39-T09: RTL Support Scaffold
 *
 * Applies `dir` attribute to document root based on active locale.
 * Arabic/Hebrew/Persian/Urdu are RTL; all others default LTR.
 *
 * Tailwind CSS logical properties used for RTL-safe layout:
 *   - ms-* / me-*  → margin-start / margin-end (replaces ml-/mr-)
 *   - ps-* / pe-*  → padding-start / padding-end (replaces pl-/pr-)
 *   - text-start   → replaces text-left (RTL-safe)
 *   - text-end     → replaces text-right
 *   - start-0      → replaces left-0
 *   - end-0        → replaces right-0
 *   - border-s-*   → replaces border-l-*
 *   - rounded-s-*  → replaces rounded-l-*
 *
 * Currently supports: tr (LTR), en (LTR)
 * Future: ar (RTL), he (RTL), fa (RTL), ur (RTL)
 *
 * Usage (called from i18next language change event in main.tsx):
 *   import { applyRtl } from './lib/rtl';
 *   i18next.on('languageChanged', (lng) => applyRtl(lng));
 */

const RTL_LOCALES = new Set(['ar', 'he', 'fa', 'ur', 'yi', 'dv', 'ks']);

/**
 * Returns true if the given locale is RTL.
 * Uses IETF language tag — checks primary subtag only.
 * Example: 'ar-SA' → true, 'ar' → true, 'en-US' → false
 */
export function isRtlLocale(locale: string): boolean {
  const primaryTag = locale.toLowerCase().split(/[-_]/)[0] ?? '';
  return RTL_LOCALES.has(primaryTag);
}

/**
 * Apply `dir` attribute to <html> element based on locale.
 * Also sets `lang` for screen readers / search engines.
 *
 * @param locale  IETF language tag (e.g. "tr", "en", "ar-SA")
 */
export function applyRtl(locale: string): void {
  if (typeof document === 'undefined') return; // SSR guard
  const dir = isRtlLocale(locale) ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', locale);
}

/**
 * Get current document direction.
 */
export function getCurrentDir(): 'ltr' | 'rtl' {
  if (typeof document === 'undefined') return 'ltr';
  return (document.documentElement.getAttribute('dir') ?? 'ltr') as 'ltr' | 'rtl';
}

/**
 * React hook to get current text direction.
 * Updates when locale changes via i18next.
 *
 * Usage:
 *   const dir = useDir();
 *   <div style={{ textAlign: dir === 'rtl' ? 'right' : 'left' }}>
 */
export function getDir(locale: string): 'ltr' | 'rtl' {
  return isRtlLocale(locale) ? 'rtl' : 'ltr';
}
