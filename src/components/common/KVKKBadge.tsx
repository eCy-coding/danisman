import React from 'react';
import { ShieldCheck, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

type KVKKVariant = 'newsletter' | 'discovery' | 'compact';

interface KVKKBadgeProps {
  variant?: KVKKVariant;
  className?: string;
}

const COPY: Record<KVKKVariant, { tr: string; policy: string }> = {
  newsletter: {
    tr: 'Verileriniz KVKK m.11 kapsamında işlenir.',
    policy: '/kvkk',
  },
  discovery: {
    tr: 'KVKK & GDPR uyumlu. Verileriniz üçüncü taraflarla paylaşılmaz.',
    policy: '/kvkk',
  },
  compact: {
    tr: 'KVKK uyumlu',
    policy: '/kvkk',
  },
};

export const KVKKBadge: React.FC<KVKKBadgeProps> = ({ variant = 'newsletter', className }) => {
  const copy = COPY[variant];

  return (
    <div
      data-testid={`kvkk-badge-${variant}`}
      className={cn(
        'inline-flex items-center gap-2 text-xs text-slate-400 leading-snug',
        className,
      )}
    >
      <ShieldCheck size={13} className="text-secondary shrink-0" aria-hidden="true" />
      <span>
        {copy.tr}{' '}
        <a
          href={copy.policy}
          className="underline underline-offset-2 hover:text-secondary transition-colors"
        >
          KVKK
        </a>
      </span>
    </div>
  );
};

interface DataResidencyBadgeProps {
  region?: 'EU' | 'TR' | 'US';
  className?: string;
}

export const DataResidencyBadge: React.FC<DataResidencyBadgeProps> = ({
  region = 'EU',
  className,
}) => {
  const labels: Record<string, string> = {
    EU: 'Avrupa Birliği (EU) veri merkezi',
    TR: 'Türkiye veri merkezi',
    US: 'ABD veri merkezi',
  };

  return (
    <div
      data-testid="data-residency-badge"
      className={cn('inline-flex items-center gap-2 text-xs text-slate-400', className)}
    >
      <Globe size={13} className="text-secondary shrink-0" aria-hidden="true" />
      <span>{labels[region] ?? region}</span>
    </div>
  );
};
