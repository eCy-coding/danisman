import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.MOCK_PORT || 3001;

// ── Health ────────────────────────────────────────────────
app.get('/__health', (_req, res) => res.json({ ok: true }));
app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  service: 'ecypro-api',
  uptime: process.uptime(),
  memory: process.memoryUsage(),
  timestamp: new Date().toISOString(),
}));

// ── Auth ──────────────────────────────────────────────────
app.get('/api/auth/status', (_req, res) => {
  res.json({ loggedIn: false });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ status: 'error', code: 'VALIDATION_ERROR', message: 'email and password required' });
  }
  // Mock: any valid-looking credentials → success
  res.json({
    status: 'ok',
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: { id: 'user-1', email, name: 'Mock User', role: 'USER' },
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !email.includes('@')) {
    return res.status(400).json({ status: 'error', code: 'VALIDATION_ERROR', message: 'valid email required' });
  }
  if (!password || password.length < 6) {
    return res.status(422).json({ status: 'error', code: 'WEAK_PASSWORD', message: 'password too short' });
  }
  res.status(201).json({
    status: 'ok',
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    user: { id: 'user-new', email, role: 'USER' },
  });
});

app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) {
    return res.status(400).json({ status: 'error', code: 'MISSING_TOKEN', message: 'refreshToken required' });
  }
  if (refreshToken === 'expired-token') {
    return res.status(401).json({ status: 'error', code: 'EXPIRED', message: 'Refresh token expired' });
  }
  res.json({ status: 'ok', accessToken: 'mock-access-token-new' });
});

app.get('/api/auth/me', (req, res) => {
  const auth = req.headers['authorization'];
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Authentication required' });
  }
  res.json({ status: 'ok', user: { id: 'user-1', email: 'mock@ecypro.com', role: 'USER' } });
});

// ── Newsletter ────────────────────────────────────────────
app.post('/api/newsletter/subscribe', (req, res) => {
  const { email, consent } = req.body || {};
  if (!email || !consent) {
    return res.status(400).json({ status: 'error', code: 'VALIDATION_ERROR', message: 'email + consent required' });
  }
  res.status(201).json({ status: 'ok', code: 'SUBSCRIBED', message: 'Subscription confirmed' });
});

app.get('/api/newsletter/stats', (_req, res) => {
  res.json({ status: 'ok', count: 1247 });
});

// ── Bookings ──────────────────────────────────────────────
app.get('/api/bookings', (req, res) => {
  const auth = req.headers['authorization'];
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'auth required' });
  }
  res.json({ status: 'ok', data: [], total: 0 });
});

app.post('/api/bookings', (req, res) => {
  const { name, email, service, date } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ status: 'error', code: 'VALIDATION_ERROR', message: 'name and email required' });
  }
  res.status(201).json({ status: 'ok', id: 'booking-mock-001', name, email, service, date });
});

app.get('/api/bookings/:id', (req, res) => {
  res.json({ status: 'ok', id: req.params.id, status: 'CONFIRMED', scheduledAt: new Date().toISOString() });
});

// ── Booking Manage (token-based, no auth) ────────────────
app.get('/api/manage/:token', (req, res) => {
  const { token } = req.params;
  if (!token || token === 'invalid') {
    return res.status(401).json({ status: 'error', code: 'INVALID_TOKEN', message: 'Invalid or expired token' });
  }
  res.json({ status: 'ok', booking: { id: 'booking-mock-001', status: 'CONFIRMED' } });
});

// ── Webhooks ──────────────────────────────────────────────
const MOCK_CAL_SECRET = process.env.MOCK_CAL_SECRET;

app.post('/api/webhooks/cal', (req, res) => {
  if (MOCK_CAL_SECRET) {
    const signature = req.headers['x-cal-signature-256'];
    if (!signature) {
      return res.status(401).json({ status: 'error', code: 'MISSING_SIGNATURE', message: 'X-Cal-Signature-256 required' });
    }
    const rawBody = JSON.stringify(req.body);
    const expected = crypto.createHmac('sha256', MOCK_CAL_SECRET).update(rawBody).digest('hex');
    const sigHex = String(signature).replace(/^sha256=/, '');
    let valid = false;
    try {
      const eBuf = Buffer.from(expected, 'hex');
      const sBuf = Buffer.from(sigHex, 'hex');
      valid = eBuf.length === sBuf.length && crypto.timingSafeEqual(eBuf, sBuf);
    } catch { valid = false; }
    if (!valid) {
      return res.status(401).json({ status: 'error', code: 'INVALID_SIGNATURE', message: 'Invalid signature' });
    }
  }
  res.json({ status: 'ok', received: true });
});

// ── Admin ─────────────────────────────────────────────────
app.get('/api/admin/stats', (req, res) => {
  const auth = req.headers['authorization'];
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Authentication required' });
  }
  res.json({
    status: 'ok',
    stats: {
      totalUsers: 42,
      totalBookings: 18,
      newsletterSubscribers: 1247,
      activeLeads: 7,
    },
  });
});

// ── CRM ───────────────────────────────────────────────────
app.get('/api/crm/leads', (req, res) => {
  res.json({ status: 'ok', data: [], total: 0 });
});

app.post('/api/crm/leads', (req, res) => {
  res.status(201).json({ status: 'ok', id: `lead-${crypto.randomUUID().slice(0, 8)}` });
});

// ── Analytics ─────────────────────────────────────────────
app.post('/api/analytics/pageview', (_req, res) => {
  res.json({ status: 'ok', tracked: true });
});

app.post('/api/analytics/event', (_req, res) => {
  res.json({ status: 'ok', tracked: true });
});

// ── Content / Services ────────────────────────────────────
app.get('/api/content/list', (_req, res) => {
  res.json([
    { id: 'c1', title: 'Mock Item 1', body: 'Mock content.' },
    { id: 'c2', title: 'Mock Item 2', body: 'More mock content.' },
  ]);
});

app.post('/api/search', (req, res) => {
  const q = (req.body?.q ?? req.query?.q ?? '').toString();
  res.json({ results: [{ id: 'c1', title: `Result for ${q}`, snippet: 'mock snippet' }] });
});

app.get('/api/services/:slug', (req, res) => {
  const { slug } = req.params;
  res.json({ id: slug, name: `Service: ${slug}`, title: 'Strategic Management Consulting', description: 'Mock service description' });
});

// ── SSE live viewers ──────────────────────────────────────
app.get('/api/services/:slug/live-viewers', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.write(`data: {"viewers":5}\n\n`);
  const id = setInterval(() => {
    res.write(`data: {"viewers":${Math.floor(Math.random() * 10) + 1}}\n\n`);
  }, 2500);
  req.on('close', () => { clearInterval(id); res.end(); });
});

// ── AI ────────────────────────────────────────────────────
app.post('/api/ai/generate', (req, res) => {
  const prompt = req.body?.prompt ?? 'none';
  res.json({ id: 'mock-gen-1', prompt, text: `Mocked AI response for: ${prompt}` });
});

// ── 404 catch-all ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: `Mock endpoint not found: ${req.method} ${req.path}` });
});

app.listen(PORT, () => {
  console.log(`[mock-server] listening on http://localhost:${PORT}`);
});
