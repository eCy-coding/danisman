/**
 * P61.B3 — Event bus (in-memory pub/sub for SSE channel).
 *
 * Lightweight EventEmitter wrapper for admin real-time events.
 * Single-process scope; multi-instance Render deploy'da Redis pub/sub
 * yükseltmesi gerekir (P62+).
 */

import { EventEmitter } from 'node:events';

export type AdminEventType =
  | 'lead.created'
  | 'lead.updated'
  | 'contact.submitted'
  | 'newsletter.subscribed'
  | 'campaign.sent'
  | 'audit.action';

export interface AdminEvent {
  type: AdminEventType;
  ts: number;
  payload: Record<string, unknown>;
}

class AdminEventBus {
  private emitter = new EventEmitter();

  constructor() {
    this.emitter.setMaxListeners(50);
  }

  publish(type: AdminEventType, payload: Record<string, unknown>): void {
    const evt: AdminEvent = { type, ts: Date.now(), payload };
    this.emitter.emit('event', evt);
  }

  subscribe(handler: (evt: AdminEvent) => void): () => void {
    this.emitter.on('event', handler);
    return () => this.emitter.off('event', handler);
  }

  listenerCount(): number {
    return this.emitter.listenerCount('event');
  }
}

export const adminEventBus = new AdminEventBus();
