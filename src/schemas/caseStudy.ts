import { z } from 'zod';

/**
 * Case-study record schema (mirrors src/schemas/blog.ts).
 *
 * Fields match the `CaseStudy` interface consumed by CaseStudyCard /
 * CaseStudyDetailPage. `content` is a pre-rendered HTML string produced by
 * scripts/generate-case-studies.ts from the Markdown body of each
 * src/content/case-studies/<slug>/index.mdoc document.
 */
export const CaseStudySchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  client: z.string().min(1),
  industry: z.string().min(1),
  result: z.string(),
  image: z.string().min(1).optional(),
  content: z.string(),
  duration: z.string().optional(),
  goLive: z.string().optional(),
  challenge: z.string().optional(),
});

export type CaseStudyRecord = z.infer<typeof CaseStudySchema>;

export const CaseStudyListSchema = z.array(CaseStudySchema);
