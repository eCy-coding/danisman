// src/hooks/useInsightsFeed.ts — Wave-3A stub (replace with real API when Wave-1 completes)
import { useState, useEffect } from 'react';
import type { InsightPost, InsightFeedResponse, InsightFilterParams } from '@/types/insights';

// Stub mock data — replace with actual API call
const STUB_POSTS: InsightPost[] = [
  {
    id: 'stub-1',
    slug: 'm-a-due-diligence-checklist',
    type: 'CHECKLIST',
    status: 'PUBLISHED',
    language: 'TR_ONLY',
    titleTr: 'M&A Due Diligence Checklist: 90 Günlük Süreç',
    excerptTr: 'M&A sürecinde due diligence için kritik 90 günlük adımlar.',
    primaryDomain: 'M_A',
    subDomain: 'due-diligence',
    tags: [],
    author: {
      id: 'author-1',
      slug: 'emre-can-yalcin',
      displayName: 'Emre Can Yalçın',
      bioTr: 'eCyPro Kurucu Ortağı',
      avatarUrl: '/images/founder-avatar.jpg',
      isFounder: true,
    },
    coverImageUrl: '/images/placeholder-cover.jpg',
    coverImageAlt: 'M&A Due Diligence',
    readingTimeMin: 8,
    viewCount: 1250,
    publishedAt: '2026-05-01T09:00:00Z',
    isFeatured: true,
    isEditorsPick: false,
  },
  {
    id: 'stub-2',
    slug: 'esg-raporlama-cercevesi',
    type: 'FRAMEWORK',
    status: 'PUBLISHED',
    language: 'BOTH',
    titleTr: 'ESG Raporlama Çerçevesi: GRI ve TCFD Karşılaştırması',
    titleEn: 'ESG Reporting Framework: GRI vs TCFD Comparison',
    excerptTr: 'Türk şirketleri için ESG raporlama standartlarının pratik karşılaştırması.',
    excerptEn: 'Practical comparison of ESG reporting standards for Turkish companies.',
    primaryDomain: 'ESG',
    subDomain: 'raporlama',
    tags: [
      {
        id: 'tag-1',
        slug: 'surdurulebilirlik',
        labelTr: 'Sürdürülebilirlik',
        axis: 'TREND',
        postCount: 5,
      },
    ],
    author: {
      id: 'author-1',
      slug: 'emre-can-yalcin',
      displayName: 'Emre Can Yalçın',
      bioTr: 'eCyPro Kurucu Ortağı',
      avatarUrl: '/images/founder-avatar.jpg',
      isFounder: true,
      postCount: 12,
    },
    coverImageUrl: '/images/placeholder-cover.jpg',
    coverImageAlt: 'ESG Raporlama',
    readingTimeMin: 12,
    viewCount: 890,
    publishedAt: '2026-04-15T09:00:00Z',
    isFeatured: false,
    isEditorsPick: true,
    series: {
      id: 'series-1',
      slug: 'esg-seri',
      titleTr: 'ESG Masterclass Serisi',
      descriptionTr: 'Türk şirketleri için kapsamlı ESG rehberi.',
      coverImageUrl: '/images/placeholder-cover.jpg',
      totalParts: 5,
      status: 'ACTIVE',
      publishedParts: 2,
    },
    seriesOrder: 2,
  },
  {
    id: 'stub-3',
    slug: 'fintech-lisanslama-rehberi',
    type: 'ANALYSIS',
    status: 'PUBLISHED',
    language: 'TR_ONLY',
    titleTr: 'Fintech Lisanslama Rehberi: BDDK ve TCMB Süreçleri',
    excerptTr: "Türkiye'de fintech şirketleri için lisanslama süreçlerinin detaylı analizi.",
    primaryDomain: 'FINTECH',
    subDomain: 'regülasyon',
    tags: [],
    author: {
      id: 'author-1',
      slug: 'emre-can-yalcin',
      displayName: 'Emre Can Yalçın',
      bioTr: 'eCyPro Kurucu Ortağı',
      avatarUrl: '/images/founder-avatar.jpg',
      isFounder: true,
    },
    coverImageUrl: '/images/placeholder-cover.jpg',
    coverImageAlt: 'Fintech Lisanslama',
    readingTimeMin: 15,
    viewCount: 2100,
    publishedAt: '2026-03-20T09:00:00Z',
    isFeatured: false,
    isEditorsPick: false,
  },
];

export function useInsightsFeed(params: InsightFilterParams = {}) {
  const [data, setData] = useState<InsightFeedResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);
    // Stub: filter by domain/tag/author etc.
    let filtered = [...STUB_POSTS];
    if (params.domain) filtered = filtered.filter((p) => p.primaryDomain === params.domain);
    if (params.tagSlug)
      filtered = filtered.filter((p) => p.tags.some((t) => t.slug === params.tagSlug));
    if (params.authorSlug) filtered = filtered.filter((p) => p.author.slug === params.authorSlug);
    if (params.q)
      filtered = filtered.filter((p) => p.titleTr.toLowerCase().includes(params.q!.toLowerCase()));
    if (params.year) {
      filtered = filtered.filter((p) => new Date(p.publishedAt).getFullYear() === params.year);
    }
    if (params.month) {
      filtered = filtered.filter((p) => new Date(p.publishedAt).getMonth() + 1 === params.month);
    }

    setTimeout(() => {
      setData({ posts: filtered, total: filtered.length, page: 1, pageSize: 20 });
      setIsLoading(false);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  return { data, isLoading, error };
}
