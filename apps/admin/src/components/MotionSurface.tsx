'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

type MotionSurfaceProps = {
  as?: 'div' | 'section' | 'article' | 'header';
  className?: string;
  children: ReactNode;
  delay?: number;
  duration?: number;
  y?: number;
  scale?: number;
  hoverLift?: number;
  hoverScale?: number;
};

export function MotionSurface({
  as = 'div',
  className,
  children,
  delay = 0,
  duration = 0.42,
  y = 14,
  scale = 0.992,
  hoverLift = 0,
  hoverScale = 1,
}: MotionSurfaceProps) {
  const prefersReducedMotion = useReducedMotion() ?? false;
  const Component =
    as === 'section' ? motion.section : as === 'article' ? motion.article : as === 'header' ? motion.header : motion.div;

  return (
    <Component
      className={className}
      initial={prefersReducedMotion ? false : { opacity: 0, y, scale }}
      whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={prefersReducedMotion ? {} : { y: hoverLift, scale: hoverScale }}
    >
      {children}
    </Component>
  );
}
