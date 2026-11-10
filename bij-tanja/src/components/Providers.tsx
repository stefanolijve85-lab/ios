"use client";
import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/** Respecteert automatisch "minder beweging" van het besturingssysteem. */
export function Providers({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
