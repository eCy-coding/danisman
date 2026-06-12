import { z } from 'zod';
import { Domain, ResearchJobStatus } from '@prisma/client';

// ─── Research Bridge (P82) schemas ───────────────────────────────────────────
// Admin queues a job; the local NotebookLM bridge claims it and reports
// progress. On DONE the bridge ships a draft payload that the server
// materialises as a BlogPost(DRAFT) — see routes/admin-research.ts.

export const CreateResearchJobSchema = z.object({
  topic: z.string().min(5).max(500),
  lang: z.enum(['tr', 'en']).default('tr'),
  mode: z.enum(['fast', 'deep']).default('fast'),
  contentType: z.literal('blog').default('blog'),
  primaryDomain: z.nativeEnum(Domain).default('M_A'),
});

export const JobListQuerySchema = z.object({
  status: z.nativeEnum(ResearchJobStatus).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// Statuses the bridge is allowed to set. QUEUED/CANCELLED stay server-side
// (QUEUED is the initial state; CANCELLED is an admin action).
export const BridgeSettableStatus = z.enum([
  'CLAIMED',
  'RESEARCHING',
  'IMPORTING',
  'DRAFTING',
  'DONE',
  'FAILED',
]);

export const DraftPayloadSchema = z.object({
  titleTr: z.string().min(5).max(200),
  excerptTr: z.string().min(20).max(500),
  bodyTrMdx: z.string().min(100),
  metaDescTr: z.string().max(160).optional(),
  // Rich-draft additions (all optional: pre-v2 bridges keep working).
  metaTitleTr: z.string().max(60).optional(),
  // Cover may be a site-relative path (/insights-covers/…) or absolute URL.
  coverImageUrl: z
    .string()
    .max(500)
    .regex(/^(https?:\/\/|\/)/, 'coverImageUrl: absolute URL veya / ile başlayan yol')
    .optional(),
  coverImageAlt: z.string().max(300).optional(),
  sources: z
    .array(
      z.object({
        title: z.string().min(1).max(300),
        url: z.string().url().optional(),
      }),
    )
    .max(100)
    .default([]),
});

export const BridgePatchSchema = z.object({
  status: BridgeSettableStatus.optional(),
  stageDetail: z.string().max(2000).optional(),
  notebookId: z.string().max(100).optional(),
  sourceCount: z.number().int().min(0).optional(),
  reportTitle: z.string().max(300).optional(),
  error: z.string().max(4000).optional(),
  // Required when status === 'DONE'; refined in the route handler so the
  // 400 carries a precise message instead of a generic union failure.
  draft: DraftPayloadSchema.optional(),
});

export type CreateResearchJobInput = z.infer<typeof CreateResearchJobSchema>;
export type BridgePatchInput = z.infer<typeof BridgePatchSchema>;
export type DraftPayload = z.infer<typeof DraftPayloadSchema>;
