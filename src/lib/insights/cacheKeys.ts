export const CACHE_TTL = {
  HUB: 300, // 5 minutes
  ARTICLE: 3600, // 1 hour
  SEARCH: 900, // 15 minutes
  SEO_HEALTH: 1800,
  DASHBOARD: 120,
} as const;

export const CACHE_KEYS = {
  hubFeed(domain?: string, page?: number): string {
    const base = 'insights:hub';
    const d = domain ? `:${domain}` : '';
    const p = page && page > 1 ? `:p${page}` : '';
    return `${base}${d}${p}`;
  },

  article(slug: string): string {
    return `insights:article:${slug}`;
  },

  searchResults(q: string, filters: string): string {
    const normalised = q.trim().toLowerCase().slice(0, 100);
    return `insights:search:${normalised}:${filters}`;
  },

  seoHealth(): string {
    return 'insights:seo:health';
  },

  dashboardStats(): string {
    return 'insights:admin:dashboard';
  },

  tagGaps(): string {
    return 'insights:admin:tag-gaps';
  },
} as const;
