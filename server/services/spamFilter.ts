// Regex-based spam filter MVP — no external deps, no network call.
// Upgrade path: swap isSpam() with Akismet API call in production.

const URL_PATTERN = /https?:\/\/[^\s]+/gi;
const MAX_URLS = 2;

const SPAM_PATTERNS = [
  /\b(casino|poker|slot|jackpot|betting|bet now)\b/i,
  /\b(buy now|click here|free money|earn \$)\b/i,
  /\b(viagra|cialis|pharmacy|prescription)\b/i,
  /\b(seo\s+service|backlink|link\s+building)\b/i,
  // Repeated chars (aaaaa, !!!!!!)
  /(.)\1{6,}/,
  // ALL CAPS sentences (>50% caps)
] as const;

export function isSpam(text: string): boolean {
  if (!text) return false;

  // Too many URLs
  const urlMatches = text.match(URL_PATTERN);
  if (urlMatches && urlMatches.length > MAX_URLS) return true;

  // Match any spam pattern
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text)) return true;
  }

  // High caps ratio (>60% uppercase alpha chars)
  const alphaChars = text.replace(/[^a-zA-Z]/g, '');
  if (alphaChars.length > 20) {
    const upperCount = alphaChars.replace(/[^A-Z]/g, '').length;
    if (upperCount / alphaChars.length > 0.6) return true;
  }

  return false;
}

export { SPAM_PATTERNS };
