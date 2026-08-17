import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative h-full w-full"
    >
      <motion.span
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-40 h-[2px] bg-gradient-to-r from-transparent via-medical-cyan to-transparent"
        style={{ boxShadow: "0 0 18px rgba(34,211,238,0.85)" }}
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: "100vh", opacity: [1, 1, 0] }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      />
      {children}
    </motion.div>
  );
}
