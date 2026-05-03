import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

export interface CardProps extends HTMLMotionProps<"div"> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glass?: boolean;
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', padding = 'md', glass = true, interactive = false, children, ...props }, ref) => {
    const baseStyles = 'rounded-2xl border transition-all duration-300';
    const glassStyles = glass ? 'bg-white/5 backdrop-blur-3xl border-white/10 shadow-2xl' : 'bg-surface border-white/5';
    
    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8 lg:p-10',
    };

    return (
      <motion.div 
        ref={ref} 
        className={`${baseStyles} ${glassStyles} ${paddings[padding]} ${className}`} 
        whileHover={interactive ? { y: -5, boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" } : {}}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`flex flex-col space-y-1.5 ${className || ''}`} {...props} />
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={`font-semibold leading-none tracking-tight ${className || ''}`} {...props} />
  )
);
CardTitle.displayName = "CardTitle";

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={`pt-0 ${className || ''}`} {...props} />
  )
);
CardContent.displayName = "CardContent";

Card.displayName = 'Card';
