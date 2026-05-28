import React, { useEffect, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { cn } from '@/lib/utils';

interface ReadingProgressBarProps {
  className?: string;
}

export function ReadingProgressBar({ className }: ReadingProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const updateProgress = useCallback(() => {
    const articleBody = document.querySelector('.article-body');
    if (!articleBody) {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
      setProgress(pct);
      setShowBackToTop(pct > 50);
      return;
    }

    const rect = articleBody.getBoundingClientRect();
    const articleHeight = articleBody.scrollHeight;
    const scrolled = Math.max(0, -rect.top);
    const pct = Math.min(100, (scrolled / articleHeight) * 100);
    setProgress(pct);
    setShowBackToTop(pct > 50);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();
    return () => window.removeEventListener('scroll', updateProgress);
  }, [updateProgress]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'instant' : 'smooth' });
  };

  return (
    <div
      className={cn('fixed top-16 left-0 right-0 z-40', className)}
      data-testid="reading-progress-bar"
    >
      <div className="h-[3px] bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-amber-600 transition-[width] duration-100"
          style={{ width: `${progress}%` }}
          data-testid="progress-fill"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          role="progressbar"
          aria-label="Okuma ilerlemesi"
        />
      </div>

      {showBackToTop && (
        <motion.button
          initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 flex items-center gap-fib-3 rounded-full bg-amber-500 px-fib-5 py-fib-4 text-sm font-medium text-white shadow-lg hover:bg-amber-600 active:scale-95 transition-colors"
          data-testid="back-to-top-button"
          aria-label="Sayfanın başına dön"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
          Başa dön
        </motion.button>
      )}
    </div>
  );
}
