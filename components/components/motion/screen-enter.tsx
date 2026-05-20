"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ReactNode } from "react";
import { pageTransitionVariants } from "@/lib/motion";

type ScreenEnterProps = {
  children: ReactNode;
  className?: string;
};

/** Subtle screen entrance — fade + small Y; respects reduced motion */
export function ScreenEnter({ children, className }: ScreenEnterProps) {
  const reduced = useReducedMotion() ?? false;

  return (
    <motion.div
      className={className}
      variants={pageTransitionVariants(reduced)}
      initial="hidden"
      animate="visible"
    >
      {children}
    </motion.div>
  );
}
