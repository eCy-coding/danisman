import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.MOCK_PORT || 3001;

// Simple health
app.get('/__health', (req, res) => res.json({ok: true}));
app.get('/api/health', (req, res) => res.json({
  status: 'ok',
  service: 'ecypro-api',
  uptime: process.uptime(),
  memory: process.memoryUsage(),
  timestamp: new Date().toISOString(),
}));

// Auth endpoints
app.get('/api/auth/status', (req, res) => {
  res.json({ loggedIn: false });
});

app.post('/api/login', (req, res) => {
  // accept any credentials in mock
  res.json({ token: 'mock-token', user: { id: 'user-1', name: 'Mock User' } });
});

// Content endpoints
app.get('/api/content/list', (req, res) => {
  res.json([
    { id: 'c1', title: 'Mock Item 1', body: 'This is mock content.' },
    { id: 'c2', title: 'Mock Item 2', body: 'More mock content.' }
  ]);
});

app.post('/api/search', (req, res) => {
  const q = (req.body?.q || req.query?.q || '').toString();
  res.json({ results: [{ id: 'c1', title: `Result for ${q}`, snippet: 'mock snippet' }] });
});

// Newsletter subscribe mock
app.post('/api/newsletter/subscribe', (req, res) => {
  const { email, consent } = req.body || {};
  if (!email || !consent) {
    return res.status(400).json({ status: 'error', code: 'VALIDATION_ERROR', message: 'email + consent required' });
  }
  res.status(201).json({ status: 'ok', code: 'SUBSCRIBED', message: 'Subscription confirmed' });
});

// Minimal AI mock
app.post('/api/ai/generate', (req, res) => {
  const prompt = req.body?.prompt || 'none';
  res.json({
    id: 'mock-gen-1',
    prompt,
    text: `Mocked AI response for: ${prompt}`
  });
});

// Service endpoints (for real-time tests)
app.get('/api/services/:slug', (req, res) => {
  const { slug } = req.params;
  res.json({
    id: slug,
    name: `Service: ${slug}`,
    title: 'Strategic Management Consulting',
    description: 'Mock service description'
  });
});

// Mock SSE endpoint for live viewers
app.get('/api/services/:slug/live-viewers', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial count
  res.write(`data: {"viewers":5}\n\n`);

  // Send updates every 2.5 seconds
  const intervalId = setInterval(() => {
    const viewers = Math.floor(Math.random() * 10) + 1;
    res.write(`data: {"viewers":${viewers}}\n\n`);
  }, 2500);

  req.on('close', () => {
    clearInterval(intervalId);
    res.end();
  });
});

// Auth endpoints — spec-compatible responses
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ status: 'error', code: 'VALIDATION_ERROR', message: 'email and password required' });
  }
  res.json({ token: 'mock-token', user: { id: 'user-1', email, name: 'Mock User' } });
});

app.post('/api/auth/register', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !email.includes('@')) {
    return res.status(400).json({ status: 'error', code: 'VALIDATION_ERROR', message: 'valid email required' });
  }
  if (!password || password.length < 6) {
    return res.status(422).json({ status: 'error', code: 'WEAK_PASSWORD', message: 'password too short' });
  }
  res.status(201).json({ token: 'mock-token', user: { id: 'user-new', email } });
});

app.get('/api/bookings', (req, res) => {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', code: 'UNAUTHORIZED', message: 'auth required' });
  }
  res.json({ data: [], total: 0 });
});

app.post('/api/analytics/pageview', (req, res) => {
  res.status(200).json({ status: 'ok', tracked: true });
});

app.post('/api/analytics/event', (req, res) => {
  res.status(200).json({ status: 'ok', tracked: true });
});

app.post('/api/bookings', (req, res) => {
  const { name, email, service, date } = req.body || {};
  if (!name || !email) {
    return res.status(400).json({ status: 'error', code: 'VALIDATION_ERROR', message: 'name and email required' });
  }
  res.status(201).json({ status: 'ok', id: 'booking-mock-001', name, email, service, date });
});

app.listen(PORT, () => {
  console.log(`Mock server listening on http://localhost:${PORT}`);
});

