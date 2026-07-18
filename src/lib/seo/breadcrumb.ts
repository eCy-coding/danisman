/**
 * P51.2 — BreadcrumbList JSON-LD builder.
 *
 * Site-wide utility. Her sayfa için breadcrumb chain üretir.
 * Google Rich Results + accessibility hint.
 */

export interface BreadcrumbStep {
  name: string;
  url: string;
}

export function buildBreadcrumbListSchema(steps: BreadcrumbStep[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: steps.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: s.name,
      item: s.url,
    })),
  };
}

/**
 * URL pathname'inden default breadcrumb üretir.
 * Custom segment label'ları opsiyonel override edilebilir.
 */
export function autoBreadcrumbFromPath(
  pathname: string,
  labels: Record<string, string> = {},
  baseUrl: string = 'https://ecypro.com',
): BreadcrumbStep[] {
  const segments = pathname.split('/').filter(Boolean);
  const steps: BreadcrumbStep[] = [{ name: 'Anasayfa', url: `${baseUrl}/` }];

  let cumulative = '';
  for (const seg of segments) {
    cumulative += `/${seg}`;
    const label = labels[seg] ?? seg.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
    steps.push({ name: label, url: `${baseUrl}${cumulative}` });
  }
  return steps;
}
