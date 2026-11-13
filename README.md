# BioLens

Iris-based emergency identification for the busiest medical season on Earth.

BioLens is a prototype built for the Hajj season, when over 147,000
medical services are delivered to pilgrims from more than 180 countries. Many
arrive unconscious, without ID, speaking a language the medic doesn't share.
BioLens identifies them from an iris scan in under three seconds, surfaces the
three life-saving facts a clinician needs first, and generates a SOAP note for
clean handoff.

## Tech stack

- **React 19 + TypeScript + Vite** — UI shell
- **Framer Motion** — cinematic transitions
- **Tailwind CSS + shadcn/ui (Radix)** — design system
- **Zustand** — app state and AI response cache
- **i18next** — Arabic/English (more languages in real-time)
- **MediaPipe Tasks Vision** — on-device iris landmark detection
- **TensorFlow.js MobileNet** — iris embedding extraction
- **Cosine similarity** — match enrolled vs. live embeddings
- **Google Gemini 2.5 (Flash + Pro)** — AI filtering, triage context, SOAP
  generation, translation
- **react-router-dom** — routing
- **sonner** — toasts

## How to run

```bash
npm install
# Set up env vars
cp .env.example .env   # then fill VITE_GEMINI_API_KEY=...
npm run dev
```

Required environment variables:

- `VITE_GEMINI_API_KEY` — Google Generative AI key (direct mode)
- Optional: `VITE_USE_WORKER_PROXY=true` and `VITE_WORKER_URL=...` if you want
  to route AI calls through the Cloudflare Worker in `/worker`

Build:

```bash
npm run build
npm run preview
```

## Demo flow

1. The splash screen sets the stage — press **Begin Demo** to enter.
2. From Home, hit **Iris Scan**, choose a demo pilgrim, and tap **Identify**.
3. The patient profile shows AI-filtered Top 3 life-saving facts; try **Voice**,
   **Translate**, and **SOAP** to round out the story. **Mass Triage** shows the
   group view with START + Gemini context.

## Director Mode

Presenter-only. Press **Cmd/Ctrl + Shift + D** to toggle. Inside you get:

- Scenario shortcuts (one tap per pilgrim → ready-to-identify)
- Quick nav (Home, Scan, Triage, Reset)
- Speaker notes overlay (route-aware bullets for the presenter)
- Pre-cache builder (one-time pass that captures every AI response so the demo
  runs without live Gemini calls — eats API quota, run sparingly)
- Sound, language, and reset controls

The pre-cache is stored in `localStorage` under `biolens-precache-v1` and
rehydrated automatically on every page load (within 24 hours). If a live AI
call fails during the demo, a small banner surfaces but cached responses keep
playing.

