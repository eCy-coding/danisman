import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'motion/react';

interface MouseGlowProps {
  color?: string;
  size?: number;
  blur?: number;
  opacity?: number;
}

export const MouseGlow: React.FC<MouseGlowProps> = ({
  color = 'rgba(56, 189, 248, 0.15)', // Default to primary/15
  size = 600,
  blur = 150,
  opacity = 1,
}) => {
  const [isHovering, setIsHovering] = useState(false);

  // Use springs for smooth following
  const springConfig = { damping: 25, stiffness: 150, mass: 0.5 };
  const smoothX = useSpring(0, springConfig);
  const smoothY = useSpring(0, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      smoothX.set(e.clientX - size / 2);
      smoothY.set(e.clientY - size / 2);
      
      if (!isHovering) setIsHovering(true);
    };

    const handleMouseLeave = () => {
      setIsHovering(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [smoothX, smoothY, size, isHovering]);

  return (
    <motion.div
      className="pointer-events-none fixed z-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
        x: smoothX,
        y: smoothY,
        opacity: isHovering ? opacity : 0,
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: isHovering ? opacity : 0 }}
      transition={{ duration: 0.5 }}
    />
  );
};
