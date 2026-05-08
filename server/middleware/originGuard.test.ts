import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { originGuard } from './originGuard';

function makeApp(opts?: Parameters<typeof originGuard>[0]) {
  const app = express();
  app.use(express.json());
  app.use(originGuard(opts));
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.post('/api/contact', (_req, res) => res.json({ ok: true }));
  app.post('/api/webhooks/stripe', (_req, res) => res.json({ ok: true }));
  app.delete('/api/bookings/42', (_req, res) => res.json({ ok: true }));
  return app;
}

describe('originGuard', () => {
  describe('non-mutation methods', () => {
    it('allows GET without Origin header', async () => {
      const app = makeApp({ allowedOrigins: ['https://ecypro.com'] });
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
    });
  });

  describe('mutation methods', () => {
    it('rejects POST without Origin or Referer', async () => {
      const app = makeApp({ allowedOrigins: ['https://ecypro.com'] });
      const res = await request(app).post('/api/contact').send({ name: 'x' });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('ORIGIN_REQUIRED');
    });

    it('rejects POST from disallowed origin', async () => {
      const app = makeApp({ allowedOrigins: ['https://ecypro.com'] });
      const res = await request(app)
        .post('/api/contact')
        .set('Origin', 'https://evil.com')
        .send({ name: 'x' });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('ORIGIN_FORBIDDEN');
    });

    it('accepts POST from allowed Origin', async () => {
      const app = makeApp({ allowedOrigins: ['https://ecypro.com'] });
      const res = await request(app)
        .post('/api/contact')
        .set('Origin', 'https://ecypro.com')
        .send({ name: 'x' });
      expect(res.status).toBe(200);
    });

    it('accepts POST when only Referer is set (origin derived)', async () => {
      const app = makeApp({ allowedOrigins: ['https://ecypro.com'] });
      const res = await request(app)
        .post('/api/contact')
        .set('Referer', 'https://ecypro.com/contact')
        .send({ name: 'x' });
      expect(res.status).toBe(200);
    });

    it('rejects POST when Referer is malformed', async () => {
      const app = makeApp({ allowedOrigins: ['https://ecypro.com'] });
      const res = await request(app)
        .post('/api/contact')
        .set('Referer', 'not-a-url')
        .send({ name: 'x' });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('ORIGIN_REQUIRED');
    });

    it('blocks DELETE from disallowed origin', async () => {
      const app = makeApp({ allowedOrigins: ['https://ecypro.com'] });
      const res = await request(app).delete('/api/bookings/42').set('Origin', 'https://evil.com');
      expect(res.status).toBe(403);
    });
  });

  describe('ignore list', () => {
    it('bypasses guard for ignored prefix (webhook)', async () => {
      const app = makeApp({
        allowedOrigins: ['https://ecypro.com'],
        ignore: ['/api/webhooks'],
      });
      const res = await request(app).post('/api/webhooks/stripe').send({});
      expect(res.status).toBe(200);
    });

    it('still guards unrelated paths when ignore is configured', async () => {
      const app = makeApp({
        allowedOrigins: ['https://ecypro.com'],
        ignore: ['/api/webhooks'],
      });
      const res = await request(app).post('/api/contact').send({});
      expect(res.status).toBe(403);
    });
  });

  describe('CORS_ORIGIN env fallback', () => {
    it('reads CORS_ORIGIN env when no override is given', async () => {
      const prev = process.env.CORS_ORIGIN;
      process.env.CORS_ORIGIN = 'https://staged.ecypro.com,https://ecypro.com';
      try {
        const app = makeApp();
        const res = await request(app)
          .post('/api/contact')
          .set('Origin', 'https://staged.ecypro.com')
          .send({});
        expect(res.status).toBe(200);
      } finally {
        if (prev === undefined) delete process.env.CORS_ORIGIN;
        else process.env.CORS_ORIGIN = prev;
      }
    });
  });
});
