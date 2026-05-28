/**
 * P51.1 — Founder Person schema enrichment.
 *
 * Person JSON-LD for Emre Can Yalçın — with sameAs links (LinkedIn, Twitter)
 * if env vars provided. Worksfor → Organization. Knowledge Graph signal.
 *
 * index.html'deki statik Person schema'sının dinamik versiyonu — gerçek
 * LinkedIn URL env'den geldiğinde inject edilir.
 */

const FOUNDER_LINKEDIN = (import.meta.env.VITE_FOUNDER_LINKEDIN ?? '').trim();
const FOUNDER_TWITTER = (import.meta.env.VITE_FOUNDER_TWITTER ?? '').trim();

export function buildFounderSchema() {
  const sameAs: string[] = [];
  if (FOUNDER_LINKEDIN) sameAs.push(FOUNDER_LINKEDIN);
  if (FOUNDER_TWITTER) sameAs.push(FOUNDER_TWITTER);

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': 'https://www.ecypro.com/#founder',
    name: 'Emre Can Yalçın',
    givenName: 'Emre Can',
    familyName: 'Yalçın',
    jobTitle: 'Founder & Chief Strategist',
    description:
      'Founder of eCyPro Premium Consulting and the eCyverse ecosystem. Strategic management advisory, organizational transformation, and culture engineering practitioner.',
    worksFor: { '@id': 'https://www.ecypro.com/#organization' },
    url: 'https://www.ecypro.com/founder',
    image: 'https://www.ecypro.com/founder.jpg',
    ...(sameAs.length ? { sameAs } : {}),
    knowsAbout: [
      'Strategic Management',
      'Organizational Transformation',
      'Culture Engineering',
      'M&A Advisory',
      'Operational Excellence',
      'Family Business Governance',
    ],
  };
}
