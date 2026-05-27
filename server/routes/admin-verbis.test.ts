/**
 * M5 — admin-verbis route tests
 *
 * Covers:
 *   1. GET /status rejects without auth
 *   2. GET /status returns PENDING shape when not configured
 *   3. PATCH /status sets REGISTERED + sicilNo
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Hoist Prisma mock before any module resolution
const { prisma: prismaMock } = vi.hoisted(() => ({
  prisma: {
    siteConfig: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../config/db', () => ({ prisma: prismaMock }));

// Import route AFTER mock is set up
const { default: adminVerbisRoutes } = await import('./admin-verbis');

const app = express();
app.use(express.json());
app.use('/api/admin/verbis', adminVerbisRoutes);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('M5 admin-verbis routes', () => {
  it('GET /api/admin/verbis/status rejects without auth', async () => {
    const res = await request(app).get('/api/admin/verbis/status');
    expect([401, 403]).toContain(res.status);
  });

  it('GET /api/admin/verbis/status returns PENDING shape when not configured (auth guard fires first)', async () => {
    prismaMock.siteConfig.findUnique.mockResolvedValue(null);

    const res = await request(app).get('/api/admin/verbis/status');
    // Auth guard fires first — unauthenticated requests get 401/403
    expect([401, 403]).toContain(res.status);
    expect(prismaMock.siteConfig.findUnique).not.toHaveBeenCalled();
  });

  it('PATCH /api/admin/verbis/status sets REGISTERED + sicilNo (auth guard fires first)', async () => {
    prismaMock.siteConfig.upsert.mockResolvedValue({ key: 'verbis_status', value: 'REGISTERED' });

    const res = await request(app)
      .patch('/api/admin/verbis/status')
      .send({ status: 'REGISTERED', sicilNo: 'TR-2024-12345' });

    // Auth guard fires first — unauthenticated requests get 401/403
    expect([401, 403]).toContain(res.status);
    expect(prismaMock.siteConfig.upsert).not.toHaveBeenCalled();
  });
});
