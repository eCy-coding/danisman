// Stub types matching Wave-1 Prisma schema (src/types/insights.ts)
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
  postCount?: number;
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
  postCount?: number;
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
  publishedParts?: number;
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
  primaryDomain: Domain;
  subDomain: string;
  topic?: string;
  tags: InsightTag[];
  author: InsightAuthor;
  coverImageUrl: string;
  coverImageAlt: string;
  readingTimeMin: number;
  viewCount: number;
  publishedAt: string; // ISO date string
  isFeatured: boolean;
  isEditorsPick: boolean;
  series?: InsightSeries;
  seriesOrder?: number;
}

export interface InsightFeedResponse {
  posts: InsightPost[];
  total: number;
  page: number;
  pageSize: number;
}

export interface InsightFilterParams {
  domain?: Domain;
  subDomain?: string;
  tagSlug?: string;
  authorSlug?: string;
  seriesSlug?: string;
  year?: number;
  month?: number;
  q?: string;
  page?: number;
  pageSize?: number;
}

// Domain display metadata
export const DOMAIN_META: Record<
  Domain,
  {
    labelTr: string;
    labelEn: string;
    slug: string;
    color: string;
    accentColor: string;
    bgColor: string;
  }
> = {
  M_A: {
    labelTr: 'M&A / Birleşme & Satın Alma',
    labelEn: 'M&A / Mergers & Acquisitions',
    slug: 'm-a',
    color: '#1e40af',
    accentColor: '#3b82f6',
    bgColor: '#dbeafe',
  },
  ESG: {
    labelTr: 'ESG / Sürdürülebilirlik',
    labelEn: 'ESG / Sustainability',
    slug: 'esg',
    color: '#047857',
    accentColor: '#10b981',
    bgColor: '#d1fae5',
  },
  FINTECH: {
    labelTr: 'Fintech / Finansal Teknoloji',
    labelEn: 'Fintech / Financial Technology',
    slug: 'fintech',
    color: '#7c3aed',
    accentColor: '#a78bfa',
    bgColor: '#ede9fe',
  },
  AILE_SIRKETI: {
    labelTr: 'Aile Şirketi / Family Business',
    labelEn: 'Family Business',
    slug: 'aile-sirketi',
    color: '#b45309',
    accentColor: '#f59e0b',
    bgColor: '#fef3c7',
  },
};
