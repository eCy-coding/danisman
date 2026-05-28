import { z } from 'zod';
import { ArticleType, Domain, Language, PostStatus, SeriesStatus, TagAxis } from '@prisma/client';

// ─── Post Status Transition Machine ──────────────────────────────────────────
// DRAFT → IN_REVIEW → COPY_EDIT → SEO_REVIEW → LEGAL_REVIEW → SCHEDULED → PUBLISHED → ARCHIVED
// Reverse transitions forbidden (only forward + ARCHIVED from any)

const VALID_TRANSITIONS: Partial<Record<PostStatus, PostStatus[]>> = {
  DRAFT: ['IN_REVIEW', 'ARCHIVED'],
  IN_REVIEW: ['COPY_EDIT', 'DRAFT', 'ARCHIVED'],
  COPY_EDIT: ['SEO_REVIEW', 'IN_REVIEW', 'ARCHIVED'],
  SEO_REVIEW: ['LEGAL_REVIEW', 'COPY_EDIT', 'SCHEDULED', 'ARCHIVED'],
  LEGAL_REVIEW: ['SCHEDULED', 'SEO_REVIEW', 'ARCHIVED'],
  SCHEDULED: ['PUBLISHED', 'DRAFT', 'ARCHIVED'],
  PUBLISHED: ['ARCHIVED'],
  ARCHIVED: ['DRAFT'],
};

export function isValidTransition(from: PostStatus, to: PostStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

// ─── BlogPost Schemas ─────────────────────────────────────────────────────────

export const CreatePostSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9-]+$/, 'Slug: sadece küçük harf, rakam, tire'),
  slugEn: z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  type: z.nativeEnum(ArticleType),
  language: z.nativeEnum(Language).default('TR_ONLY'),
  titleTr: z.string().min(5).max(200),
  titleEn: z.string().min(5).max(200).optional(),
  excerptTr: z.string().min(20).max(500),
  excerptEn: z.string().min(20).max(500).optional(),
  bodyTrMdx: z.string().min(100),
  bodyEnMdx: z.string().min(100).optional(),
  primaryDomain: z.nativeEnum(Domain),
  subDomain: z.string().min(2).max(100),
  topic: z.string().max(100).optional(),
  seriesId: z.string().cuid().optional(),
  seriesOrder: z.number().int().positive().optional(),
  authorId: z.string().cuid(),
  guestAuthorIds: z.array(z.string().cuid()).optional(),
  coverImageUrl: z.string().url(),
  coverImageAlt: z.string().min(5).max(200),
  ogImageUrl: z.string().url().optional(),
  videoEmbedUrl: z.string().url().optional(),
  metaTitleTr: z.string().max(60).optional(),
  metaTitleEn: z.string().max(60).optional(),
  metaDescTr: z.string().max(160).optional(),
  metaDescEn: z.string().max(160).optional(),
  canonicalUrl: z.string().url().optional(),
  noindex: z.boolean().default(false),
  readingTimeMin: z.number().int().min(1).max(120).default(5),
  scheduledAt: z.string().datetime().optional(),
  tagIds: z.array(z.string().cuid()).optional(),
  isFeatured: z.boolean().default(false),
  isEditorsPick: z.boolean().default(false),
  featureOrder: z.number().int().positive().optional(),
  feedPinned: z.boolean().default(false),
});

export const UpdatePostSchema = CreatePostSchema.partial().omit({ slug: true });

export const TransitionPostSchema = z.object({
  toStatus: z.nativeEnum(PostStatus),
  comment: z.string().max(500).optional(),
});

export const PostListQuerySchema = z.object({
  domain: z.nativeEnum(Domain).optional(),
  status: z.nativeEnum(PostStatus).optional(),
  authorId: z.string().cuid().optional(),
  seriesId: z.string().cuid().optional(),
  q: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['publishedAt', 'viewCount', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ─── Tag Schemas ──────────────────────────────────────────────────────────────

export const CreateTagSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-:]+$/, 'Tag slug: küçük harf, rakam, tire, iki nokta'),
  labelTr: z.string().min(2).max(100),
  labelEn: z.string().min(2).max(100).optional(),
  axis: z.nativeEnum(TagAxis),
});

export const UpdateTagSchema = CreateTagSchema.partial();

// ─── Series Schemas ───────────────────────────────────────────────────────────

export const CreateSeriesSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(200)
    .regex(/^[a-z0-9-]+$/),
  titleTr: z.string().min(5).max(200),
  titleEn: z.string().min(5).max(200).optional(),
  descriptionTr: z.string().min(20).max(2000),
  descriptionEn: z.string().min(20).max(2000).optional(),
  coverImageUrl: z.string().url(),
  totalParts: z.number().int().min(2).max(200),
  status: z.nativeEnum(SeriesStatus).default('ACTIVE'),
});

export const UpdateSeriesSchema = CreateSeriesSchema.partial();

// ─── Author Schemas ───────────────────────────────────────────────────────────

export const CreateAuthorSchema = z.object({
  slug: z
    .string()
    .min(3)
    .max(100)
    .regex(/^[a-z0-9-]+$/),
  displayName: z.string().min(2).max(100),
  bioTr: z.string().min(20).max(2000),
  bioEn: z.string().min(20).max(2000).optional(),
  avatarUrl: z.string().url(),
  linkedinUrl: z.string().url().optional(),
  twitterUrl: z.string().url().optional(),
  isFounder: z.boolean().default(false),
});

export const UpdateAuthorSchema = CreateAuthorSchema.partial();

// ─── Editor Comment Schema ────────────────────────────────────────────────────

export const CreateEditorCommentSchema = z.object({
  contentMd: z.string().min(5).max(2000),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;
export type TransitionPostInput = z.infer<typeof TransitionPostSchema>;
export type PostListQuery = z.infer<typeof PostListQuerySchema>;
export type CreateTagInput = z.infer<typeof CreateTagSchema>;
export type CreateSeriesInput = z.infer<typeof CreateSeriesSchema>;
export type CreateAuthorInput = z.infer<typeof CreateAuthorSchema>;
