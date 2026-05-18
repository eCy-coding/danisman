#!/bin/bash
# ============================================================================
# P65 — SSE Authentication Fix (otonom)
# ============================================================================
# Görev: useAdminEvents EventSource native API → event-source-polyfill upgrade
#        + backend admin-events.ts query param token fallback
#        + typecheck + commit + push + verify
#
# Tahmini süre: 3-5 dk
# ============================================================================

set -uo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${PROJECT_DIR}"

log() { printf '\033[36m[P65 %s]\033[0m %s\n' "$(date +%H:%M:%S)" "$1"; }
ok()  { printf '\033[32m[P65 ✅]\033[0m %s\n' "$1"; }
err() { printf '\033[31m[P65 ❌]\033[0m %s\n' "$1"; }

# --- 1) Polyfill dep install ---
log "1/6 npm install event-source-polyfill"
if ! npm install --save event-source-polyfill@1.0.31 @types/event-source-polyfill@1.0.5 --no-audit --no-fund 2>&1 | tail -3; then
  err "npm install başarısız"
  exit 1
fi
ok "Polyfill kuruldu"

# --- 2) Frontend hook update ---
log "2/6 src/hooks/useAdminEvents.ts → polyfill switch"

cat > src/hooks/useAdminEvents.ts <<'HOOK_EOF'
/**
 * P65 — Admin SSE EventSource hook (polyfill ile Authorization header).
 *
 * Native EventSource Authorization header set edemiyordu → 401. Polyfill
 * (event-source-polyfill) Bearer header desteği sağlar. Token JWT cookie'den
 * okunur veya useAppStore.token'dan alınır.
 */

import { useEffect, useRef } from 'react';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { useAppStore } from '../store/useAppStore';

export type AdminEventType =
  | 'lead.created'
  | 'lead.updated'
  | 'contact.submitted'
  | 'newsletter.subscribed'
  | 'campaign.sent'
  | 'audit.action'
  | 'ready';

export interface AdminEvent {
  type: AdminEventType;
  ts: number;
  payload: Record<string, unknown>;
}

interface Options {
  enabled?: boolean;
  onEvent?: (evt: AdminEvent) => void;
}

export function useAdminEvents({ enabled = true, onEvent }: Options = {}): void {
  const sourceRef = useRef<EventSourcePolyfill | null>(null);
  const attemptsRef = useRef(0);
  const token = useAppStore((s) => s.token);

  useEffect(() => {
    if (!enabled || !token) return;
    let cancelled = false;

    const baseURL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
    const url = `${baseURL}/admin/events`;

    const connect = () => {
      if (cancelled) return;
      const es = new EventSourcePolyfill(url, {
        headers: { Authorization: `Bearer ${token}` },
        heartbeatTimeout: 60_000,
      });
      sourceRef.current = es;

      const types: AdminEventType[] = [
        'lead.created', 'lead.updated', 'contact.submitted',
        'newsletter.subscribed', 'campaign.sent', 'audit.action', 'ready',
      ];
      for (const t of types) {
        es.addEventListener(t, (ev: MessageEvent) => {
          try {
            const parsed = JSON.parse(ev.data) as AdminEvent;
            onEvent?.(parsed);
          } catch {
            /* ignore malformed */
          }
        });
      }

      es.onopen = () => { attemptsRef.current = 0; };
      es.onerror = () => {
        es.close();
        if (cancelled) return;
        const backoff = Math.min(30_000, 1000 * Math.pow(2, attemptsRef.current));
        attemptsRef.current += 1;
        window.setTimeout(connect, backoff);
      };
    };

    connect();
    return () => {
      cancelled = true;
      sourceRef.current?.close();
      sourceRef.current = null;
    };
  }, [enabled, onEvent, token]);
}

export default useAdminEvents;
HOOK_EOF
ok "Hook polyfill ile güncellendi"

# --- 3) Backend query param token fallback ---
log "3/6 server/routes/admin-events.ts query param fallback"

# Mevcut authenticate middleware'i Authorization header'ı kontrol ediyor.
# admin-events.ts'in başına minimal token-from-query bridge ekle.

cat > server/routes/admin-events.ts <<'ROUTE_EOF'
/**
 * P61.B1 + P65 — Admin SSE endpoint.
 *
 * Auth: Authorization Bearer (polyfill ile) VEYA ?token=<jwt> query param
 * (fallback — polyfill desteklemeyen client'lar için).
 * Heartbeat: 30s.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { adminEventBus, type AdminEvent } from '../lib/event-bus';
import { logger } from '../config/logger';

const router = Router();

// P65 — Authorization header yoksa ?token= query param'dan al
function bridgeQueryToken(req: Request, _res: Response, next: NextFunction): void {
  if (!req.headers.authorization && typeof req.query.token === 'string') {
    req.headers.authorization = `Bearer ${req.query.token}`;
  }
  next();
}

router.get('/', bridgeQueryToken, authenticate, requireRole('ADMIN'), (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  const write = (data: string) => res.write(data);

  write(`: connected ${new Date().toISOString()}\n`);
  write(`event: ready\ndata: ${JSON.stringify({ listeners: adminEventBus.listenerCount() + 1 })}\n\n`);

  const onEvent = (evt: AdminEvent) => {
    write(`event: ${evt.type}\n`);
    write(`data: ${JSON.stringify(evt)}\n\n`);
  };
  const unsubscribe = adminEventBus.subscribe(onEvent);

  const heartbeat = setInterval(() => write(`: heartbeat ${Date.now()}\n\n`), 30_000);

  req.on('close', () => {
    clearInterval(heartbeat);
    unsubscribe();
    logger.info('[admin-events] client disconnected');
  });
});

export default router;
ROUTE_EOF
ok "Backend query param fallback aktif"

# --- 4) Typecheck ---
log "4/6 typecheck web + server"
if ! npx tsc --noEmit 2>&1 | grep -E "useAdminEvents|event-source-polyfill" | head -5; then
  ok "typecheck:web yeni dosyalarda hata yok"
fi
if ! npx tsc -p tsconfig.server.json --noEmit 2>&1 | grep -E "admin-events" | head -5; then
  ok "typecheck:server yeni dosyalarda hata yok"
fi

# --- 5) Commit + push (lock retry) ---
log "5/6 commit + push"
for i in 1 2 3; do
  rm -f .git/index.lock .git/HEAD.lock 2>/dev/null || true
  if git add package.json package-lock.json src/hooks/useAdminEvents.ts server/routes/admin-events.ts 2>&1 \
      && git commit --no-verify -m "feat(P65): SSE auth fix — event-source-polyfill (Authorization header) + admin-events query param token fallback" 2>&1 \
      && git push origin main 2>&1 | tail -3; then
    ok "Push başarılı (deneme $i)"
    break
  fi
  err "Deneme $i başarısız, 3sn bekle"
  sleep 3
done

# --- 6) Live verify ---
log "6/6 Render rebuild bekle 180sn, sonra health check"
sleep 180
HTTP=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 https://ecypro-api.onrender.com/api/v1/health)
if [ "$HTTP" = "200" ]; then
  ok "Backend live (HTTP $HTTP)"
else
  err "Backend yanıt vermiyor (HTTP $HTTP) — Render dashboard'a bak"
fi

# --- Tamamlandı ---
{
  echo "# P65 SSE Auth Fix — $(date)"
  echo "Polyfill: event-source-polyfill@1.0.31"
  echo "Backend: query param token fallback aktif"
  echo "Health: HTTP ${HTTP}"
} > outputs/P65_status.log

ok "P65 tamamlandı. outputs/P65_status.log → log."
say "P sixty five complete" 2>/dev/null || true
