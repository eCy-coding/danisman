/**
 * P51.1 — Founder Portrait with graceful fallback.
 *
 * 1. /founder.jpg (gerçek portre — kullanıcı upload edince)
 * 2. /brand/founder-fallback.svg (P48 brand SVG initials portrait)
 *
 * <picture> element ile srcset, AVIF/WebP variants opsiyonel.
 */

import React, { useState } from 'react';

interface FounderPortraitProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  /** Override real portrait path (default: /founder.jpg) */
  realSrc?: string;
}

const SIZE_PX = { sm: 80, md: 160, lg: 280, xl: 400 } as const;

export const FounderPortrait: React.FC<FounderPortraitProps> = ({
  size = 'md',
  className = '',
  realSrc = '/founder.jpg',
}) => {
  const [errored, setErrored] = useState(false);
  const px = SIZE_PX[size];
  const src = errored ? '/brand/founder-fallback.svg' : realSrc;

  return (
    <img
      src={src}
      width={px}
      height={px}
      loading="lazy"
      decoding="async"
      onError={() => setErrored(true)}
      alt="Emre Can Yalçın — Founder & Chief Strategist, EcyPro Premium Consulting"
      className={`rounded-2xl object-cover ${className}`}
      style={{ width: px, height: px }}
      data-testid="founder-portrait"
    />
  );
};
