/**
 * P44-T07 (extension) — `/api/admin/analytics-stream` SSE endpoint.
 *
 * Wire used by `LiveLeadFeed.tsx` on the admin CRM dashboard. Streams admin
 * events from the in-memory `adminEventBus` (pub/sub already wired by
 * `server/controllers/analyticsController.ts` on contact submit, and other
 * admin actions). Falls back gracefully — if no event fires, the SSE channel
 * sends periodic `heartbeat` frames so the client status badge stays "LIVE".
 *
 * Auth model:
 *   - JWT via `Authorization: Bearer …` header OR `?token=` query (W3C
 *     EventSource cannot set custom headers — `authenticate` middleware was
 *     extended in P44-T07 to accept query-token as a fallback).
 *   - ADMIN role required (enforced by `requireRole('ADMIN')`).
 *
 * Event taxonomy on the wire (matches LiveLeadFeed.tsx listeners):
 *   - `contact_new`  — payload: { id, fullName, email, service?, source? }
 *   - `heartbeat`    — payload: { ts } every 30 s
 *
 * The hand-off is intentionally narrow: today we only relay `contact.submitted`
 * (UI's "Live Lead Feed"). Adding more channels (`lead.created`,
 * `newsletter.subscribed`, etc.) is a one-line case in the bus handler below.
 */
import { Router, type Request, type Response } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { adminEventBus, type AdminEvent } from '../lib/event-bus';
import { logger } from '../config/logger';

const router = Router();

// 30 s heartbeat keeps reverse proxies (Render, Cloudflare) from closing the
// idle connection and keeps the client's "LIVE" badge green even when no
// admin event is firing.
const HEARTBEAT_MS = 30_000;

router.get('/', authenticate, requireRole('ADMIN'), (req: Request, res: Response) => {
  // SSE headers per RFC + the Cache-Control / X-Accel-Buffering trio every
  // Render / nginx deployment guide recommends.
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  // Initial frame so the browser's `EventSource.onopen` fires and the
  // LiveLeadFeed badge flips OFFLINE → LIVE immediately.
  res.write(`event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now(), boot: true })}\n\n`);

  let active = true;

  // Periodic heartbeat — same event name the frontend listens for.
  const heartbeatTimer = setInterval(() => {
    if (!active) return;
    try {
      res.write(`event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`);
    } catch {
      // Socket already torn down; cleanup will run via `close` handler.
    }
  }, HEARTBEAT_MS);

  // Bridge: adminEventBus → SSE wire. We map AdminEvent.type to the wire
  // event name expected by the various admin widgets (LiveLeadFeed,
  // NewsletterPulse, CampaignTicker, etc.). Adding a new bridge is now a
  // single case branch — Round-4 unlocked all 6 bus channels so the admin
  // dashboard can wire to whichever signals it needs without backend
  // changes.
  const unsubscribe = adminEventBus.subscribe((evt: AdminEvent) => {
    if (!active) return;
    let wireName: string | null = null;
    let wirePayload: Record<string, unknown> = evt.payload;
    switch (evt.type) {
      case 'contact.submitted':
        // Round-3: LiveLeadFeed listener — `contact_new`.
        wireName = 'contact_new';
        wirePayload = {
          id: String(evt.payload.id ?? ''),
          fullName: String(evt.payload.fullName ?? ''),
          email: String(evt.payload.email ?? ''),
          service: (evt.payload.service as string | null) ?? null,
          source: (evt.payload.source as string | null) ?? null,
          createdAt: evt.ts,
        };
        break;
      case 'lead.created':
      case 'lead.updated':
        // Round-4: live lead scoring / pipeline updates. CRM dashboard +
        // "Hot Lead" badge can listen and refresh tier-A roster without
        // polling.
        wireName = evt.type === 'lead.created' ? 'lead_new' : 'lead_updated';
        wirePayload = { ...evt.payload, createdAt: evt.ts };
        break;
      case 'newsletter.subscribed':
        // Round-4: newsletter pulse — confetti when a subscription lands.
        wireName = 'newsletter_subscribed';
        wirePayload = {
          email: String(evt.payload.email ?? ''),
          source: (evt.payload.source as string | null) ?? null,
          createdAt: evt.ts,
        };
        break;
      case 'campaign.sent':
        // Round-4: campaign ticker — drop a row on the Newsletter
        // Kampanyalar dashboard when a wave finishes sending.
        wireName = 'campaign_sent';
        wirePayload = {
          id: String(evt.payload.id ?? ''),
          subject: String(evt.payload.subject ?? ''),
          recipientCount: Number(evt.payload.recipientCount ?? 0),
          createdAt: evt.ts,
        };
        break;
      case 'audit.action':
        // Round-4: realtime audit feed — security / RBAC dashboard can show
        // changes as they happen instead of polling /admin/audit-log.
        wireName = 'audit_action';
        wirePayload = {
          action: String(evt.payload.action ?? ''),
          adminId: String(evt.payload.adminId ?? ''),
          targetType: (evt.payload.targetType as string | null) ?? null,
          targetId: (evt.payload.targetId as string | null) ?? null,
          result: (evt.payload.result as string | null) ?? null,
          createdAt: evt.ts,
        };
        break;
      default:
        // Unhandled — dropping the frame keeps the wire clean. New event
        // types: add a case above and pick a stable `wireName`.
        return;
    }
    if (!wireName) return;
    try {
      res.write(`event: ${wireName}\ndata: ${JSON.stringify(wirePayload)}\n\n`);
    } catch (err) {
      logger.warn('[admin-analytics-stream] write failed', { err });
    }
  });

  req.on('close', () => {
    active = false;
    clearInterval(heartbeatTimer);
    unsubscribe();
  });
});

export default router;
