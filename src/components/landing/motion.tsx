"use client";

import { LazyMotion, domAnimation, MotionConfig } from "motion/react";
import type { ReactNode } from "react";

/**
 * Bungkus animasi:
 * - LazyMotion (memuat fitur animasi lazy, hemat ~30kb).
 * - MotionConfig reducedMotion="user" -> hormati prefers-reduced-motion (WCAG 2.3.3).
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
