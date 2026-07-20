import React, { useEffect, useState } from 'react';
import { Users } from 'lucide-react';
import { Logger } from '../../../lib/logger';

interface ServiceLiveTrackerProps {
  serviceId: string;
}

// Previously this subscribed to the generic `realtimeService`, which opens
// an EventSource against `/api/events` (no such route exists on the mock
// server or the real backend — server/routes/index.ts has no `/events`
// endpoint) and, on that inevitable error, fell back to a client
// simulation that broadcasts on hardcoded channel names
// (`service:strategic-management`, …) that never match a real service slug
// (`service:strategic-transformation`, etc.) — so this tracker never
// received a single update from either path, on ANY service page. It was
// also never actually rendered anywhere (see ServiceDetailLayout.tsx),
// which was the primary reason the "Live Viewers" UI never appeared.
//
// This connects directly to the per-service SSE endpoint the mock server
// implements (`GET /api/services/:slug/live-viewers`, server/mock-server.mjs
// — pushes `{"viewers": N}` immediately then every 2.5s) and degrades to a
// local pseudo-random ticker if that endpoint is unavailable (e.g. the
// static-only production deployment, which has no such backend route).
export const ServiceLiveTracker: React.FC<ServiceLiveTrackerProps> = ({ serviceId }) => {
  const [viewerCount, setViewerCount] = useState<number>(() => Math.floor(Math.random() * 5) + 2);

  useEffect(() => {
    let cancelled = false;
    let simTimer: ReturnType<typeof setInterval> | null = null;

    const startSimulation = () => {
      if (simTimer) return;
      simTimer = setInterval(() => {
        if (!cancelled) setViewerCount(Math.floor(Math.random() * 10) + 2);
      }, 4_000);
    };

    let source: EventSource | null = null;
    try {
      source = new EventSource(`/api/services/${serviceId}/live-viewers`);
      source.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as { viewers?: number };
          if (!cancelled && typeof data.viewers === 'number') {
            setViewerCount(data.viewers);
          }
        } catch (err) {
          Logger.warn('[ServiceLiveTracker] Malformed SSE payload', err);
        }
      };
      source.onerror = () => {
        // Endpoint unavailable (e.g. static-only deploy) — stop retrying
        // against a dead connection and degrade to local simulation.
        source?.close();
        startSimulation();
      };
    } catch (err) {
      Logger.warn('[ServiceLiveTracker] EventSource unavailable', err);
      startSimulation();
    }

    return () => {
      cancelled = true;
      source?.close();
      if (simTimer) clearInterval(simTimer);
    };
  }, [serviceId]);

  return (
    <div
      data-testid="live-tracker"
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full animate-fade-in"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
      </span>
      <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
        <Users size={12} className="text-emerald-500" />
        {viewerCount} Live Viewers
      </span>
    </div>
  );
};
