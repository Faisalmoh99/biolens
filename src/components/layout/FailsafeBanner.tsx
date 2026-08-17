import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";

import { loadPrecache } from "@/lib/precache";

const DISMISS_AFTER_MS = 8000;

export function FailsafeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onError() {
      const cached = loadPrecache();
      if (!cached) return; // only surface when cached fallback is real
      setVisible(true);
    }
    window.addEventListener("biolens:gemini-error", onError as EventListener);
    return () =>
      window.removeEventListener(
        "biolens:gemini-error",
        onError as EventListener,
      );
  }, []);

  useEffect(() => {
    if (!visible) return;
    const id = window.setTimeout(() => setVisible(false), DISMISS_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto fixed left-1/2 top-20 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.25)] backdrop-blur-md"
          role="status"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>AI service degraded — using cached responses</span>
          <button
            type="button"
            onClick={() => setVisible(false)}
            aria-label="Dismiss"
            className="ms-1 rounded-full p-0.5 text-amber-200/70 transition-colors hover:bg-amber-500/10 hover:text-amber-100"
          >
            <X className="h-3 w-3" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
