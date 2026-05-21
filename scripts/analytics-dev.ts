/**
 * Analytics Dev Server — Mock GA4/GTM relay (port 4001)
 *
 * Geliştirmede gerçek GA4'e event göndermek istemiyoruz, ama dataLayer push'ları
 * görmek istiyoruz. Bu sunucu:
 *
 *   - POST /collect      → GA4 Measurement Protocol mock (200 OK + log)
 *   - POST /gtm/dataLayer → frontend dataLayer.push() proxy
 *   - GET  /events       → son 100 event (UI için)
 *   - GET  /              → ASCII dashboard (canlı event akışı)
 *
 * Çıktı: console + logs/analytics-dev.log
 */
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = parseInt(process.env.ANALYTICS_DEV_PORT || '4001', 10);
const LOG_PATH = path.resolve(process.cwd(), 'logs/analytics-dev.log');
const MAX_EVENTS = 100;

interface Event {
  ts: number;
  source: 'ga4' | 'gtm' | 'custom';
  name: string;
  payload: Record<string, unknown>;
}

const events: Event[] = [];

function log(msg: string): void {
  const stamp = new Date().toISOString().slice(11, 19);
  const line = `[${stamp}] ${msg}`;
  console.log(`▶ analytics-dev: ${line}`);
  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
    fs.appendFileSync(LOG_PATH, line + '\n');
  } catch {
    /* ignore */
  }
}

function pushEvent(ev: Event): void {
  events.unshift(ev);
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;
  const summary = ev.name + (ev.payload.event_category ? ` [${ev.payload.event_category}]` : '');
  log(`📊 ${ev.source}: ${summary}`);
}

async function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk.toString();
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  // ── POST /collect — GA4 Measurement Protocol mock ───────────
  if (req.method === 'POST' && url.pathname === '/collect') {
    const body = await readBody(req);
    let parsed: Record<string, unknown> = {};
    try {
      parsed = body
        ? (JSON.parse(body) as Record<string, unknown>)
        : Object.fromEntries(url.searchParams);
    } catch {
      parsed = { raw: body };
    }
    pushEvent({
      ts: Date.now(),
      source: 'ga4',
      name: (parsed['event_name'] as string) || (parsed['en'] as string) || 'unknown',
      payload: parsed,
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', received: true }));
    return;
  }

  // ── POST /gtm/dataLayer — dataLayer.push() proxy ────────────
  if (req.method === 'POST' && url.pathname === '/gtm/dataLayer') {
    const body = await readBody(req);
    try {
      const parsed = JSON.parse(body) as { event?: string } & Record<string, unknown>;
      pushEvent({
        ts: Date.now(),
        source: 'gtm',
        name: parsed.event || 'datalayer_push',
        payload: parsed,
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
    } catch (err) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'error', message: (err as Error).message }));
    }
    return;
  }

  // ── GET /events — son 100 event ─────────────────────────────
  if (req.method === 'GET' && url.pathname === '/events') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: events.length, events }, null, 2));
    return;
  }

  // ── GET / — ASCII dashboard ─────────────────────────────────
  if (req.method === 'GET' && url.pathname === '/') {
    const recent =
      events
        .slice(0, 10)
        .map((e) => {
          const t = new Date(e.ts).toISOString().slice(11, 19);
          return `  [${t}] ${e.source.padEnd(4)} → ${e.name}`;
        })
        .join('\n') || '  (henüz event yok)';

    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`
╔════════════════════════════════════════════════╗
║  eCyPro Analytics Dev Server (mock GA4/GTM)    ║
╠════════════════════════════════════════════════╣
║  Toplam event: ${String(events.length).padStart(4)}                          ║
║  Endpoint'ler:                                 ║
║    POST /collect        → GA4 mock             ║
║    POST /gtm/dataLayer  → dataLayer proxy      ║
║    GET  /events         → JSON dump            ║
╚════════════════════════════════════════════════╝

Son 10 event:
${recent}

Frontend bağlantısı:
  fetch('http://localhost:${PORT}/collect', { method: 'POST', body: JSON.stringify({ event_name: 'page_view' }) })
`);
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'error', message: 'Not found' }));
});

server.listen(PORT, () => {
  log(`🚀 mock analytics relay → http://localhost:${PORT}`);
  log('endpoint: POST /collect | POST /gtm/dataLayer | GET /events | GET /');
});

let stopping = false;
function shutdown(signal: string): void {
  if (stopping) return;
  stopping = true;
  log(`${signal} → kapanıyor`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
