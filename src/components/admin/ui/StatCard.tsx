/**
 * P57.1 — StatCard primitive.
 *
 * KPI dashboard card: label + value + delta (opsiyonel) + icon (opsiyonel) +
 * trend renk gösterimi (yeşil/kırmızı).
 */

import React from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
  delta?: { value: string; direction: 'up' | 'down' | 'flat' };
  hint?: string;
  icon?: React.ReactNode;
  tone?: 'default' | 'positive' | 'warning' | 'danger';
}

const TONE_BORDER: Record<NonNullable<StatCardProps['tone']>, string> = {
  default: 'border-white/10',
  positive: 'border-secondary/30',
  warning: 'border-amber-400/30',
  danger: 'border-red-500/30',
};

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  delta,
  hint,
  icon,
  tone = 'default',
}) => {
  const DeltaIcon =
    delta?.direction === 'up' ? ArrowUp : delta?.direction === 'down' ? ArrowDown : Minus;
  const deltaColor =
    delta?.direction === 'up'
      ? 'text-secondary'
      : delta?.direction === 'down'
        ? 'text-red-400'
        : 'text-slate-400';

  return (
    <div className={`bg-white/[0.02] border ${TONE_BORDER[tone]} rounded-xl p-5`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">{label}</p>
        {icon && <div className="text-slate-500">{icon}</div>}
      </div>
      <p className="text-3xl font-serif font-bold text-white leading-none">{value}</p>
      {(delta || hint) && (
        <div className="flex items-center justify-between mt-3">
          {delta && (
            <span className={`inline-flex items-center gap-1 text-xs font-semibold ${deltaColor}`}>
              <DeltaIcon size={12} aria-hidden="true" />
              {delta.value}
            </span>
          )}
          {hint && <span className="text-xs text-slate-500">{hint}</span>}
        </div>
      )}
    </div>
  );
};

export default StatCard;
