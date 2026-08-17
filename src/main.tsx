import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "leaflet/dist/leaflet.css";

import "./i18n";
import "./index.css";
import App from "./App.tsx";
import { Toaster } from "@/components/ui/sonner";
import { enrollAll } from "@/lib/enrollment";
import {
  hydrateStoresFromPrecache,
  isPrecacheFresh,
  loadPrecache,
  loadStaticPrecache,
  setCacheSource,
} from "@/lib/precache";

// Fire-and-forget pre-warm so embeddings are ready by the time the user reaches /scan.
enrollAll().catch((err) => {
  console.warn("[BioLens] enrollment pre-warm failed:", err);
});

// Hydrate AI caches so demo screens render instantly without hitting Gemini.
// Priority: fresh localStorage precache → static shipped JSON → no cache (live calls).
async function hydrateOnBoot() {
  // 1. Fresh localStorage precache wins
  const cached = loadPrecache();
  if (cached && isPrecacheFresh(cached)) {
    hydrateStoresFromPrecache(cached);
    setCacheSource("memory");
    return;
  }
  // 2. Static precache shipped with build
  const staticData = await loadStaticPrecache();
  if (staticData) {
    hydrateStoresFromPrecache(staticData);
    setCacheSource("static");
    // Also write to localStorage so DirectorMode shows it as
    // the current cache and exports work
    try {
      localStorage.setItem("biolens-precache-v1", JSON.stringify(staticData));
    } catch {
      /* storage full or disabled */
    }
    return;
  }
  // 3. No cache available; app will call Gemini on demand
  setCacheSource("none");
}
hydrateOnBoot().catch(() => {});

// Warm Web Speech voices so getVoices() returns entries by the time we need them.
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.onvoiceschanged = () => {};
  window.speechSynthesis.getVoices();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster />
    </BrowserRouter>
  </StrictMode>,
);
