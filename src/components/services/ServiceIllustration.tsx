/**
 * P49 — Per-service decorative SVG illustrations.
 *
 * 21 servis için domain-specific line-art glyph. Tüm SVG'ler tek dosyada
 * (data-driven). Decorative purpose, aria-hidden. Consistent style:
 *   - 200×200 viewBox
 *   - Stroke-width 1.5 (line-art)
 *   - Gradient stroke (indigo→violet) + gold accent dot
 *   - 0.08 fill opacity on closed shapes (subtle depth)
 */

import React from 'react';

const SVG_PROPS = {
  viewBox: '0 0 200 200',
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  'aria-hidden': true,
} as const;

const Defs = ({ id }: { id: string }) => (
  <defs>
    <linearGradient id={`${id}-grad`} x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#2563EB" />
      <stop offset="100%" stopColor="#7C3AED" />
    </linearGradient>
    <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stopColor="#F59E0B" />
      <stop offset="100%" stopColor="#D97706" />
    </linearGradient>
  </defs>
);

const STROKE = 1.6;

type ProfileMap = Record<string, React.ReactElement>;

const ILLUSTRATIONS: ProfileMap = {
  // S1 — Stratejik Dönüşüm: ascending chevron path + summit dot
  'strategic-transformation': (
    <svg {...SVG_PROPS}>
      <Defs id="s1" />
      <path
        d="M 30 160 L 60 130 L 80 145 L 110 100 L 135 115 L 170 60"
        stroke="url(#s1-grad)"
        strokeWidth={STROKE * 1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="170" cy="60" r="6" fill="url(#s1-gold)" />
      <circle cx="170" cy="60" r="12" fill="none" stroke="url(#s1-gold)" strokeWidth="1" opacity="0.4" />
      <circle cx="30" cy="160" r="4" fill="#7C3AED" />
      <text x="174" y="48" fontFamily="Inter" fontSize="9" fill="#94A3B8" fontWeight="600">
        N
      </text>
    </svg>
  ),
  // S2 — M&A: deal flow tree (two nodes merging)
  'mergers-acquisitions': (
    <svg {...SVG_PROPS}>
      <Defs id="s2" />
      <circle cx="50" cy="60" r="20" stroke="url(#s2-grad)" strokeWidth={STROKE} />
      <circle cx="150" cy="60" r="20" stroke="url(#s2-grad)" strokeWidth={STROKE} />
      <path d="M 70 75 Q 100 110 100 130" stroke="url(#s2-grad)" strokeWidth={STROKE} strokeLinecap="round" />
      <path d="M 130 75 Q 100 110 100 130" stroke="url(#s2-grad)" strokeWidth={STROKE} strokeLinecap="round" />
      <rect x="80" y="130" width="40" height="30" rx="6" stroke="url(#s2-grad)" strokeWidth={STROKE} />
      <circle cx="100" cy="145" r="6" fill="url(#s2-gold)" />
    </svg>
  ),
  // S3 — Family Business: generational tree (3 nesil halka)
  'family-business': (
    <svg {...SVG_PROPS}>
      <Defs id="s3" />
      <circle cx="100" cy="40" r="14" stroke="url(#s3-grad)" strokeWidth={STROKE} />
      <circle cx="60" cy="100" r="14" stroke="url(#s3-grad)" strokeWidth={STROKE} />
      <circle cx="140" cy="100" r="14" stroke="url(#s3-grad)" strokeWidth={STROKE} />
      <circle cx="40" cy="160" r="11" stroke="url(#s3-grad)" strokeWidth={STROKE} />
      <circle cx="80" cy="160" r="11" stroke="url(#s3-grad)" strokeWidth={STROKE} />
      <circle cx="120" cy="160" r="11" stroke="url(#s3-grad)" strokeWidth={STROKE} />
      <circle cx="160" cy="160" r="11" stroke="url(#s3-grad)" strokeWidth={STROKE} />
      <path d="M 100 54 L 60 86 M 100 54 L 140 86 M 60 114 L 40 149 M 60 114 L 80 149 M 140 114 L 120 149 M 140 114 L 160 149" stroke="url(#s3-grad)" strokeWidth={STROKE * 0.8} />
      <circle cx="100" cy="40" r="4" fill="url(#s3-gold)" />
    </svg>
  ),
  // S4 — Operational Excellence: gear + flowstream
  'operational-excellence': (
    <svg {...SVG_PROPS}>
      <Defs id="s4" />
      <g transform="translate(100,80)">
        <circle r="32" stroke="url(#s4-grad)" strokeWidth={STROKE} />
        <circle r="14" stroke="url(#s4-grad)" strokeWidth={STROKE} />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((d) => (
          <rect key={d} x="-3" y="-44" width="6" height="12" fill="url(#s4-grad)" transform={`rotate(${d})`} />
        ))}
      </g>
      <path d="M 30 150 L 80 150 L 90 140 L 110 160 L 120 150 L 170 150" stroke="url(#s4-grad)" strokeWidth={STROKE * 1.4} strokeLinecap="round" fill="none" />
      <circle cx="170" cy="150" r="6" fill="url(#s4-gold)" />
    </svg>
  ),
  // S5 — Neuromarketing: brain hemisphere abstract
  neuromarketing: (
    <svg {...SVG_PROPS}>
      <Defs id="s5" />
      <path d="M 60 60 Q 30 100 60 140 Q 100 160 100 100 Q 100 60 60 60 Z" stroke="url(#s5-grad)" strokeWidth={STROKE} />
      <path d="M 140 60 Q 170 100 140 140 Q 100 160 100 100 Q 100 60 140 60 Z" stroke="url(#s5-grad)" strokeWidth={STROKE} />
      <circle cx="80" cy="90" r="3" fill="url(#s5-grad)" />
      <circle cx="80" cy="110" r="3" fill="url(#s5-grad)" />
      <circle cx="120" cy="90" r="3" fill="url(#s5-grad)" />
      <circle cx="120" cy="110" r="3" fill="url(#s5-grad)" />
      <circle cx="100" cy="100" r="5" fill="url(#s5-gold)" />
    </svg>
  ),
  // S6 — HR Transformation: org chart with center node
  'hr-transformation': (
    <svg {...SVG_PROPS}>
      <Defs id="s6" />
      <circle cx="100" cy="60" r="14" stroke="url(#s6-grad)" strokeWidth={STROKE} />
      <circle cx="100" cy="60" r="4" fill="url(#s6-gold)" />
      <circle cx="50" cy="130" r="12" stroke="url(#s6-grad)" strokeWidth={STROKE} />
      <circle cx="100" cy="130" r="12" stroke="url(#s6-grad)" strokeWidth={STROKE} />
      <circle cx="150" cy="130" r="12" stroke="url(#s6-grad)" strokeWidth={STROKE} />
      <path d="M 100 74 L 50 118 M 100 74 L 100 118 M 100 74 L 150 118" stroke="url(#s6-grad)" strokeWidth={STROKE} />
    </svg>
  ),
  // S7 — Crisis Management: shield with pulse line
  'crisis-management': (
    <svg {...SVG_PROPS}>
      <Defs id="s7" />
      <path
        d="M 100 30 L 145 50 L 145 100 Q 145 140 100 170 Q 55 140 55 100 L 55 50 Z"
        stroke="url(#s7-grad)"
        strokeWidth={STROKE * 1.4}
        strokeLinejoin="round"
      />
      <path d="M 65 105 L 85 105 L 92 85 L 105 125 L 115 100 L 135 100" stroke="url(#s7-gold)" strokeWidth={STROKE * 1.6} strokeLinecap="round" fill="none" />
    </svg>
  ),
  // S8 — AI Analytics: neural network nodes
  'ai-analytics': (
    <svg {...SVG_PROPS}>
      <Defs id="s8" />
      {/* 3 layer network: input (3), hidden (4), output (2) */}
      {[30, 80, 130].map((y) => (
        <circle key={`i${y}`} cx="40" cy={y} r="7" stroke="url(#s8-grad)" strokeWidth={STROKE} />
      ))}
      {[20, 70, 120, 170].map((y) => (
        <circle key={`h${y}`} cx="100" cy={y} r="7" stroke="url(#s8-grad)" strokeWidth={STROKE} />
      ))}
      {[60, 140].map((y) => (
        <circle key={`o${y}`} cx="160" cy={y} r="7" stroke="url(#s8-grad)" strokeWidth={STROKE} />
      ))}
      {/* connections (subset for clarity) */}
      <g stroke="url(#s8-grad)" strokeWidth="0.6" opacity="0.5">
        <line x1="47" y1="30" x2="93" y2="20" />
        <line x1="47" y1="30" x2="93" y2="70" />
        <line x1="47" y1="80" x2="93" y2="70" />
        <line x1="47" y1="80" x2="93" y2="120" />
        <line x1="47" y1="130" x2="93" y2="120" />
        <line x1="47" y1="130" x2="93" y2="170" />
        <line x1="107" y1="20" x2="153" y2="60" />
        <line x1="107" y1="70" x2="153" y2="60" />
        <line x1="107" y1="120" x2="153" y2="140" />
        <line x1="107" y1="170" x2="153" y2="140" />
      </g>
      <circle cx="160" cy="60" r="3" fill="url(#s8-gold)" />
    </svg>
  ),
  // S9 — Digital Strategy: stacked screens / device frames
  'digital-strategy': (
    <svg {...SVG_PROPS}>
      <Defs id="s9" />
      <rect x="40" y="40" width="120" height="80" rx="6" stroke="url(#s9-grad)" strokeWidth={STROKE} />
      <line x1="40" y1="58" x2="160" y2="58" stroke="url(#s9-grad)" strokeWidth={STROKE * 0.8} />
      <circle cx="50" cy="49" r="2" fill="url(#s9-grad)" />
      <circle cx="58" cy="49" r="2" fill="url(#s9-grad)" />
      <rect x="50" y="68" width="44" height="14" rx="2" stroke="url(#s9-grad)" strokeWidth={STROKE * 0.8} />
      <rect x="50" y="86" width="60" height="24" rx="2" stroke="url(#s9-grad)" strokeWidth={STROKE * 0.8} />
      <rect x="60" y="130" width="80" height="40" rx="6" stroke="url(#s9-grad)" strokeWidth={STROKE} />
      <line x1="60" y1="143" x2="140" y2="143" stroke="url(#s9-grad)" strokeWidth={STROKE * 0.8} />
      <circle cx="100" cy="155" r="6" fill="url(#s9-gold)" />
    </svg>
  ),
  // S10 — Data Governance: lock + database
  'data-governance': (
    <svg {...SVG_PROPS}>
      <Defs id="s10" />
      <ellipse cx="100" cy="55" rx="40" ry="12" stroke="url(#s10-grad)" strokeWidth={STROKE} />
      <path d="M 60 55 V 105 Q 60 117 100 117 Q 140 117 140 105 V 55" stroke="url(#s10-grad)" strokeWidth={STROKE} fill="none" />
      <ellipse cx="100" cy="85" rx="40" ry="12" stroke="url(#s10-grad)" strokeWidth={STROKE * 0.7} fill="none" />
      <rect x="80" y="130" width="40" height="40" rx="4" stroke="url(#s10-grad)" strokeWidth={STROKE} />
      <path d="M 90 130 V 122 Q 90 110 100 110 Q 110 110 110 122 V 130" stroke="url(#s10-grad)" strokeWidth={STROKE} />
      <circle cx="100" cy="148" r="4" fill="url(#s10-gold)" />
    </svg>
  ),
  // S11 — ESG Strategy: leaf with carbon network
  'esg-strategy': (
    <svg {...SVG_PROPS}>
      <Defs id="s11" />
      <path
        d="M 100 30 Q 60 50 60 110 Q 60 160 100 170 Q 140 160 140 110 Q 140 50 100 30 Z"
        stroke="url(#s11-grad)"
        strokeWidth={STROKE * 1.4}
      />
      <path d="M 100 35 V 165" stroke="url(#s11-grad)" strokeWidth={STROKE * 0.8} />
      <path d="M 100 70 L 75 85 M 100 90 L 75 105 M 100 110 L 75 125 M 100 70 L 125 85 M 100 90 L 125 105 M 100 110 L 125 125" stroke="url(#s11-grad)" strokeWidth={STROKE * 0.7} />
      <circle cx="100" cy="100" r="6" fill="url(#s11-gold)" />
    </svg>
  ),
  // S12 — Investment Incentives: coin stack + arrow
  'investment-incentives': (
    <svg {...SVG_PROPS}>
      <Defs id="s12" />
      <ellipse cx="100" cy="120" rx="40" ry="10" stroke="url(#s12-grad)" strokeWidth={STROKE} />
      <ellipse cx="100" cy="135" rx="40" ry="10" stroke="url(#s12-grad)" strokeWidth={STROKE} />
      <ellipse cx="100" cy="150" rx="40" ry="10" stroke="url(#s12-grad)" strokeWidth={STROKE} />
      <path d="M 100 90 L 100 50 M 90 60 L 100 50 L 110 60" stroke="url(#s12-gold)" strokeWidth={STROKE * 1.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <text x="100" y="33" textAnchor="middle" fontFamily="Inter" fontSize="11" fontWeight="700" fill="url(#s12-gold)">
        +%
      </text>
    </svg>
  ),
  // S13 — Macro Risk: candlestick chart abstract
  'macro-risk': (
    <svg {...SVG_PROPS}>
      <Defs id="s13" />
      <line x1="30" y1="170" x2="170" y2="170" stroke="url(#s13-grad)" strokeWidth={STROKE} strokeLinecap="round" />
      <line x1="30" y1="30" x2="30" y2="170" stroke="url(#s13-grad)" strokeWidth={STROKE} strokeLinecap="round" />
      {/* Candles */}
      <g>
        <line x1="55" y1="80" x2="55" y2="140" stroke="url(#s13-grad)" strokeWidth={STROKE * 0.8} />
        <rect x="49" y="90" width="12" height="40" stroke="url(#s13-grad)" strokeWidth={STROKE} fill="none" />
        <line x1="85" y1="60" x2="85" y2="160" stroke="url(#s13-grad)" strokeWidth={STROKE * 0.8} />
        <rect x="79" y="80" width="12" height="60" stroke="url(#s13-grad)" strokeWidth={STROKE} fill="rgba(124,58,237,0.15)" />
        <line x1="115" y1="50" x2="115" y2="130" stroke="url(#s13-grad)" strokeWidth={STROKE * 0.8} />
        <rect x="109" y="65" width="12" height="50" stroke="url(#s13-grad)" strokeWidth={STROKE} fill="none" />
        <line x1="145" y1="40" x2="145" y2="155" stroke="url(#s13-grad)" strokeWidth={STROKE * 0.8} />
        <rect x="139" y="55" width="12" height="80" stroke="url(#s13-grad)" strokeWidth={STROKE} fill="rgba(124,58,237,0.15)" />
      </g>
      <circle cx="145" cy="40" r="5" fill="url(#s13-gold)" />
    </svg>
  ),
  // S14 — Competition Economics: scales of justice
  'competition-economics': (
    <svg {...SVG_PROPS}>
      <Defs id="s14" />
      <line x1="100" y1="30" x2="100" y2="170" stroke="url(#s14-grad)" strokeWidth={STROKE * 1.4} strokeLinecap="round" />
      <line x1="40" y1="60" x2="160" y2="60" stroke="url(#s14-grad)" strokeWidth={STROKE * 1.4} strokeLinecap="round" />
      {/* Left pan */}
      <line x1="50" y1="60" x2="35" y2="100" stroke="url(#s14-grad)" strokeWidth={STROKE * 0.7} />
      <line x1="50" y1="60" x2="65" y2="100" stroke="url(#s14-grad)" strokeWidth={STROKE * 0.7} />
      <ellipse cx="50" cy="100" rx="20" ry="7" stroke="url(#s14-grad)" strokeWidth={STROKE} />
      {/* Right pan */}
      <line x1="150" y1="60" x2="135" y2="105" stroke="url(#s14-grad)" strokeWidth={STROKE * 0.7} />
      <line x1="150" y1="60" x2="165" y2="105" stroke="url(#s14-grad)" strokeWidth={STROKE * 0.7} />
      <ellipse cx="150" cy="105" rx="20" ry="7" stroke="url(#s14-grad)" strokeWidth={STROKE} />
      <circle cx="100" cy="30" r="6" fill="url(#s14-gold)" />
    </svg>
  ),
  // S15 — Industrial Relations: handshake abstract
  'industrial-relations': (
    <svg {...SVG_PROPS}>
      <Defs id="s15" />
      <path d="M 35 100 L 75 100 L 95 110 L 105 110 L 125 100 L 165 100" stroke="url(#s15-grad)" strokeWidth={STROKE * 1.5} strokeLinecap="round" fill="none" />
      <path d="M 75 100 L 75 130 L 95 130 L 95 110" stroke="url(#s15-grad)" strokeWidth={STROKE} fill="none" />
      <path d="M 125 100 L 125 130 L 105 130 L 105 110" stroke="url(#s15-grad)" strokeWidth={STROKE} fill="none" />
      <circle cx="100" cy="110" r="6" fill="url(#s15-gold)" />
      <line x1="35" y1="100" x2="35" y2="80" stroke="url(#s15-grad)" strokeWidth={STROKE * 0.7} />
      <line x1="165" y1="100" x2="165" y2="80" stroke="url(#s15-grad)" strokeWidth={STROKE * 0.7} />
    </svg>
  ),
  // S16 — Payroll Audit: receipt + checkmark
  'payroll-audit': (
    <svg {...SVG_PROPS}>
      <Defs id="s16" />
      <path d="M 65 30 L 135 30 L 135 175 L 120 165 L 105 175 L 90 165 L 75 175 L 65 165 Z" stroke="url(#s16-grad)" strokeWidth={STROKE} fill="none" />
      <line x1="78" y1="55" x2="122" y2="55" stroke="url(#s16-grad)" strokeWidth={STROKE * 0.7} />
      <line x1="78" y1="70" x2="115" y2="70" stroke="url(#s16-grad)" strokeWidth={STROKE * 0.7} />
      <line x1="78" y1="85" x2="120" y2="85" stroke="url(#s16-grad)" strokeWidth={STROKE * 0.7} />
      <line x1="78" y1="100" x2="110" y2="100" stroke="url(#s16-grad)" strokeWidth={STROKE * 0.7} />
      <line x1="78" y1="115" x2="118" y2="115" stroke="url(#s16-grad)" strokeWidth={STROKE * 0.7} />
      <path d="M 82 138 L 95 150 L 120 125" stroke="url(#s16-gold)" strokeWidth={STROKE * 2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  ),
  // S17 — Employer Branding: badge with star
  'employer-branding': (
    <svg {...SVG_PROPS}>
      <Defs id="s17" />
      <path d="M 100 30 L 145 55 L 145 105 Q 145 145 100 165 Q 55 145 55 105 L 55 55 Z" stroke="url(#s17-grad)" strokeWidth={STROKE * 1.4} fill="none" />
      <path d="M 100 65 L 109 86 L 132 88 L 114 102 L 120 124 L 100 112 L 80 124 L 86 102 L 68 88 L 91 86 Z" fill="url(#s17-gold)" stroke="url(#s17-grad)" strokeWidth={STROKE * 0.7} />
    </svg>
  ),
  // S18 — Market Entry: globe + arrow target
  'market-entry': (
    <svg {...SVG_PROPS}>
      <Defs id="s18" />
      <circle cx="100" cy="100" r="55" stroke="url(#s18-grad)" strokeWidth={STROKE * 1.2} />
      <ellipse cx="100" cy="100" rx="55" ry="22" stroke="url(#s18-grad)" strokeWidth={STROKE * 0.7} fill="none" />
      <line x1="100" y1="45" x2="100" y2="155" stroke="url(#s18-grad)" strokeWidth={STROKE * 0.7} />
      <path d="M 45 80 Q 100 70 155 80" stroke="url(#s18-grad)" strokeWidth={STROKE * 0.7} fill="none" />
      <path d="M 45 120 Q 100 130 155 120" stroke="url(#s18-grad)" strokeWidth={STROKE * 0.7} fill="none" />
      <circle cx="140" cy="60" r="5" fill="url(#s18-gold)" />
      <path d="M 100 100 L 140 60" stroke="url(#s18-gold)" strokeWidth={STROKE * 1.4} strokeLinecap="round" />
    </svg>
  ),
  // S19 — Global Intelligence: world radar
  'global-intelligence': (
    <svg {...SVG_PROPS}>
      <Defs id="s19" />
      <circle cx="100" cy="100" r="60" stroke="url(#s19-grad)" strokeWidth={STROKE * 0.7} />
      <circle cx="100" cy="100" r="40" stroke="url(#s19-grad)" strokeWidth={STROKE * 0.7} />
      <circle cx="100" cy="100" r="20" stroke="url(#s19-grad)" strokeWidth={STROKE * 0.7} />
      <line x1="40" y1="100" x2="160" y2="100" stroke="url(#s19-grad)" strokeWidth={STROKE * 0.7} />
      <line x1="100" y1="40" x2="100" y2="160" stroke="url(#s19-grad)" strokeWidth={STROKE * 0.7} />
      <path d="M 100 100 L 100 40 A 60 60 0 0 1 140 70 Z" fill="url(#s19-grad)" opacity="0.15" stroke="url(#s19-grad)" strokeWidth={STROKE} />
      <circle cx="135" cy="65" r="5" fill="url(#s19-gold)" />
    </svg>
  ),
  // S20 — Smart Cities: skyline grid
  'smart-cities': (
    <svg {...SVG_PROPS}>
      <Defs id="s20" />
      <rect x="40" y="80" width="20" height="80" stroke="url(#s20-grad)" strokeWidth={STROKE} />
      <rect x="65" y="60" width="22" height="100" stroke="url(#s20-grad)" strokeWidth={STROKE} />
      <rect x="92" y="40" width="20" height="120" stroke="url(#s20-grad)" strokeWidth={STROKE} />
      <rect x="117" y="70" width="20" height="90" stroke="url(#s20-grad)" strokeWidth={STROKE} />
      <rect x="142" y="55" width="18" height="105" stroke="url(#s20-grad)" strokeWidth={STROKE} />
      {/* Windows pattern */}
      <g fill="url(#s20-grad)" opacity="0.4">
        <rect x="44" y="90" width="3" height="3" />
        <rect x="50" y="90" width="3" height="3" />
        <rect x="44" y="100" width="3" height="3" />
        <rect x="50" y="100" width="3" height="3" />
        <rect x="98" y="55" width="3" height="3" />
        <rect x="104" y="55" width="3" height="3" />
        <rect x="98" y="65" width="3" height="3" />
        <rect x="104" y="65" width="3" height="3" />
      </g>
      {/* Wifi signal */}
      <g transform="translate(102,30)" stroke="url(#s20-gold)" strokeWidth={STROKE} strokeLinecap="round" fill="none">
        <path d="M -8 -2 Q 0 -10 8 -2" />
        <path d="M -4 0 Q 0 -5 4 0" />
        <circle cx="0" cy="2" r="1.5" fill="url(#s20-gold)" />
      </g>
    </svg>
  ),
  // S21 — Government Relations: pillars / parliament
  'government-relations': (
    <svg {...SVG_PROPS}>
      <Defs id="s21" />
      {/* Pediment */}
      <path d="M 40 70 L 100 35 L 160 70 Z" stroke="url(#s21-grad)" strokeWidth={STROKE * 1.4} fill="none" />
      <line x1="40" y1="70" x2="160" y2="70" stroke="url(#s21-grad)" strokeWidth={STROKE} />
      {/* Pillars */}
      {[55, 80, 105, 130].map((x) => (
        <line key={x} x1={x} y1="80" x2={x} y2="160" stroke="url(#s21-grad)" strokeWidth={STROKE * 1.2} strokeLinecap="round" />
      ))}
      <line x1="40" y1="160" x2="160" y2="160" stroke="url(#s21-grad)" strokeWidth={STROKE} />
      <circle cx="100" cy="35" r="5" fill="url(#s21-gold)" />
    </svg>
  ),
};

interface ServiceIllustrationProps {
  slug: string;
  className?: string;
}

export const ServiceIllustration: React.FC<ServiceIllustrationProps> = ({ slug, className = '' }) => {
  const svg = ILLUSTRATIONS[slug];
  if (!svg) return null;
  return (
    <div className={`inline-block ${className}`} aria-hidden="true" data-testid={`service-illustration-${slug}`}>
      {svg}
    </div>
  );
};
