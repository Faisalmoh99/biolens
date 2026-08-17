import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, X } from "lucide-react";

import { useAppStore } from "@/store/appStore";
import { getSpeakerNoteForRoute } from "@/lib/speaker-notes";

export function SpeakerNotes() {
  const location = useLocation();
  const directorMode = useAppStore((s) => s.directorMode);
  const show = useAppStore((s) => s.showSpeakerNotes);
  const setShow = useAppStore((s) => s.setShowSpeakerNotes);

  if (!directorMode) return null;

  const note = getSpeakerNoteForRoute(location.pathname);

  return (
    <AnimatePresence>
      {show && note && (
        <motion.aside
          key={location.pathname}
          initial={{ opacity: 0, x: 30, y: 0 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 30 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto fixed bottom-6 right-6 z-[60] w-[350px] rounded-xl border border-medical-cyan/60 bg-medical-deep/85 p-4 text-sm shadow-[0_0_45px_rgba(34,211,238,0.35)] backdrop-blur-md"
          role="region"
          aria-label="Speaker notes"
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-medical-glow" />
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-medical-glow">
                {note.title}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShow(false)}
              aria-label="Close speaker notes"
              className="rounded-full p-1 text-medical-glow/70 transition-colors hover:bg-medical-cyan/10 hover:text-medical-glow"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <ul className="space-y-1.5 text-[13px] leading-relaxed text-medical-glow/90">
            {note.bullets.map((b, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-medical-glow/80" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-medical-cyan/20 pt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-medical-cyan/50">
            {location.pathname}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
