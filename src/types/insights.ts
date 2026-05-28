/**
 * Perspektif (Blog) stub types — Wave-1 schema interface.
 * These mirror the Prisma schema from PB-1.
 * Replace with generated Prisma types when feat/perspektif-pb-1-2-3 merges.
 */

export type Domain = 'M_A' | 'ESG' | 'FINTECH' | 'AILE_SIRKETI';

export type PostStatus =
  | 'DRAFT'
  | 'IN_REVIEW'
  | 'COPY_EDIT'
  | 'SEO_REVIEW'
  | 'LEGAL_REVIEW'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'ARCHIVED';

export type Language = 'TR_ONLY' | 'EN_ONLY' | 'BOTH';

export type ArticleType =
  | 'ANALYSIS'
  | 'OPINION'
  | 'CASE_STUDY'
  | 'FRAMEWORK'
  | 'CHECKLIST'
  | 'INTERVIEW'
  | 'DATA_DEEP_DIVE'
  | 'TUTORIAL'
  | 'NEWSLETTER_RECAP'
  | 'REGULATORY_ALERT'
  | 'BOOK_SUMMARY'
  | 'EVENT_RECAP';

export type TagAxis = 'FORMAT' | 'AUDIENCE' | 'GEO' | 'SECTOR' | 'REG' | 'TREND';

export type SeriesStatus = 'ACTIVE' | 'COMPLETED' | 'ON_HIATUS';

export interface InsightTag {
  id: string;
  slug: string;
  labelTr: string;
  labelEn?: string;
  axis: TagAxis;
}

export interface InsightAuthor {
  id: string;
  slug: string;
  displayName: string;
  bioTr: string;
  bioEn?: string;
  avatarUrl: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  isFounder: boolean;
}

export interface InsightSeries {
  id: string;
  slug: string;
  titleTr: string;
  titleEn?: string;
  descriptionTr: string;
  descriptionEn?: string;
  coverImageUrl: string;
  totalParts: number;
  status: SeriesStatus;
}

export interface InsightPost {
  id: string;
  slug: string;
  slugEn?: string;
  type: ArticleType;
  status: PostStatus;
  language: Language;

  titleTr: string;
  titleEn?: string;
  excerptTr: string;
  excerptEn?: string;
  bodyTrMdx?: string;
  bodyEnMdx?: string;

  primaryDomain: Domain;
  subDomain: string;
  topic?: string;
  seriesId?: string;
  seriesOrder?: number;

  tags: InsightTag[];
  author: InsightAuthor;

  coverImageUrl: string;
  coverImageAlt: string;
  ogImageUrl?: string;

  metaTitleTr?: string;
  metaTitleEn?: string;
  metaDescTr?: string;
  metaDescEn?: string;
  canonicalUrl?: string;
  noindex: boolean;

  readingTimeMin: number;
  viewCount: number;
  uniqueViewCount: number;
  shareCount: number;
  bookmarkCount: number;
  commentCount: number;

  publishedAt?: string;
  scheduledAt?: string;
  updatedAt: string;
  createdAt: string;

  isFeatured: boolean;
  isEditorsPick: boolean;
  featureOrder?: number;
  feedPinned: boolean;

  series?: InsightSeries;
  manualRelated?: InsightPostCard[];
}

export type InsightPostCard = Pick<
  InsightPost,
  | 'id'
  | 'slug'
  | 'titleTr'
  | 'titleEn'
  | 'excerptTr'
  | 'excerptEn'
  | 'coverImageUrl'
  | 'coverImageAlt'
  | 'primaryDomain'
  | 'subDomain'
  | 'type'
  | 'readingTimeMin'
  | 'viewCount'
  | 'publishedAt'
  | 'isFeatured'
  | 'isEditorsPick'
  | 'author'
  | 'tags'
>;

export interface InsightsFeedResponse {
  posts: InsightPostCard[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface InsightsFilter {
  domain?: Domain;
  subDomain?: string;
  tags?: string[];
  from?: string;
  to?: string;
  readTimeMin?: number;
  readTimeMax?: number;
  sort?: 'newest' | 'popular' | 'editors_pick' | 'trending';
  search?: string;
  cursor?: string;
}

export interface DomainSpotlight {
  domain: Domain;
  latest: InsightPostCard;
  popular: InsightPostCard;
  editorsPick: InsightPostCard;
}

export const DOMAIN_LABELS: Record<Domain, { tr: string; en: string }> = {
  M_A: { tr: 'M&A', en: 'M&A' },
  ESG: { tr: 'ESG', en: 'ESG' },
  FINTECH: { tr: 'Fintech', en: 'Fintech' },
  AILE_SIRKETI: { tr: 'Aile Şirketi', en: 'Family Business' },
};

export const DOMAIN_COLORS: Record<
  Domain,
  { primary: string; accent: string; bg: string; text: string }
> = {
  M_A: { primary: '#1e40af', accent: '#3b82f6', bg: '#dbeafe', text: 'text-blue-700' },
  ESG: { primary: '#047857', accent: '#10b981', bg: '#d1fae5', text: 'text-emerald-700' },
  FINTECH: { primary: '#7c3aed', accent: '#a78bfa', bg: '#ede9fe', text: 'text-violet-700' },
  AILE_SIRKETI: { primary: '#b45309', accent: '#f59e0b', bg: '#fef3c7', text: 'text-amber-700' },
};

export const ARTICLE_TYPE_LABELS: Record<ArticleType, { tr: string }> = {
  ANALYSIS: { tr: 'Analiz' },
  OPINION: { tr: 'Görüş' },
  CASE_STUDY: { tr: 'Vaka Çalışması' },
  FRAMEWORK: { tr: 'Metodoloji' },
  CHECKLIST: { tr: 'Kontrol Listesi' },
  INTERVIEW: { tr: 'Röportaj' },
  DATA_DEEP_DIVE: { tr: 'Veri Analizi' },
  TUTORIAL: { tr: 'Rehber' },
  NEWSLETTER_RECAP: { tr: 'Özet' },
  REGULATORY_ALERT: { tr: 'Mevzuat' },
  BOOK_SUMMARY: { tr: 'Kitap Özeti' },
  EVENT_RECAP: { tr: 'Etkinlik' },
};
