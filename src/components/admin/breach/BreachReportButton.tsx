import React from 'react';
import { cn } from '../../../lib/utils';

interface BreachReportButtonProps {
  onClick: () => void;
}

export function BreachReportButton({ onClick }: BreachReportButtonProps) {
  return (
    <div className="flex flex-col gap-fib-2">
      <button
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-fib-3 rounded-lg px-fib-5 py-fib-3',
          'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-sm font-semibold',
          'transition-colors',
        )}
      >
        {/* Warning icon inline — no external icon dependency required */}
        <span aria-hidden="true">⚠</span>
        Yeni İhlal Bildir
      </button>
      <p className="text-xs text-red-400/80">
        KVKK m.12/5 — 72 saat içinde Kurul&apos;a bildirim zorunludur
      </p>
    </div>
  );
}
