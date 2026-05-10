/**
 * PageLoadingBar — Route Geçiş İlerleme Çubuğu
 *
 * - useLocation() ile route değişimini algılar (BrowserRouter uyumlu)
 * - Geçiş başında 0→90% hızlı, sonra otomatik tamamlanır
 * - Renk: secondary (marka rengi) glow efektiyle
 */

import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export const PageLoadingBar: React.FC = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevKey = useRef(location.key);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hideRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Only trigger on actual navigation (key change)
    if (location.key === prevKey.current) return;
    prevKey.current = location.key;

    // Clear any running timers
    if (tickRef.current) clearInterval(tickRef.current);
    if (hideRef.current) clearTimeout(hideRef.current);

    // Start bar
    setProgress(0);
    setVisible(true);

    tickRef.current = setInterval(() => {
      setProgress((p) => {
        if (p < 70) return p + 10;
        if (p < 90) return p + 1;
        return p;
      });
    }, 60);

    // Auto-complete after ~400ms (route renders fast)
    hideRef.current = setTimeout(() => {
      if (tickRef.current) clearInterval(tickRef.current);
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 300);
    }, 400);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      if (hideRef.current) clearTimeout(hideRef.current);
    };
  }, [location.key]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="page-loading-bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-[100] h-0.5 pointer-events-none"
          data-testid="page-loading-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label="Sayfa yükleniyor"
        >
          <motion.div
            className="h-full bg-secondary shadow-[0_0_8px_1px] shadow-secondary/60 rounded-r-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
          />
          {/* Glow dot */}
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-secondary shadow-[0_0_12px_3px] shadow-secondary/80"
            style={{ left: `${progress}%` }}
            transition={{ duration: 0.1, ease: 'easeOut' }}
            aria-hidden="true"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
