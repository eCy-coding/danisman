import { Router } from 'express';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { searchInsights } from '../services/insightsSearch';
import { logger } from '../config/logger';

export const publicInsightsSearchRouter = Router();

const SearchQuerySchema = z.object({
  q: z.string().min(2).max(200),
  domain: z
    .string()
    .optional()
    .transform((v) => v?.split(',').filter(Boolean)),
  tag: z
    .string()
    .optional()
    .transform((v) => v?.split(',').filter(Boolean)),
  from: z.string().optional(),
  to: z.string().optional(),
  lang: z.enum(['simple', 'english']).optional().default('simple'),
  page: z.coerce.number().int().min(1).max(500).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// GET /api/v1/insights/search?q=...&domain=M_A,ESG&tag=reg-kvkk&page=1
publicInsightsSearchRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const parsed = SearchQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid search query', details: parsed.error.flatten() });
    return;
  }

  const { q, domain, tag, from, to, lang, page, limit } = parsed.data;

  const results = await searchInsights(q, { domain, tag, from, to, lang }, page, limit);

  logger.info('Insights search executed', {
    q,
    domain,
    tag,
    total: results.total,
    cached: results.cached,
  });

  res.json({
    data: results.results,
    meta: {
      query: q,
      total: results.total,
      page,
      limit,
      pages: Math.ceil(results.total / limit),
      cached: results.cached,
    },
  });
});
