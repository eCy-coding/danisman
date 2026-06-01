import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';

// Sprint 6 A1d-b — `public-services` is Redis-backed (no Prisma). Without a
// redis mock the route handler tries to connect to a non-existent Redis in
// CI and throws → 500. Wire the same `vi.mock('../config/redis', ...)`
// pattern used by `auth.test.ts:9-15`. `null` from `get()` keeps the
// `override` value null, which matches the route's "no override" branch.
vi.mock('../config/redis', () => ({
  redis: {
    status: 'end',
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  },
}));

import publicServicesRoutes from './public-services';

describe('P66 public-services', () => {
  const app = express();
  app.use('/api/public/services', publicServicesRoutes);

  it('returns override structure for valid slug', async () => {
    const res = await request(app).get('/api/public/services/strategic-transformation');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body.data).toHaveProperty('slug', 'strategic-transformation');
    expect(res.body.data).toHaveProperty('override');
  });

  it('rejects invalid slug (uppercase)', async () => {
    const res = await request(app).get('/api/public/services/Invalid-Slug');
    expect(res.status).toBe(400);
  });

  it('rejects path traversal', async () => {
    const res = await request(app).get('/api/public/services/..%2Fetc');
    expect([400, 404]).toContain(res.status);
  });
});
