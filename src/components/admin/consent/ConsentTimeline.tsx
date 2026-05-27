/**
 * M3 — KVKK Rıza Defteri: ConsentTimeline
 *
 * Vertical timeline displaying consent lifecycle events for a subscriber:
 *   - Opt-in (subscribedAt)
 *   - Opt-out (unsubscribedAt, if present)
 *   - 12-month re-consent warning (if subscribed > 365 days and still active)
 */

import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface ConsentTimelineProps {
  email: string;
  subscribedAt: string;
  unsubscribedAt?: string;
  consent: boolean;
}

const RECONSENT_THRESHOLD_MS = 365 * 24 * 60 * 60 * 1000;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface TimelineEvent {
  key: string;
  icon: React.ReactNode;
  label: string;
  date: string;
  dotClass: string;
}

export const ConsentTimeline: React.FC<ConsentTimelineProps> = ({
  email,
  subscribedAt,
  unsubscribedAt,
  consent,
}) => {
  const isOlderThan365 =
    !unsubscribedAt && Date.now() - new Date(subscribedAt).getTime() > RECONSENT_THRESHOLD_MS;

  const events: TimelineEvent[] = [
    {
      key: 'optin',
      icon: <CheckCircle2 className="w-fib-5 h-fib-5 text-green-400" />,
      label: 'Rıza Verildi (Opt-in)',
      date: formatDate(subscribedAt),
      dotClass: 'bg-green-400',
    },
  ];

  if (isOlderThan365) {
    events.push({
      key: 'reconsent',
      icon: <AlertTriangle className="w-fib-5 h-fib-5 text-yellow-400" />,
      label: 'Yeniden Rıza Gerekiyor (12 ay geçti)',
      date: 'Bugün',
      dotClass: 'bg-yellow-400',
    });
  }

  if (unsubscribedAt) {
    events.push({
      key: 'optout',
      icon: <XCircle className="w-fib-5 h-fib-5 text-red-400" />,
      label: 'Rıza Geri Alındı (Opt-out)',
      date: formatDate(unsubscribedAt),
      dotClass: 'bg-red-400',
    });
  }

  return (
    <div className="flex flex-col gap-fib-3">
      <p className="text-xs text-zinc-400 mb-fib-2">{email}</p>
      <ol className="relative border-l border-zinc-700 ml-fib-3">
        {events.map((evt, idx) => (
          <li
            key={evt.key}
            className={cn('mb-fib-5 ml-fib-5', idx === events.length - 1 && 'mb-0')}
          >
            <span
              className={cn(
                'absolute -left-[7px] flex items-center justify-center w-fib-4 h-fib-4 rounded-full',
                evt.dotClass,
              )}
            />
            <div className="flex items-center gap-fib-3">
              {evt.icon}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-zinc-100">{evt.label}</span>
                <time className="text-xs text-zinc-400">{evt.date}</time>
              </div>
            </div>
            {evt.key === 'optin' && (
              <span
                className={cn(
                  'ml-fib-7 text-xs font-semibold px-fib-3 py-fib-1 rounded-full',
                  consent
                    ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                    : 'bg-zinc-700/50 text-zinc-400',
                )}
              >
                {consent ? 'Onaylı Rıza' : 'Rıza Yok'}
              </span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
};
