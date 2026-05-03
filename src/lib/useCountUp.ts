import { useState, useEffect } from 'react';

interface UseCountUpProps {
  end: number;
  duration?: number;
  start?: number;
  delay?: number;
}

export const useCountUp = ({ end, duration = 2000, start = 0, delay = 0 }: UseCountUpProps) => {
  const [count, setCount] = useState(start);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setCount(end);
      return;
    }

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;

      // Ease-out expo function
      const easeOutExpo = (x: number): number => {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
      };

      if (progress < duration) {
        const percentage = progress / duration;
        const currentCount = Math.floor(start + (end - start) * easeOutExpo(percentage));
        setCount(currentCount);
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    const timeoutId = window.setTimeout(() => {
      animationFrameId = requestAnimationFrame(animate);
    }, delay);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [end, duration, start, delay]);

  return count;
};
