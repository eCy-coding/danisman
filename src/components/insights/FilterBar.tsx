import React from 'react';
import { useTranslation } from 'react-i18next';
import type { Domain } from '@/types/insights';
import { DOMAIN_META } from '@/types/insights';

interface FilterBarProps {
  activeDomain?: Domain;
  onDomainChange: (domain: Domain | undefined) => void;
  className?: string;
}

const DOMAINS: Domain[] = ['M_A', 'ESG', 'FINTECH', 'AILE_SIRKETI'];

export function FilterBar({ activeDomain, onDomainChange, className = '' }: FilterBarProps) {
  const { t } = useTranslation('insights');

  return (
    <nav
      aria-label="Kategori filtresi"
      data-testid="insights-filter-bar"
      className={['flex items-center gap-[8px] flex-wrap', className].join(' ')}
    >
      <button
        onClick={() => onDomainChange(undefined)}
        aria-pressed={activeDomain === undefined}
        className={[
          'px-[13px] py-[5px] rounded-full text-sm transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
          activeDomain === undefined
            ? 'bg-amber-500 text-slate-900 font-semibold'
            : 'bg-slate-800 text-slate-300 hover:bg-slate-700',
        ].join(' ')}
      >
        {t('nav.all')}
      </button>

      {DOMAINS.map((domain) => {
        const meta = DOMAIN_META[domain];
        const isActive = activeDomain === domain;
        return (
          <button
            key={domain}
            onClick={() => onDomainChange(domain)}
            aria-pressed={isActive}
            className={[
              'px-[13px] py-[5px] rounded-full text-sm transition-all duration-150 relative',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500',
              isActive
                ? 'font-semibold text-slate-100'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700',
            ].join(' ')}
            style={isActive ? { backgroundColor: meta.color } : {}}
          >
            {meta.labelTr}
            {isActive && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-amber-500 rounded-full" />
            )}
          </button>
        );
      })}
    </nav>
  );
}
