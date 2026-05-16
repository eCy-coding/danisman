/**
 * P23 BE Track 2 / Aşama 1 — SSE connection manager.
 *
 * Topic-based pub/sub over Server-Sent Events.
 *
 * Why SSE (not WebSocket)?
 *   - Server → Client one-way push fits 95% of our real-time needs
 *     (job completion notifications, admin presence, blog comments,
 *     analytics KPI tick). The remaining 5% (collaborative editing,
 *     low-latency cursor sync) can layer WS later without retrofitting
 *     the simple cases onto it.
 *   - HTTP/2-friendly, traverses proxies / corporate firewalls without
 *     the WS Upgrade handshake.
 *   - Native browser `EventSource` API auto-reconnects with `Last-Event-ID`.
 *   - Reuses existing auth middleware (cookie + JWT) → no new ticket
 *     exchange.
 *
 * Capacity (Render Standard plan baseline):
 *   - 1 MB Node heap / 1000 concurrent connections (≈ 100 KB per connection
 *     when accounting for socket + event buffer + topic-set storage).
 *   - Soft ceiling per process: 500 concurrent (50 MB headroom).
 *   - Per-user cap:   3 connections (browser tab × extension × mobile).
 *   - Per-IP cap:    10 connections (corporate NAT + family / VPN endpoint).
 *   - Heartbeat:     30 s SSE comment frame (`:keepalive\n\n`).
 *
 * This module owns the in-memory registry. The HTTP handler lives in
 * `server/routes/stream.ts`; the BullMQ → SSE bridge lives in
 * `server/lib/realtime/publish.ts`.
 */

import type { Response } from 'express';
import { logger } from '../../config/logger';

// ── Types ────────────────────────────────────────────────────────────────────

/**
 * A single live SSE connection.
 *
 * `res` is the underlying Express response we'll write `data:` frames into.
 * `topics` is the set of subscribed channels — fan-out filters against this.
 * `userId` may be `null` when we permit anonymous topic streams (e.g. status
 * page tick); operator policy decides per-topic.
 */
export interface SseClient {
  id: string;
  userId: string | null;
  ip: string;
  topics: Set<string>;
  res: Response;
  /** UNIX ms — used for stale-connection sweep + admin debugging. */
  connectedAt: number;
  /** Number of frames written since connect; observability only. */
  framesSent: number;
}

export interface SseEvent {
  /** Optional SSE event name (`event: <type>`). Browsers fire named listeners. */
  type?: string;
  /** Optional `id:` line — lets the browser resume with Last-Event-ID. */
  id?: string;
  /**
   * Free-form payload. JSON-stringified before write. Keep under 4 KB to
   * stay inside one TLS record so reconnect retransmit cost stays bounded.
   */
  data: unknown;
}

export interface SseManagerLimits {
  perUser: number;
  perIp: number;
  /** Hard ceiling across the whole process. */
  total: number;
  /** Heartbeat interval (ms). 0 disables (test-only). */
  heartbeatMs: number;
}

// ── Defaults — see capacity math above ───────────────────────────────────────

export const DEFAULT_LIMITS: SseManagerLimits = {
  perUser: Number(process.env.SSE_PER_USER) || 3,
  perIp: Number(process.env.SSE_PER_IP) || 10,
  total: Number(process.env.SSE_TOTAL) || 500,
  heartbeatMs: Number(process.env.SSE_HEARTBEAT_MS) || 30_000,
};

// ── Manager class — single instance per process ─────────────────────────────

export class SseManager {
  private byId = new Map<string, SseClient>();
  private byUser = new Map<string, Set<string>>();
  private byIp = new Map<string, Set<string>>();
  private byTopic = new Map<string, Set<string>>();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private limits: SseManagerLimits;
  private nextId = 1;

  constructor(limits: Partial<SseManagerLimits> = {}) {
    this.limits = { ...DEFAULT_LIMITS, ...limits };
    if (this.limits.heartbeatMs > 0) {
      this.heartbeatTimer = setInterval(() => this.heartbeat(), this.limits.heartbeatMs);
      // Don't keep Node alive solely for the heartbeat — graceful shutdown
      // can then close the loop without `clearInterval`.
      if (typeof this.heartbeatTimer.unref === 'function') this.heartbeatTimer.unref();
    }
  }

  /**
   * Decide whether the caller may open a new connection. Returns a rejection
   * reason so the HTTP handler can craft a precise 429/503 — no need to log
   * the same decision twice.
   */
  canAccept(userId: string | null, ip: string): { ok: true } | { ok: false; reason: string } {
    if (this.byId.size >= this.limits.total) {
      return { ok: false, reason: 'process_total_limit' };
    }
    if (userId) {
      const set = this.byUser.get(userId);
      if (set && set.size >= this.limits.perUser) {
        return { ok: false, reason: 'per_user_limit' };
      }
    }
    const ipSet = this.byIp.get(ip);
    if (ipSet && ipSet.size >= this.limits.perIp) {
      return { ok: false, reason: 'per_ip_limit' };
    }
    return { ok: true };
  }

  /**
   * Register a new SSE client. Caller MUST have already:
   *   1. Set status 200 + the SSE response headers.
   *   2. Called `canAccept()` and got `{ ok: true }`.
   *   3. Attached a `req.on('close', () => manager.remove(id))` cleanup.
   */
  add(client: Omit<SseClient, 'id' | 'connectedAt' | 'framesSent'>): SseClient {
    const id = `sse-${process.pid}-${this.nextId++}`;
    const full: SseClient = { ...client, id, connectedAt: Date.now(), framesSent: 0 };
    this.byId.set(id, full);
    if (full.userId) addToBucket(this.byUser, full.userId, id);
    addToBucket(this.byIp, full.ip, id);
    for (const topic of full.topics) addToBucket(this.byTopic, topic, id);
    logger.info('[sse] client connected', {
      id,
      userId: full.userId,
      ip: full.ip,
      topics: Array.from(full.topics),
      total: this.byId.size,
    });
    return full;
  }

  /** Remove a client from all indices and best-effort close the response. */
  remove(id: string): void {
    const client = this.byId.get(id);
    if (!client) return;
    this.byId.delete(id);
    if (client.userId) removeFromBucket(this.byUser, client.userId, id);
    removeFromBucket(this.byIp, client.ip, id);
    for (const topic of client.topics) removeFromBucket(this.byTopic, topic, id);
    try {
      if (!client.res.writableEnded) client.res.end();
    } catch (err) {
      // Already closed — fine, this is the common case.
      logger.debug?.('[sse] response close error', { id, message: (err as Error).message });
    }
    logger.info('[sse] client disconnected', { id, total: this.byId.size });
  }

  /**
   * Publish an event to every subscriber of the topic. Returns the number of
   * connections written to so callers can record fan-out fan-out cardinality.
   *
   * Errors writing to one client don't abort the loop — bad sockets are
   * recorded for the next sweep.
   */
  publish(topic: string, event: SseEvent): number {
    const ids = this.byTopic.get(topic);
    if (!ids || ids.size === 0) return 0;
    const frame = formatFrame(event);
    let written = 0;
    for (const id of ids) {
      const client = this.byId.get(id);
      if (!client) continue;
      try {
        if (!client.res.write(frame)) {
          // Back-pressure — the OS send buffer is full. Drop the client; a
          // healthy reconnect with Last-Event-ID is cheaper than queueing.
          this.remove(id);
          continue;
        }
        client.framesSent++;
        written++;
      } catch (err) {
        logger.warn('[sse] write failed', { id, message: (err as Error).message });
        this.remove(id);
      }
    }
    return written;
  }

  /** Send a JSON message to every connection owned by a user (all topics). */
  publishToUser(userId: string, event: SseEvent): number {
    const ids = this.byUser.get(userId);
    if (!ids || ids.size === 0) return 0;
    const frame = formatFrame(event);
    let written = 0;
    for (const id of ids) {
      const client = this.byId.get(id);
      if (!client) continue;
      try {
        if (client.res.write(frame)) {
          client.framesSent++;
          written++;
        } else {
          this.remove(id);
        }
      } catch {
        this.remove(id);
      }
    }
    return written;
  }

  /** Send a comment frame to every client. Browsers ignore comments. */
  private heartbeat(): void {
    if (this.byId.size === 0) return;
    const frame = `: keepalive ${Date.now()}\n\n`;
    for (const client of this.byId.values()) {
      try {
        if (!client.res.write(frame)) {
          this.remove(client.id);
        }
      } catch {
        this.remove(client.id);
      }
    }
  }

  /** Diagnostic snapshot for /metrics and admin tools. */
  stats(): {
    total: number;
    byTopic: Record<string, number>;
    distinctUsers: number;
    distinctIps: number;
  } {
    const byTopic: Record<string, number> = {};
    for (const [topic, ids] of this.byTopic) byTopic[topic] = ids.size;
    return {
      total: this.byId.size,
      byTopic,
      distinctUsers: this.byUser.size,
      distinctIps: this.byIp.size,
    };
  }

  /** Shutdown — fired by SIGTERM handler to drain connections politely. */
  drain(reason = 'shutdown'): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    const goodbye = `event: server_shutdown\ndata: ${JSON.stringify({ reason })}\n\n`;
    for (const client of this.byId.values()) {
      try {
        client.res.write(goodbye);
      } catch {
        /* ignore */
      }
      this.remove(client.id);
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function addToBucket(map: Map<string, Set<string>>, key: string, id: string): void {
  let set = map.get(key);
  if (!set) {
    set = new Set();
    map.set(key, set);
  }
  set.add(id);
}

function removeFromBucket(map: Map<string, Set<string>>, key: string, id: string): void {
  const set = map.get(key);
  if (!set) return;
  set.delete(id);
  if (set.size === 0) map.delete(key);
}

/**
 * Format a single SSE frame. Multi-line `data` payloads are split per SSE
 * spec (`data: foo\ndata: bar\n\n`). The browser concatenates the chunks
 * with `\n` between them.
 */
export function formatFrame(event: SseEvent): string {
  let out = '';
  if (event.type) out += `event: ${event.type}\n`;
  if (event.id) out += `id: ${event.id}\n`;
  const json = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
  for (const line of json.split('\n')) out += `data: ${line}\n`;
  out += '\n';
  return out;
}

// ── Process-wide singleton ──────────────────────────────────────────────────

let _manager: SseManager | null = null;

export function getSseManager(): SseManager {
  if (!_manager) _manager = new SseManager();
  return _manager;
}

// Test-only override.
export function _setSseManagerForTest(mgr: SseManager | null): void {
  _manager = mgr;
}
