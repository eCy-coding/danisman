/**
 * ScrollProgressBar — Makale Okuma İlerleme Çubuğu
 * istek5.txt Phase 2: UI/UX — Reading Progress (Blog/Case Studies)
 *
 * - Viewport scroll pozisyonunu takip eder
 * - targetRef prop: izlenecek içerik container ref (yoksa document.body)
 * - Sabit top: Navbar'ın hemen altına (66px offset)
 * - motion/react spring animasyonu (yavaş geri, hızlı ileri)
 * - A11y: role="progressbar" aria-valuenow
 * - Kullanım: <ScrollProgressBar />   (blog ve makale sayfalarında)
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

interface ScrollProgressBarProps {
  contentRef?: React.RefObject<HTMLElement | null>;
  color?: string;
  thickness?: number;
  topOffset?: number;
}

export const ScrollProgressBar: React.FC<ScrollProgressBarProps> = ({
  contentRef,
  color = 'var(--color-secondary, #2563EB)',
  thickness = 3,
  topOffset = 64,
}) => {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const calcProgress = (): void => {
      const el = contentRef?.current ?? document.documentElement;
      const scrollTop = window.scrollY;
      const docHeight = el.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
      setProgress(pct);
    };

    const onScroll = (): void => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(calcProgress);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    calcProgress(); // Initial
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [contentRef]);

  return (
    <div
      className="fixed left-0 right-0 z-50 pointer-events-none"
      style={{ top: topOffset }}
      data-testid="scroll-progress-bar"
    >
      <motion.div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
        aria-label="Okuma ilerlemesi"
        style={{
          height: thickness,
          background: color,
          width: `${progress}%`,
          boxShadow: `0 0 8px 1px ${color}60`,
          borderRadius: '0 2px 2px 0',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      />
    </div>
  );
};
