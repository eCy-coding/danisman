import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
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
