import React from 'react';
import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

interface TextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  immediate?: boolean; // skip useInView + opacity:0 for above-fold LCP elements
}

export const TextReveal: React.FC<TextRevealProps> = ({
  text,
  className = '',
  delay = 0,
  immediate = false,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-10% 0px' });

  const container = {
    hidden: { opacity: immediate ? 1 : 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.025, delayChildren: immediate ? 0 : delay * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        damping: 14,
        stiffness: 120,
      },
    },
    hidden: {
      opacity: immediate ? 1 : 0,
      y: immediate ? 10 : 20,
    },
  };

  // Split text into words, then optionally into characters if needed.
  // We'll do words for a cleaner effect on large headings.
  const words = text.split(' ');

  // For above-fold LCP elements: render as plain text immediately (no opacity:0 / y offset)
  // This ensures LCP is measured at React mount time, not after animation completes
  if (immediate) {
    return (
      <span style={{ display: 'inline-block' }} className={className}>
        {text}
      </span>
    );
  }

  return (
    <motion.span
      ref={ref}
      style={{ overflow: 'hidden', display: 'inline-block' }}
      variants={container}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      className={className}
    >
      {words.map((word, index) => (
        <motion.span
          variants={child}
          style={{ marginRight: '0.25em', display: 'inline-block' }}
          key={index}
        >
          {word}
        </motion.span>
      ))}
    </motion.span>
  );
};
