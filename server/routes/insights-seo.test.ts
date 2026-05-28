import { describe, test, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

// Stub auth middleware before importing the router
vi.mock('../middleware/auth', () => ({
  authenticate: vi.fn(
    (
      _req: unknown,
      res: { status: (n: number) => { json: (b: unknown) => void } },
      _next: () => void,
    ) => {
      res.status(401).json({ error: 'Unauthorized' });
    },
  ),
}));

import insightsSeoRoutes from './insights-seo';

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/insights-seo', insightsSeoRoutes);
  return app;
}

describe('insights-seo routes', () => {
  const app = makeApp();

  test('GET /api/v1/insights-seo/sitemap-status returns 200 with status ok', async () => {
    const res = await request(app).get('/api/v1/insights-seo/sitemap-status');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('sitemap-status response includes lastGenerated field', async () => {
    const res = await request(app).get('/api/v1/insights-seo/sitemap-status');
    expect(res.body.lastGenerated).toBeDefined();
    expect(typeof res.body.lastGenerated).toBe('string');
  });

  test('sitemap-status response includes chunks count', async () => {
    const res = await request(app).get('/api/v1/insights-seo/sitemap-status');
    expect(typeof res.body.chunks).toBe('number');
    expect(res.body.chunks).toBeGreaterThanOrEqual(1);
  });

  test('POST /api/v1/insights-seo/regenerate-sitemap requires auth (401 without token)', async () => {
    const res = await request(app).post('/api/v1/insights-seo/regenerate-sitemap');
    expect(res.status).toBe(401);
  });
});
