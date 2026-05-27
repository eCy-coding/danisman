import React, { useState, useEffect } from 'react';
import { cn } from '../../../lib/utils';

interface BreachCountdownTimerProps {
  notificationDeadline: string | Date;
  reportedToKurul: boolean;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function BreachCountdownTimer({
  notificationDeadline,
  reportedToKurul,
}: BreachCountdownTimerProps) {
  const deadline =
    notificationDeadline instanceof Date ? notificationDeadline : new Date(notificationDeadline);

  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // Real-time 1-second tick — clears on unmount
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (reportedToKurul) {
    return (
      <span className={cn('inline-flex items-center gap-fib-2 text-sm font-medium text-green-400')}>
        ✓ Kurul&apos;a Bildirildi
      </span>
    );
  }

  const diffMs = deadline.getTime() - now;
  const isOverdue = diffMs <= 0;

  if (isOverdue) {
    return (
      <span className={cn('inline-flex items-center gap-fib-2 text-sm font-semibold text-red-400')}>
        ⚠ Süre Aşıldı ({formatDuration(diffMs)} geçti)
      </span>
    );
  }

  // Highlight urgency: red if under 6h, yellow if under 24h, white otherwise
  const colorClass =
    diffMs < 6 * 60 * 60 * 1000
      ? 'text-red-400'
      : diffMs < 24 * 60 * 60 * 1000
        ? 'text-yellow-400'
        : 'text-white';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-fib-2 text-sm font-medium tabular-nums',
        colorClass,
      )}
    >
      {formatDuration(diffMs)} kaldı
    </span>
  );
}
