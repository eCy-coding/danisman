import React, { useEffect, useRef } from 'react';
import { useMotionValue, useSpring, useTransform, motion, useReducedMotion } from 'motion/react';
import { useInView } from 'motion/react';

interface NumberTickerProps {
  value: number;
  suffix?: string;
  prefix?: string;
  decimalPlaces?: number;
  className?: string;
  delay?: number;
}

export const NumberTicker: React.FC<NumberTickerProps> = ({
  value,
  suffix = '',
  prefix = '',
  decimalPlaces = 0,
  className = '',
  delay = 0,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  const motionVal = useMotionValue(0);
  const springVal = useSpring(motionVal, {
    damping: 60,
    stiffness: 100,
  });
  const displayVal = useTransform(
    springVal,
    (v) => `${prefix}${v.toFixed(decimalPlaces)}${suffix}`,
  );

  useEffect(() => {
    if (!isInView) return;
    const timeout = setTimeout(() => {
      motionVal.set(value);
    }, delay);
    return () => clearTimeout(timeout);
  }, [isInView, motionVal, value, delay]);

  if (prefersReducedMotion) {
    return (
      <span ref={ref} className={className}>
        {prefix}
        {value.toFixed(decimalPlaces)}
        {suffix}
      </span>
    );
  }

  return (
    <motion.span ref={ref} className={className}>
      {displayVal}
    </motion.span>
  );
};
