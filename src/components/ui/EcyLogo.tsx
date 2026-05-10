import React from 'react';

interface EcyLogoProps {
  variant?: 'full' | 'mark' | 'wordmark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  sm: { mark: 28, gap: 8, name: 18, pro: 10 },
  md: { mark: 36, gap: 10, name: 22, pro: 12 },
  lg: { mark: 44, gap: 12, name: 28, pro: 14 },
  xl: { mark: 56, gap: 14, name: 36, pro: 18 },
} as const;

/**
 * eCy Global Business Logo
 *
 * Mark: geometric lowercase "e" inside rounded square.
 * — 300° clockwise arc (center 20,22 r=9) from left-mid to upper-right gap.
 * — Horizontal crossbar at mid-height.
 * — Gradient: primary #2563EB → secondary #38BDF8.
 *
 * Wordmark: e(cyan) Cy(white) Pro(cyan-light)
 */
export const EcyLogo: React.FC<EcyLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
}) => {
  const s = SIZE_MAP[size];

  const Mark = () => (
    <svg
      width={s.mark}
      height={s.mark}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      data-testid="ecy-logo-mark"
      role="img"
    >
      <defs>
        <linearGradient
          id="ecyMarkGrad"
          x1="0"
          y1="0"
          x2="40"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
        <linearGradient
          id="ecyMarkGrad2"
          x1="40"
          y1="0"
          x2="0"
          y2="40"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
        <linearGradient id="ecyBgGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#080D1A" />
          <stop offset="100%" stopColor="#0D1426" />
        </linearGradient>
        <filter id="ecyGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.5" result="glow" />
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background: solid rounded square — no glassmorphism */}
      <rect x="0.5" y="0.5" width="39" height="39" rx="9.5" fill="url(#ecyBgGrad)" />
      <rect
        x="0.5"
        y="0.5"
        width="39"
        height="39"
        rx="9.5"
        stroke="url(#ecyMarkGrad)"
        strokeWidth="1"
      />

      {/*
        "e" letterform construction:
        Center (20, 22), r = 9
        Arc: M(11,22) clockwise 300° → endpoint at 60° from horizontal = (24.5, 14.2)
             large-arc-flag=1, sweep-flag=1
        Crossbar: M(11,22) → L(29,22)
      */}

      {/* Main bowl arc — 300° clockwise */}
      <path
        d="M 11 22 A 9 9 0 1 1 24.5 14.2"
        stroke="url(#ecyMarkGrad)"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
        filter="url(#ecyGlow)"
      />

      {/* Crossbar arm — extends slightly past circle on right */}
      <path
        d="M 11 22 L 29.5 22"
        stroke="url(#ecyMarkGrad)"
        strokeWidth="2.6"
        strokeLinecap="round"
        filter="url(#ecyGlow)"
      />

      {/* Node dots at arc endpoints — network feel */}
      <circle cx="11" cy="22" r="1.8" fill="#38BDF8" opacity="0.9" />
      <circle cx="29.5" cy="22" r="1.4" fill="#2563EB" opacity="0.8" />
      <circle cx="24.5" cy="14.2" r="1.4" fill="#38BDF8" opacity="0.7" />
    </svg>
  );

  const Wordmark = () => (
    <span
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 700,
        letterSpacing: '-0.025em',
        lineHeight: 1,
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: '0.08em',
      }}
    >
      <span style={{ color: '#38BDF8', fontSize: s.name }}>e</span>
      <span style={{ color: '#ffffff', fontSize: s.name }}>Cy</span>
      <span
        style={{
          color: '#38BDF8',
          fontSize: s.pro,
          fontWeight: 500,
          opacity: 0.9,
          letterSpacing: '0.01em',
        }}
      >
        Pro
      </span>
    </span>
  );

  if (variant === 'mark') {
    return (
      <span className={className} data-testid="ecy-logo">
        <Mark />
      </span>
    );
  }

  if (variant === 'wordmark') {
    return (
      <span className={className} data-testid="ecy-logo">
        <Wordmark />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ gap: s.gap }}
      data-testid="ecy-logo"
    >
      <Mark />
      <Wordmark />
    </span>
  );
};
