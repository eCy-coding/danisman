import React from 'react';

/**
 * P48 — eCyPro Corporate Logo System
 *
 * Brand spec:
 *   - Wordmark: "eCy" (Inter 500 white/slate) + "Pro" (Inter 700 gold gradient)
 *     "Pro" word-play emphasis = PROfessional Consulting premium signal
 *   - Mark: geometric "e" letterform (300° arc + crossbar) — premium consulting standardı
 *     Gradient indigo→violet (#2563EB → #7C3AED), gold accent dot
 *   - Variants: full (mark + wordmark), mark (icon only), wordmark (text only),
 *                stacked (mark above wordmark), mono-light, mono-dark
 *
 * Renk palette:
 *   - Primary indigo:  #2563EB
 *   - Secondary violet: #7C3AED
 *   - Premium gold:    #F59E0B
 *   - Slate/dark bg:   #0F172A → #1E1B3A gradient
 *   - White text:      #F8FAFC
 *
 * Source-of-truth SVG'ler: public/brand/{icon-mark,logo-horizontal,logo-stacked,favicon}.svg
 */

interface EcyLogoProps {
  variant?: 'full' | 'mark' | 'wordmark' | 'stacked';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Mono palette — header'da kontrast için */
  mono?: 'none' | 'light' | 'dark';
  className?: string;
}

const SIZE_MAP = {
  sm: { mark: 28, gap: 8, name: 18, pro: 18, tagline: 7 },
  md: { mark: 36, gap: 10, name: 22, pro: 22, tagline: 8 },
  lg: { mark: 44, gap: 12, name: 28, pro: 28, tagline: 9 },
  xl: { mark: 56, gap: 14, name: 36, pro: 36, tagline: 10 },
} as const;

export const EcyLogo: React.FC<EcyLogoProps> = ({
  variant = 'full',
  size = 'md',
  mono = 'none',
  className = '',
}) => {
  const s = SIZE_MAP[size];

  // Color tokens — mono override için
  const grad1 = mono === 'light' ? '#FFFFFF' : mono === 'dark' ? '#0F172A' : 'url(#ecyMarkGrad)';
  const grad2 = mono === 'light' ? '#FFFFFF' : mono === 'dark' ? '#0F172A' : 'url(#ecyMarkGrad)';
  const node1 = mono === 'light' ? '#FFFFFF' : mono === 'dark' ? '#0F172A' : '#7C3AED';
  const node2 = mono === 'light' ? '#FFFFFF' : mono === 'dark' ? '#0F172A' : '#2563EB';
  const accent = mono === 'light' ? '#FFFFFF' : mono === 'dark' ? '#0F172A' : '#F59E0B';
  const bgFill =
    mono === 'light' ? 'transparent' : mono === 'dark' ? 'transparent' : 'url(#ecyMarkBg)';

  const Mark = () => (
    <svg
      width={s.mark}
      height={s.mark}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      data-testid="ecy-logo-mark"
      role="img"
    >
      {mono === 'none' && (
        <defs>
          <linearGradient
            id="ecyMarkGrad"
            x1="0"
            y1="0"
            x2="64"
            y2="64"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
          <linearGradient
            id="ecyMarkBg"
            x1="0"
            y1="0"
            x2="64"
            y2="64"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#1E1B3A" />
          </linearGradient>
        </defs>
      )}

      {/* Rounded square base (solid surface — no glassmorphism per CLAUDE.md doctrine) */}
      <rect x="1" y="1" width="62" height="62" rx="15" fill={bgFill} />
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx="15"
        fill="none"
        stroke={grad1}
        strokeWidth={mono === 'none' ? 1.2 : 1.5}
        opacity={mono === 'none' ? 0.7 : 0.45}
      />

      {/* Geometric "e" — 300° arc + crossbar */}
      <path
        d="M 18 35 A 14 14 0 1 1 39 22"
        stroke={grad2}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M 18 35 L 46 35" stroke={grad2} strokeWidth="4" strokeLinecap="round" />

      {/* 3 endpoint nodes — ecosystem signal */}
      <circle cx="18" cy="35" r="2.5" fill={node1} />
      <circle cx="46" cy="35" r="2" fill={node2} opacity={mono === 'none' ? 1 : 0.85} />
      <circle cx="39" cy="22" r="2" fill={accent} opacity={mono === 'none' ? 1 : 0.85} />
    </svg>
  );

  const wordColor = mono === 'light' ? '#FFFFFF' : mono === 'dark' ? '#0F172A' : '#F8FAFC';
  const proColor = mono === 'light' ? '#FFFFFF' : mono === 'dark' ? '#0F172A' : 'transparent'; // gradient via background-clip
  const proStyle: React.CSSProperties =
    mono === 'none'
      ? {
          background: 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          color: 'transparent',
        }
      : { color: proColor };

  const Wordmark = () => (
    <span className="inline-flex flex-col leading-none" data-testid="ecy-logo-wordmark">
      <span
        style={{
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 500,
          letterSpacing: '-0.025em',
          lineHeight: 1,
          fontSize: s.name,
          color: wordColor,
          display: 'inline-flex',
          alignItems: 'baseline',
        }}
      >
        eCy
        <span
          style={{
            fontWeight: 700,
            marginLeft: '0.12em',
            fontSize: s.pro,
            letterSpacing: '-0.015em',
            ...proStyle,
          }}
        >
          Pro
        </span>
      </span>
    </span>
  );

  const Tagline = () => (
    <span
      style={{
        fontFamily: 'Inter, system-ui, sans-serif',
        fontWeight: 600,
        fontSize: s.tagline,
        letterSpacing: '0.32em',
        color: mono === 'light' ? 'rgba(255,255,255,0.7)' : mono === 'dark' ? '#475569' : '#94A3B8',
        marginTop: '0.4em',
      }}
    >
      PREMIUM CONSULTING
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

  if (variant === 'stacked') {
    return (
      <span
        className={`inline-flex flex-col items-center ${className}`}
        data-testid="ecy-logo"
        style={{ gap: s.gap / 2 }}
      >
        <Mark />
        <Wordmark />
        {size !== 'sm' && <Tagline />}
      </span>
    );
  }

  // 'full' (horizontal)
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
