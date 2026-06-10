/**
 * P34-T10 — lead scoring route tests
 *
 * Verifies:
 *   - POST /api/leads/score valid payload → 200 success + score result
 *   - POST /api/leads/score missing email → 400 INVALID_EMAIL
 *   - POST /api/leads/score non-array interactions → 400 INVALID_INTERACTIONS
 *   - POST /api/leads/score without auth → 401
 *   - GET /api/leads/:id/score valid → 200 + prisma.contactSubmission.findUnique called
 *   - GET /api/leads/:id/score unknown contact → 404 CONTACT_NOT_FOUND
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// ── Module mocks (hoisted before all imports) ────────────────────────────────

vi.mock('../config/redis', () => ({
  redis: {
    status: 'end',
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
  },
}));

vi.mock('../config/db', () => {
  const prismaMock: Record<string, unknown> = {
    contactSubmission: {
      findUnique: vi.fn(),
    },
    analytics: {
      groupBy: vi.fn().mockResolvedValue([]),
    },
  };
  return { prisma: prismaMock };
});

vi.mock('../lib/jwt-blacklist', () => ({
  isBlacklisted: vi.fn().mockResolvedValue(false),
  blacklistToken: vi.fn().mockResolvedValue(undefined),
}));

// ── Imports (after mocks) ────────────────────────────────────────────────────

import { errorHandler } from '../middleware/error';
import leadsRoutes from './leads';
import { prisma } from '../config/db';

// ── Test utilities ────────────────────────────────────────────────────────────

const JWT_SECRET = 'test-jwt-secret-not-for-production-32chars!!';

function makeToken(userId: string, role = 'USER') {
  return jwt.sign({ id: userId, role, jti: crypto.randomUUID() }, JWT_SECRET, {
    expiresIn: '15m',
  } as jwt.SignOptions);
}

function makeApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/leads', leadsRoutes);
  app.use(errorHandler);
  return app;
}

const ADMIN_TOKEN = makeToken('admin-uuid-test', 'ADMIN');

// ── POST /api/leads/score ───────────────────────────────────────────────────

describe('POST /api/leads/score', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('returns 200 with a computed score for a valid payload', async () => {
    const res = await request(app)
      .post('/api/leads/score')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({
        email: 'lead@acme-corp.com',
        interactions: [
          { type: 'FORM_SUBMIT', count: 1 },
          { type: 'PRICING_VIEW', count: 3 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.totalScore).toBeGreaterThan(0);
    expect(['A', 'B', 'C']).toContain(res.body.data.tier);
  });

  it('returns 400 INVALID_EMAIL when email is missing', async () => {
    const res = await request(app)
      .post('/api/leads/score')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ interactions: [] });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_EMAIL');
  });

  it('returns 400 INVALID_INTERACTIONS when interactions is not an array', async () => {
    const res = await request(app)
      .post('/api/leads/score')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`)
      .send({ email: 'lead@acme-corp.com', interactions: 'not-an-array' });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_INTERACTIONS');
  });

  it('returns 401 when no Authorization header is present', async () => {
    const res = await request(app)
      .post('/api/leads/score')
      .send({ email: 'lead@acme-corp.com', interactions: [] });

    expect(res.status).toBe(401);
  });
});

// ── GET /api/leads/:contactId/score ───────────────────────────────────────────

describe('GET /api/leads/:contactId/score', () => {
  let app: express.Express;

  beforeEach(() => {
    vi.clearAllMocks();
    app = makeApp();
  });

  it('returns 200 with classification for an existing contact', async () => {
    vi.mocked(prisma.contactSubmission.findUnique).mockResolvedValue({
      id: 'contact-1',
      email: 'lead@acme-corp.com',
      createdAt: new Date(),
    } as never);

    const res = await request(app)
      .get('/api/leads/contact-1/score')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.data.contactId).toBe('contact-1');
    expect(res.body.data.classification.tier).toBeDefined();
    expect(prisma.contactSubmission.findUnique).toHaveBeenCalledTimes(1);
  });

  it('returns 404 CONTACT_NOT_FOUND for an unknown contact', async () => {
    vi.mocked(prisma.contactSubmission.findUnique).mockResolvedValue(null as never);

    const res = await request(app)
      .get('/api/leads/missing/score')
      .set('Authorization', `Bearer ${ADMIN_TOKEN}`);

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('CONTACT_NOT_FOUND');
  });
});
