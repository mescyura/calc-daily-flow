"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

let bodyLockCount = 0;
let prevOverflow: string | null = null;
let prevPaddingRight: string | null = null;

export function Modal(props: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  overlayClassName?: string;
  panelClassName?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!mounted) return;
    if (!props.open) return;
    if (typeof document === "undefined") return;

    const body = document.body;
    bodyLockCount += 1;

    if (bodyLockCount === 1) {
      prevOverflow = body.style.overflow;
      prevPaddingRight = body.style.paddingRight;

      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
      body.style.overflow = "hidden";
    }

    return () => {
      bodyLockCount = Math.max(0, bodyLockCount - 1);
      if (bodyLockCount === 0) {
        body.style.overflow = prevOverflow ?? "";
        body.style.paddingRight = prevPaddingRight ?? "";
        prevOverflow = null;
        prevPaddingRight = null;
      }
    };
  }, [mounted, props.open]);

  if (!mounted) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {props.open ? (
        <motion.div
          className={
            props.overlayClassName ??
            "fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 backdrop-blur-sm sm:px-6"
          }
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) props.onClose();
          }}
        >
          <motion.div
            className={
              props.panelClassName ??
              "w-full max-w-md max-h-[85vh] overflow-auto rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl ring-1 ring-black/10 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-white/10"
            }
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {props.children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}

