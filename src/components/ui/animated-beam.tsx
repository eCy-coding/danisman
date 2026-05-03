import React, { useEffect, useId, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface AnimatedBeamProps {
  containerRef: React.RefObject<HTMLElement>;
  fromRef: React.RefObject<HTMLElement>;
  toRef: React.RefObject<HTMLElement>;
  curvature?: number;
  className?: string;
  pathColor?: string;
  pathWidth?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  duration?: number;
  delay?: number;
  reverse?: boolean;
}

interface PathCoords {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  cx: number;
  cy: number;
}

const calcPath = (
  containerRef: React.RefObject<HTMLElement>,
  fromRef: React.RefObject<HTMLElement>,
  toRef: React.RefObject<HTMLElement>,
  curvature: number
): PathCoords | null => {
  if (!containerRef.current || !fromRef.current || !toRef.current) return null;
  const containerRect = containerRef.current.getBoundingClientRect();
  const fromRect = fromRef.current.getBoundingClientRect();
  const toRect = toRef.current.getBoundingClientRect();

  const sx = fromRect.left - containerRect.left + fromRect.width / 2;
  const sy = fromRect.top - containerRect.top + fromRect.height / 2;
  const tx = toRect.left - containerRect.left + toRect.width / 2;
  const ty = toRect.top - containerRect.top + toRect.height / 2;
  const cx = (sx + tx) / 2;
  const cy = (sy + ty) / 2 - curvature;

  return { sx, sy, tx, ty, cx, cy };
};

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({
  containerRef,
  fromRef,
  toRef,
  curvature = 75,
  className = '',
  pathColor = 'rgba(37, 99, 235, 0.2)',
  pathWidth = 2,
  gradientStartColor = '#2563EB',
  gradientStopColor = '#38BDF8',
  duration = 3,
  delay = 0,
  reverse = false,
}) => {
  const id = useId();
  const gradientId = `beam-gradient-${id.replace(/:/g, '')}`;
  const prefersReducedMotion = useReducedMotion();
  const [coords, setCoords] = useState<PathCoords | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const update = () => {
      setCoords(calcPath(containerRef, fromRef, toRef, curvature));
    };

    update();

    observerRef.current = new ResizeObserver(update);
    if (containerRef.current) observerRef.current.observe(containerRef.current);

    return () => observerRef.current?.disconnect();
  }, [containerRef, fromRef, toRef, curvature]);

  if (!coords) return null;

  const { sx, sy, tx, ty, cx, cy } = coords;
  const pathD = `M ${sx},${sy} Q ${cx},${cy} ${tx},${ty}`;

  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-visible ${className}`}
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        <linearGradient
          id={gradientId}
          gradientUnits="userSpaceOnUse"
          x1={reverse ? tx : sx}
          y1={reverse ? ty : sy}
          x2={reverse ? sx : tx}
          y2={reverse ? sy : ty}
        >
          <stop offset="0%" stopColor={gradientStartColor} stopOpacity="0" />
          <stop offset="50%" stopColor={gradientStartColor} />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        fill="none"
      />

      {!prefersReducedMotion && (
        <motion.path
          d={pathD}
          stroke={`url(#${gradientId})`}
          strokeWidth={pathWidth + 1}
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: [0, 1, 0] }}
          transition={{
            pathLength: { duration, delay, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop' },
            opacity: { duration, delay, ease: 'easeInOut', repeat: Infinity, repeatType: 'loop' },
          }}
        />
      )}
    </svg>
  );
};
