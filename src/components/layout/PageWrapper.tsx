import React from 'react';
import { motion, Transition } from 'motion/react';

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 10,
    filter: 'blur(4px)',
  },
  in: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
  },
  out: {
    opacity: 0,
    y: -10,
    filter: 'blur(4px)',
  },
};

const pageTransition: Transition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3,
};

export const PageWrapper: React.FC<PageWrapperProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={`min-h-screen ${className}`}
    >
      {children}
    </motion.div>
  );
};
