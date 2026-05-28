import React from 'react';
import { cn } from '@/lib/utils';

type CalloutType = 'info' | 'warning' | 'kvkk' | 'pro-tip';

interface CalloutProps {
  type: CalloutType;
  children: React.ReactNode;
}

const CONFIG: Record<
  CalloutType,
  { bg: string; border: string; text: string; icon: React.ReactNode; badge?: string }
> = {
  info: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-900',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-blue-500 shrink-0 mt-0.5"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
      </svg>
    ),
  },
  warning: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-900',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-amber-500 shrink-0 mt-0.5"
        aria-hidden="true"
      >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
    ),
  },
  kvkk: {
    bg: 'bg-white',
    border: 'border-red-400',
    text: 'text-slate-800',
    badge: 'KVKK',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-red-500 shrink-0 mt-0.5"
        aria-hidden="true"
      >
        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    ),
  },
  'pro-tip': {
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-900',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-emerald-500 shrink-0 mt-0.5"
        aria-hidden="true"
      >
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
      </svg>
    ),
  },
};

export function Callout({ type, children }: CalloutProps) {
  const config = CONFIG[type];

  return (
    <div
      className={cn(
        'my-fib-6 flex gap-fib-4 rounded-lg border-l-4 p-fib-5',
        config.bg,
        config.border,
      )}
      data-testid={`callout-${type}`}
      role="note"
    >
      {config.icon}
      <div className={cn('flex-1 text-sm leading-relaxed', config.text)}>
        {config.badge && (
          <span className="inline-block mb-2 rounded bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 border border-red-200">
            {config.badge}
          </span>
        )}
        <div>{children}</div>
      </div>
    </div>
  );
}
