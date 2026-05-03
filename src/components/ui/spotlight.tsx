import React, { useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface SpotlightProps {
  className?: string;
  fill?: string;
}

export const Spotlight: React.FC<SpotlightProps> = ({
  className = '',
  fill = 'rgba(37, 99, 235, 0.15)',
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current || prefersReducedMotion) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    divRef.current.style.setProperty('--x', `${x}px`);
    divRef.current.style.setProperty('--y', `${y}px`);
  };

  if (prefersReducedMotion) {
    return null;
  }

  return (
    <motion.div
      ref={divRef}
      onMouseMove={handleMouseMove}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      style={{
        background: `radial-gradient(600px circle at var(--x, 50%) var(--y, 50%), ${fill}, transparent 80%)`,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    />
  );
};
