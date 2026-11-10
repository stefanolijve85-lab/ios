"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

/** Laat inhoud zacht verschijnen zodra het in beeld komt. */
export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "li" | "span" | "p" | "h2";
}) {
  const M = motion[as];
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, delay, ease: [0.22, 0.8, 0.24, 1] }}
    >
      {children}
    </M>
  );
}
