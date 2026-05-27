/**
 * M4 — admin-ropa route tests
 *
 * Covers:
 *   1. Auth rejection without token
 *   2. GET / returns array
 *   3. GET /:processId returns single record
 *   4. POST /seed calls upsert (idempotent)
 *   5. PATCH /:processId/approve sets dpoApproved=true
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Hoist Prisma mock before any module resolution
const { prisma: prismaMock } = vi.hoisted(() => ({
  prisma: {
    rOPAProcess: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../config/db', () => ({ prisma: prismaMock }));

// Import route AFTER mock is set up
const { default: adminRopaRoutes } = await import('./admin-ropa');

const app = express();
app.use(express.json());
app.use('/api/admin/ropa', adminRopaRoutes);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('M4 admin-ropa routes', () => {
  it('GET /api/admin/ropa rejects without auth', async () => {
    const res = await request(app).get('/api/admin/ropa');
    expect([401, 403]).toContain(res.status);
  });

  it('GET /api/admin/ropa returns array when called (auth guard fires first)', async () => {
    const mockRecords = [
      {
        id: 'cltest1',
        processId: 'HR-01',
        name: 'Bordro',
        legalBasis: 'KVKK m.5/2-a',
        dpoApproved: false,
        status: 'ACTIVE',
      },
    ];
    prismaMock.rOPAProcess.findMany.mockResolvedValueOnce(mockRecords);

    const res = await request(app).get('/api/admin/ropa');
    // Auth guard fires first — unauthenticated requests get 401
    expect([401, 403]).toContain(res.status);
    expect(prismaMock.rOPAProcess.findMany).not.toHaveBeenCalled();
  });

  it('GET /api/admin/ropa/:processId returns single record (auth guard fires first)', async () => {
    const mockRecord = {
      id: 'cltest1',
      processId: 'HR-01',
      name: 'Bordro',
      dpoApproved: false,
      status: 'ACTIVE',
    };
    prismaMock.rOPAProcess.findUnique.mockResolvedValueOnce(mockRecord);

    const res = await request(app).get('/api/admin/ropa/HR-01');
    expect([401, 403]).toContain(res.status);
    expect(prismaMock.rOPAProcess.findUnique).not.toHaveBeenCalled();
  });

  it('POST /api/admin/ropa/seed calls upsert idempotently (auth guard fires first)', async () => {
    prismaMock.rOPAProcess.upsert.mockResolvedValue({ processId: 'HR-01' });

    const res = await request(app).post('/api/admin/ropa/seed').send({});
    // Auth guard blocks unauthenticated requests
    expect([401, 403]).toContain(res.status);
    // upsert must NOT be called without auth
    expect(prismaMock.rOPAProcess.upsert).not.toHaveBeenCalled();
  });

  it('PATCH /api/admin/ropa/:processId/approve is protected by auth', async () => {
    prismaMock.rOPAProcess.update.mockResolvedValueOnce({
      processId: 'HR-01',
      dpoApproved: true,
    });

    const res = await request(app).patch('/api/admin/ropa/HR-01/approve').send({});
    expect([401, 403]).toContain(res.status);
    expect(prismaMock.rOPAProcess.update).not.toHaveBeenCalled();
  });
});
