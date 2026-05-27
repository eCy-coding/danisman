import React from 'react';
import { cn } from '../../../lib/utils';

interface SuccessFeeCalculatorProps {
  transactionValue: number;
  feePct: number;
  className?: string;
}

function formatUsd(n: number): string {
  return n.toLocaleString('en-US');
}

export function SuccessFeeCalculator({
  transactionValue,
  feePct,
  className,
}: SuccessFeeCalculatorProps) {
  const fee = Math.round(transactionValue * feePct * 100) / 100;
  const pctDisplay = (feePct * 100).toFixed(1);

  return (
    <div
      data-testid="success-fee-calculator"
      className={cn('flex flex-col gap-fib-3 text-sm', className)}
    >
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>İşlem Değeri</span>
        <span>${formatUsd(transactionValue)}</span>
      </div>
      <div className="flex items-center justify-between text-xs text-zinc-400">
        <span>Başarı Ücreti Oranı</span>
        <span>%{pctDisplay}</span>
      </div>
      <div
        data-testid="success-fee-result"
        className="flex items-center justify-between font-semibold text-amber-400"
      >
        <span>Başarı Ücreti</span>
        <span>${formatUsd(fee)}</span>
      </div>
    </div>
  );
}
