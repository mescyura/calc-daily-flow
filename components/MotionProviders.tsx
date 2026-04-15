"use client";

import { AnimatePresence, MotionConfig, type Transition } from "framer-motion";
import { usePathname } from "next/navigation";

export function PageMotion({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const transition: Transition = {
    type: "spring",
    stiffness: 380,
    damping: 38,
    mass: 0.6,
  };

  return (
    <MotionConfig reducedMotion="user" transition={transition}>
      <AnimatePresence mode="wait" initial={false}>
        <div key={pathname}>{children}</div>
      </AnimatePresence>
    </MotionConfig>
  );
}

