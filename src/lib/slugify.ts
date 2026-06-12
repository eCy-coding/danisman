/**
 * Turkish-aware slug + search folding utilities for the Perspektifler vertical.
 *
 * Slug rule (istek.md v2 §PHASE 1): lowercase ASCII, Turkish letters folded
 * (ç→c ğ→g ı→i İ→i ö→o ş→s ü→u), hyphen separator, no duplicates after
 * normalization. `foldForSearch` is the same folding without hyphenation so
 * the search index and queries normalize identically ("donusum" ⇄ "dönüşüm").
 */

const TR_MAP: Record<string, string> = {
  ç: 'c',
  Ç: 'c',
  ğ: 'g',
  Ğ: 'g',
  ı: 'i',
  I: 'i',
  İ: 'i',
  ö: 'o',
  Ö: 'o',
  ş: 's',
  Ş: 's',
  ü: 'u',
  Ü: 'u',
};

/** Fold Turkish letters to ASCII; leaves other characters untouched. */
export function foldTr(input: string): string {
  return input.replace(/[çÇğĞıIİöÖşŞüÜ]/g, (ch) => TR_MAP[ch] ?? ch);
}

/** Lowercase + fold + strip combining marks (for any stray accents). */
export function foldForSearch(input: string): string {
  return foldTr(input).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Canonical slug: folded ASCII lowercase, hyphen-separated. */
export function slugifyTr(input: string): string {
  return foldForSearch(input)
    .replace(/&/g, ' ve ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Tokenize a string for search scoring (folded, ≥2-char tokens). */
export function searchTokens(input: string): string[] {
  return foldForSearch(input)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 2);
}
