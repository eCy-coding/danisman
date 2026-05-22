/**
 * P51.1 — Founder Portrait with graceful fallback.
 *
 * 1. /founder.jpg (gerçek portre — kullanıcı upload edince)
 * 2. /brand/founder-fallback.svg (P48 brand SVG initials portrait)
 *
 * <picture> element ile srcset, AVIF/WebP variants opsiyonel.
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('common');
  const [errored, setErrored] = useState(false);
  const px = SIZE_PX[size];
  const src = errored ? '/brand/founder-fallback.svg' : realSrc;

  // Keep alt before onError below: the static a11y audit regex halts at the
  // arrow function's closing bracket, so an alt placed after onError is missed.
  return (
    <img
      src={src}
      width={px}
      height={px}
      loading="lazy"
      decoding="async"
      alt={t('founder_portrait_alt')}
      onError={() => setErrored(true)}
      className={`rounded-2xl object-cover ${className}`}
      style={{ width: px, height: px }}
      data-testid="founder-portrait"
    />
  );
};
