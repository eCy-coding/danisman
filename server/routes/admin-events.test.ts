import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import adminEventsRoutes from './admin-events';

describe('P66 admin-events SSE', () => {
  const app = express();
  app.use('/api/admin/events', adminEventsRoutes);

  it('rejects without auth', async () => {
    const res = await request(app).get('/api/admin/events');
    expect([401, 403]).toContain(res.status);
  });

  it('accepts ?token= query param fallback path', async () => {
    const res = await request(app).get('/api/admin/events?token=invalid-jwt');
    // Token bridge çalıştı ama JWT invalid → 401 yine
    expect([401, 403]).toContain(res.status);
  });
});
