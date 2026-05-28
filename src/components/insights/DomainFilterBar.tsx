import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Domain } from '@/types/insights';
import { DOMAIN_LABELS, DOMAIN_COLORS } from '@/types/insights';
import { insightsI18n } from '@/i18n/keys/insights';

interface DomainFilterBarProps {
  activeDomain: Domain | 'ALL';
  onDomainChange: (domain: Domain | 'ALL') => void;
  articleCounts: Record<Domain | 'ALL', number>;
}

const SUB_DOMAINS: Record<Domain, string[]> = {
  M_A: ['Değerleme', 'Due Diligence', 'Entegrasyon', 'Cross-border', 'Buyout', 'Vergi'],
  ESG: ['Raporlama', 'İklim', 'İnsan Hakları', 'Yönetişim', 'Yatırımcı İlişkileri', 'Çevre'],
  FINTECH: ['Lisanslama', 'Açık Bankacılık', 'Kripto', 'Embedded Finance', 'RegTech'],
  AILE_SIRKETI: ['Yönetişim', 'Finansman', 'Nesil Geçişi', 'IPO', 'İslami Finans', 'Kredi'],
};

const DOMAINS: Array<Domain | 'ALL'> = ['ALL', 'M_A', 'ESG', 'FINTECH', 'AILE_SIRKETI'];

export function DomainFilterBar({
  activeDomain,
  onDomainChange,
  articleCounts,
}: DomainFilterBarProps) {
  const [openDropdown, setOpenDropdown] = useState<Domain | null>(null);
  const i18n = insightsI18n.hub;

  function handlePillClick(domain: Domain | 'ALL') {
    if (domain === 'ALL') {
      setOpenDropdown(null);
      onDomainChange('ALL');
      return;
    }
    if (openDropdown === domain) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(domain);
      onDomainChange(domain);
    }
  }

  return (
    <div
      className="sticky top-16 z-20 border-b border-slate-200 bg-white"
      data-testid="domain-filter-bar"
    >
      <div className="max-w-7xl mx-auto px-6">
        <div
          className="flex items-stretch gap-1 overflow-x-auto scrollbar-none py-3 no-wrap"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          data-testid="domain-pills"
        >
          {DOMAINS.map((domain) => {
            const isActive = activeDomain === domain;
            const isAllPill = domain === 'ALL';
            const color = !isAllPill ? DOMAIN_COLORS[domain] : null;

            return (
              <div key={domain} className="relative flex-shrink-0">
                <button
                  onClick={() => handlePillClick(domain)}
                  className={cn(
                    'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
                    isActive && !isAllPill
                      ? cn('text-white')
                      : isActive && isAllPill
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                  )}
                  style={
                    isActive && !isAllPill && color ? { backgroundColor: color.primary } : undefined
                  }
                  data-testid={`domain-pill-${domain}`}
                  aria-pressed={isActive}
                >
                  {isAllPill ? i18n.filterAll.tr : DOMAIN_LABELS[domain].tr}
                  <span
                    className={cn(
                      'inline-flex items-center justify-center rounded-full text-xs px-1.5 py-0.5 min-w-[20px]',
                      isActive ? 'bg-white/20 text-white' : 'bg-white text-slate-500',
                    )}
                  >
                    {articleCounts[domain]}
                  </span>
                  {!isAllPill && (
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 transition-transform',
                        openDropdown === domain && 'rotate-180',
                      )}
                    />
                  )}
                </button>

                {isActive && (
                  <motion.div
                    layoutId="domain-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{
                      backgroundColor: !isAllPill && color ? color.primary : '#0f172a',
                    }}
                  />
                )}

                {!isAllPill && openDropdown === domain && (
                  <div
                    className="absolute top-full left-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 min-w-[180px]"
                    data-testid={`subdomain-dropdown-${domain}`}
                  >
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                      onClick={() => {
                        setOpenDropdown(null);
                        onDomainChange(domain);
                      }}
                    >
                      {i18n.subDomainAll.tr}
                    </button>
                    {SUB_DOMAINS[domain].map((sub) => (
                      <button
                        key={sub}
                        className="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
                        onClick={() => setOpenDropdown(null)}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
