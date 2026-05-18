import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import adminRevalidateRoutes from './admin-revalidate';

describe('P66 admin-revalidate', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/revalidate', adminRevalidateRoutes);

  it('rejects without auth', async () => {
    const res = await request(app)
      .post('/api/admin/revalidate')
      .send({ paths: ['/blog'] });
    expect([401, 403]).toContain(res.status);
  });

  it('validates paths array', async () => {
    const res = await request(app)
      .post('/api/admin/revalidate')
      .send({ paths: 'invalid-not-array' });
    expect([400, 401, 403]).toContain(res.status);
  });
});
