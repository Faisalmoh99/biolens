# BioLens — Project Reference

A single-document handoff for the entire BioLens codebase. Every claim in this document is verifiable from the files cited; where intent and reality diverged, a note is left in the section.

---

## 1. Project Identity

- **Name:** BioLens
- **Tagline (from `src/i18n/locales/en.json`):** "Emergency pilgrim identification system" (`app.tagline`). The Splash screen also surfaces `splash.tagline` = "Hajj Emergency Identification" and the README subtitle "Iris-based emergency identification for the busiest medical season on Earth."
- **Project type:** Demo prototype (not production software).
- **Target user:** Field paramedics / emergency medical responders working the Hajj season in Saudi Arabia.
- **The problem it solves:** During Hajj the Saudi medical system delivers over 147,000 medical services to pilgrims from 180+ countries. Many present unconscious, without identification, speaking a language the responder does not share. BioLens proposes iris biometrics + AI to identify the patient in under 3 seconds, surface the three most life-saving facts (allergies, medications, conditions), and produce a clean clinical handoff.
- **Context:** Demo-focused, single-machine, single-presenter. Not intended for clinical use.

---

## 2. The Problem Statement

Hajj is the largest annual mass-gathering medical operation on the planet: roughly 1.8M pilgrims over two weeks, 147,000+ medical services delivered each year, drawn from 180+ nationalities. A meaningful share of those services involve unconscious, semi-conscious, or non-verbal patients — heat-related collapse, cardiac events, asthma exacerbations, hypoglycemia, trauma at Jamarat. In every one of those cases, the paramedic on scene starts blind. They cannot ask the patient their name. They cannot ask what they're allergic to. They cannot read the home-country medical record the patient never brought, written in a language they probably don't read.

Current workflow is, charitably, a paper card in a pocket — frequently lost, often non-existent. The Hajj permit number on a wristband ties to administrative records, not clinical ones. Phone unlock is impossible on an unresponsive patient. Even when family is present, language barriers (Indonesian, Urdu, Hausa, Turkish, Arabic) and panic compress the useful information exchange to seconds.

BioLens's proposal: the iris is uniquely identifying, accessible without consent on an unconscious patient (eyes are involuntarily open or easily lifted), and stable across decades. If pilgrims enroll once (at visa issuance or arrival), every Hajj medic can later identify them from a 3-second camera scan, pull their home-country record, and have an LLM surface only the facts that matter in the next 60 seconds. Translation, START-protocol triage, drug-interaction checks, and SOAP-note authoring all become AI-augmented steps in the same flow. None of this is novel science; the demo's point is that the pieces — MediaPipe iris landmarking, TF.js embeddings, Gemini 2.5 structured output, openFDA — are all client-runnable today.

---

## 3. The Solution at a Glance

```
Splash (/)
   │
   ▼
Home (/home) ─────────────────────────────────────────────────┐
   │                                                          │
   ▼                                                          │
Scan (/scan)                                                  │
   │  camera → MediaPipe FaceLandmarker (iris 468–477)        │
   │  → TF.js MobileNet v2 embedding                          │
   │  → cosine similarity vs. 5 enrolled refs                 │
   │  → MatchResult                                           │
   ▼                                                          │
Patient Profile (/patient/:id)                                │
   │  fetchPatient(id) → JSON                                 │
   │  Gemini 2.5 Flash → Top 3 Life-Saving Facts              │
   │                                                          │
   │  Actions on profile:                                     │
   │   • Voice  (Web Speech API, ar-SA / en-US)               │
   │   • Translate (Gemini Flash, JSON-preserving)            │
   │   • SOAP   (Gemini 2.5 Pro, 4 sections, print-ready)     │
   │   • Drug Check (openFDA + Gemini 2.5 Pro)                │
   ▼                                                          │
Triage Group (/triage) ◄──────────────────────────────────────┘
   │  START Protocol (deterministic) per patient
   │  Gemini 2.5 Pro context layer → finalColor + 3 actions
   │  Sorted red → green
   ▼
Map (/map)  ·  Dashboard (/dashboard)
```

The full feature surface fans out from those routes; see §6 for the inventory.

---

## 4. Tech Stack (exact versions)

Versions are from `package.json` (root) and `worker/package.json`. `^` and `~` are shown verbatim.

### Runtime dependencies

| Domain | Package | Version |
|---|---|---|
| Framework | `react` | ^19.2.6 |
| Framework | `react-dom` | ^19.2.6 |
| Routing | `react-router-dom` | ^7.15.0 |
| Build/dev | `vite` | ^8.0.12 (devDep) |
| TS | `typescript` | ~6.0.2 (devDep) |
| Styling | `tailwindcss` | ^3.4.19 (devDep) |
| Styling | `tailwindcss-animate` | ^1.0.7 (devDep) |
| Styling | `class-variance-authority` | ^0.7.1 |
| Styling | `clsx` | ^2.1.1 |
| Styling | `tailwind-merge` | ^3.6.0 |
| Animation | `framer-motion` | ^12.38.0 |
| Theme | `next-themes` | ^0.4.6 |
| Icons | `lucide-react` | ^1.16.0 |
| Toast | `sonner` | ^2.0.7 |
| UI (Radix primitives) | `@radix-ui/react-avatar` | ^1.1.11 |
| UI | `@radix-ui/react-dialog` | ^1.1.15 |
| UI | `@radix-ui/react-progress` | ^1.1.8 |
| UI | `@radix-ui/react-scroll-area` | ^1.2.10 |
| UI | `@radix-ui/react-separator` | ^1.1.8 |
| UI | `@radix-ui/react-slot` | ^1.2.4 |
| UI | `@radix-ui/react-toggle` | ^1.1.10 |
| UI | `@radix-ui/react-tooltip` | ^1.2.8 |
| State | `zustand` | ^5.0.13 |
| i18n | `i18next` | ^26.1.0 |
| i18n | `react-i18next` | ^17.0.7 |
| i18n | `i18next-browser-languagedetector` | ^8.2.1 |
| Computer vision | `@mediapipe/tasks-vision` | ^0.10.35 |
| ML embeddings | `@tensorflow/tfjs` | ^4.22.0 |
| ML embeddings | `@tensorflow-models/mobilenet` | ^2.1.1 |
| LLM client | `@google/generative-ai` | ^0.24.1 |
| Maps | `leaflet` | ^1.9.4 |
| Maps | `react-leaflet` | ^5.0.0 |
| Maps (heatmap) | `leaflet.heat` | ^0.2.0 |

### Dev / build only

| Package | Version |
|---|---|
| `@eslint/js` | ^10.0.1 |
| `eslint` | ^10.3.0 |
| `eslint-plugin-react-hooks` | ^7.1.1 |
| `eslint-plugin-react-refresh` | ^0.5.2 |
| `typescript-eslint` | ^8.59.2 |
| `globals` | ^17.6.0 |
| `autoprefixer` | ^10.5.0 |
| `postcss` | ^8.5.14 |
| `@vitejs/plugin-react` | ^6.0.1 |
| `@types/react` | ^19.2.14 |
| `@types/react-dom` | ^19.2.3 |
| `@types/leaflet` | ^1.9.21 |
| `@types/node` | ^24.12.4 |

### External (non-npm) data sources

- **openFDA Drug Label API** — `https://api.fda.gov/drug/label.json` (`src/lib/openfda.ts`).
- **MediaPipe face_landmarker model** — `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task` (loaded at runtime, `src/lib/mediapipe.ts`).
- **MediaPipe WASM** — `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm`.
- **Google Generative AI** — `gemini-2.5-flash` and `gemini-2.5-pro` (`src/lib/gemini.ts`).
- **CARTO dark basemap tiles** — `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png` (`src/pages/CasesMap.tsx`).
- **Google Fonts** — Inter + Cairo (`src/index.css`).
- Pilgrim portraits are rendered as initials-based avatars (`src/components/patient/PilgrimAvatar.tsx`) — no external image service.

### Worker stack (Cloudflare, optional)

| Package | Version |
|---|---|
| `wrangler` | ^3 (devDep) |
| `@cloudflare/workers-types` | ^4 (devDep) |

### Browser-platform APIs used directly

- `navigator.mediaDevices.getUserMedia` (camera, `src/hooks/useCamera.ts`)
- `window.AudioContext` / `webkitAudioContext` (Web Audio, `src/lib/sounds.ts` and `src/pages/Splash.tsx`)
- `window.speechSynthesis` (Web Speech, `src/hooks/useVoiceOutput.ts` and `src/main.tsx`)
- `localStorage` (state persistence for sound, language, enrollment, openFDA cache, precache)
- `requestAnimationFrame` (iris detection loop)

---

## 5. Architecture Overview

### Client-only

There is no application backend. The build artifact is a static SPA. Every interactive feature — biometric pipeline, AI calls, drug data, persistence — runs in the browser or makes a direct call to a third-party API. The `worker/` directory contains a Cloudflare Worker scaffold that would, if deployed, proxy Gemini calls so the API key isn't bundled. Its README states explicitly: "Status: scaffold only. Not deployed. Direct frontend calls are used in dev." The frontend has a code path for that mode (`USE_WORKER`/`WORKER_URL` env flags in `src/lib/gemini.ts`); flipping it on is a deployment decision, not a code change.

### Data sources

- **Pilgrim records:** 5 static JSON files in `public/data/pilgrims/` plus `_index.json`. Loaded by `src/lib/patients.ts` (`fetchPatient`, `fetchAllPatients`).
- **Iris references:** `public/data/iris_embeddings.json` exists but is an empty JSON array (`[]`). The real reference path the code tries is `/data/iris_refs/<pilgrim_id>.jpg` (`src/lib/enrollment.ts`), and when those files are missing — which is the case in the working tree — enrollment falls back to procedurally generated synthetic iris images (`src/lib/iris-refs.ts → generateSyntheticIris`). See §16.
- **Drug data:** openFDA, fetched on demand, cached in `localStorage` under `biolens-openfda-cache-v2` for 7 days (`src/lib/openfda.ts`).
- **AI knowledge:** Gemini 2.5 Flash + Pro, called directly from the browser (or via the optional Worker proxy).

### AI integration

All AI access flows through `src/lib/gemini.ts`:
- `generateStructured<T>(system, user, schema, opts)` is the canonical entrypoint. It uses Gemini's `responseMimeType: "application/json"` + `responseSchema` so the model returns JSON conforming to a typed schema.
- `generateText(system, user, opts)` is used only for `translateFacts` (which sends a JSON blob in the prompt and expects JSON back, but can't use `responseSchema` because the response shape echoes a runtime payload).
- Every call increments `useAppStore.geminiCallCount` (drives the Dashboard widget).
- Errors emit a `biolens:gemini-error` `CustomEvent` on `window`; `FailsafeBanner` listens for it.
- Two retries with exponential backoff (400ms × 2^attempt). Errors with `retryable: false` (currently only `code: "auth"` from the worker path) short-circuit.

### Persistence (all `localStorage`)

| Key | Owner | Purpose |
|---|---|---|
| `biolens-lang` | `src/i18n/index.ts` | Selected language (`ar` or `en`). |
| `biolens-sound` | `src/store/appStore.ts` | Sound preference. |
| `biolens-enrolled-embeddings-v1` | `src/lib/enrollment.ts` | The 5 pilgrim embeddings (with `real`/`synthetic` source flag). |
| `biolens-openfda-cache-v2` | `src/lib/openfda.ts` | openFDA label data, 7-day TTL. |
| `biolens-precache-v1` | `src/lib/precache.ts` | Bundled AI responses for offline-safe demo, 24-hour TTL. |

### State

A single Zustand store at `src/store/appStore.ts` holds the runtime state: `language`, `scanMode` (`live`/`demo`), `demoTargetPilgrimId`, `soundEnabled`, `currentPatientId`, four AI caches (`topFactsCache`, `triageDecisions`, `soapCache`, `interactionCache`), a `factsTranslationCache`, `directorMode`, `showSpeakerNotes`, `geminiCallCount`, `matchHistory`, and `sessionStartTime`. The store is the single source of truth for runtime state; `localStorage` mirrors only those entries listed above.

### Routing

`react-router-dom` v7 SPA routing, defined in `src/App.tsx`:

- `/` → `Splash` (no layout chrome)
- `/home` → `Home`
- `/scan` → `Scan`
- `/patient/:id` → `PatientProfile`
- `/triage` → `TriageGroup`
- `/map` → `CasesMap` (lazy)
- `/dashboard` → `Dashboard` (lazy)
- `*` → `NotFound`

`Splash` is outside the `AppLayout` (so it has no header). All other authenticated routes are nested under `<Route element={<AppLayout />}>`. `AnimatePresence` wraps `<Routes>` for page-exit transitions. The `DirectorPanel` and `SpeakerNotes` overlays mount once at the App level.

### Data flow narrative (a single tap on Identify)

1. **Camera:** `useCamera()` requests `getUserMedia({video: {width:1280,height:720,facingMode:"user"}})`.
2. **Landmarking:** `useIrisDetection()` initializes MediaPipe's `FaceLandmarker` (WASM + GPU delegate), runs `detectForVideo` in a `requestAnimationFrame` loop, extracts iris points 468–477.
3. **Lock-on UI:** `IrisOverlay` draws landmarks and the `IrisLockOn` rings on a canvas above the mirrored video. First successful lock triggers `playLockBeep`.
4. **Identify clicked:** `useIrisMatching.run(video, iris)` walks through three stages with intentional delays for screen polish (350ms before extract, 500ms before match):
   - `capturing` → pick the larger iris bbox.
   - `extracting` → `cropToTensor` + `extractEmbedding` (TF.js MobileNet v2 with `embedding=true`).
   - `matching` → `matchEmbedding(query)` does cosine similarity against the 5 enrolled vectors.
5. **Demo mode override:** If `scanMode === "demo"` and a `demoTargetPilgrimId` is set, the result is forced to that pilgrim with a hard-coded baseline similarity (0.928–0.981, see `DEMO_BASELINE_SIMILARITY` in `src/lib/matching.ts`).
6. **Success overlay:** `SuccessOverlay` shows the matched patient preview for 1.5s.
7. **Navigation:** `navigate('/patient/<id>')`. `currentPatientId` is set in the store.
8. **Patient screen:** `fetchPatient(id)` resolves the static JSON. Two effects fire in parallel:
   - Render skeletons until JSON arrives.
   - If `topFactsCache[id]` is empty, call `fetchTopFacts(patient)` → Gemini 2.5 Flash → store the response.
9. **Side panels:** `VoiceButton`, `TranslateButton`, SOAP and Drug-Interactions dialogs sit dormant until activated. Each is independently lazy.

---

## 6. Feature Inventory

### 6.1 Core features

Ten core features, numbered below.

#### 1. Live Iris Detection

- **What it does:** Streams the front camera into a `<video>` element, runs MediaPipe's `FaceLandmarker` model on every animation frame, and draws iris landmarks + lock-on rings on a canvas overlay. Detects when both irises are present and signals "iris locked" to the rest of the app.
- **How it works:** `src/hooks/useCamera.ts` requests `user`-facing video. `src/hooks/useIrisDetection.ts` initializes the `FaceLandmarker` (model URL pinned to the MediaPipe Google Cloud Storage bucket, WASM URL pinned to a jsDelivr `@mediapipe/tasks-vision@0.10.35` build). The detector runs in `VIDEO` mode with `numFaces: 1` and a GPU delegate. `extractIrisData` in `src/lib/mediapipe.ts` reads landmarks 468 (right iris center), 469–472 (right iris ring), 473 (left iris center), 474–477 (left iris ring) and computes a padded bounding box (75% pad on each side). The first transition into a "locked" state fires `playLockBeep`.
- **Key files:** `src/hooks/useCamera.ts`, `src/hooks/useIrisDetection.ts`, `src/lib/mediapipe.ts`, `src/components/iris/IrisScanner.tsx`, `src/components/iris/IrisOverlay.tsx`, `src/components/iris/IrisLockOn.tsx`.
- **AI involvement:** None (purely on-device computer vision).
- **Caching:** The FaceLandmarker instance is a module-level singleton (`landmarkerInstance` + `landmarkerPromise`) so the WASM and model only download once.
- **Where it appears:** `/scan`.

#### 2. Biometric Matching

- **What it does:** Takes the cropped iris region, computes a 1024-dim MobileNet embedding, compares it against 5 enrolled embeddings with cosine similarity, and returns the closest match with an `isMatch` flag.
- **How it works:** `src/lib/tensorflow.ts` loads `@tensorflow-models/mobilenet` (version 2, alpha 1.0) once and reuses it. `cropToTensor` draws the iris bbox onto a 224×224 offscreen canvas and returns a `tf.Tensor3D`. `extractEmbedding` calls `model.infer(tensor, true)` to get the penultimate-layer activations (1024 floats). `src/lib/cosine.ts` implements cosine similarity. `src/lib/matching.ts → matchEmbedding` ranks the 5 enrolled vectors. The match threshold is `MATCH_THRESHOLD = 0.85` (`src/lib/constants.ts`). In `demo` scan mode, the result is forced to the selected `demoTargetPilgrimId` with a hard-coded similarity from `DEMO_BASELINE_SIMILARITY` (range 0.928–0.981).
- **Key files:** `src/lib/tensorflow.ts`, `src/lib/cosine.ts`, `src/lib/matching.ts`, `src/lib/enrollment.ts`, `src/hooks/useIrisMatching.ts`.
- **AI involvement:** None (only client-side ML inference, no LLM).
- **Caching:** `biolens-enrolled-embeddings-v1` in localStorage. `enrollAll()` is fire-and-forget on app boot (`src/main.tsx`). An in-flight singleton prevents duplicate concurrent enrolls.
- **Where it appears:** `/scan` (the "extracting" and "matching" stages).

#### 3. Patient Record Lookup

- **What it does:** Loads a static patient JSON from disk on demand.
- **How it works:** `fetchPatient(id)` in `src/lib/patients.ts` does `fetch('/data/pilgrims/<id>.json')`. `fetchAllPatients` reads `_index.json` and maps through. There is no error handling beyond an exception on non-200 — the caller decides how to render the failure.
- **Key files:** `src/lib/patients.ts`, `public/data/pilgrims/_index.json`, `public/data/pilgrims/pilgrim_001.json` … `pilgrim_005.json`.
- **AI involvement:** None.
- **Caching:** Browser HTTP cache only.
- **Where it appears:** `/patient/:id`, `/triage`, `/scan` (demo picker), `/map`, `/dashboard`.

#### 4. AI Top 3 Life-Saving Facts

- **What it does:** For a given patient, asks Gemini 2.5 Flash to pick the three most critical facts a paramedic must know in the next 60 seconds, with a recommended action for each.
- **How it works:** `fetchTopFacts(patient)` in `src/lib/ai-filtering.ts` calls `generateStructured<LifeSavingFactsResponse>` with `SYSTEM_LIFE_SAVING_FACTS` (from `src/lib/ai-prompts.ts`), a long user prompt assembled from the patient's full record (`buildLifeSavingFactsUserPrompt`), and `lifeSavingFactsSchema` (`src/lib/ai-schemas.ts`). The schema constrains: exactly an array of facts each with `id`, `icon` (enum of 8 icons), `title`, `content`, `criticality` (`high`/`medium`/`low`), and `actionRecommended`, plus a top-level `reasoning` string. Model: `gemini-2.5-flash`, temperature `0.2`.
- **Key files:** `src/lib/ai-filtering.ts`, `src/lib/ai-prompts.ts`, `src/lib/ai-schemas.ts`, `src/lib/gemini.ts`, `src/components/patient/TopThreeFacts.tsx`.
- **Caching:** `appStore.topFactsCache[pilgrimId]`. Once cached for a pilgrim, the profile renders instantly on revisits and translations operate against this cached version.
- **Where it appears:** Top of `/patient/:id` (the red-bordered card). Also surfaced via voice and translation buttons.

#### 5. Patient Profile screen

- **What it does:** Bilingual single-page clinical record showing the patient's identity (Arabic + English name, age, sex, nationality flag, blood type, photo, Hajj permit number), vitals (with out-of-range up/down arrows), allergies (with a pulsing red sweep for life-threatening severity), medications, chronic conditions, surgeries, and emergency contacts. Renders the AI Top 3 above everything else.
- **How it works:** `src/pages/PatientProfile.tsx` orchestrates parallel fetches (patient JSON + Top 3 facts). Each section is a card component under `src/components/patient/`. `SectionReveal` wraps each card in a staggered fade-up using Framer Motion. `VitalsCard` runs `animate(useMotionValue, target)` to count up the numbers from 0; out-of-range values get a critical class and an arrow icon. `AllergiesCard` flags severity `life-threatening` with a pulsing red sweep.
- **Key files:** `src/pages/PatientProfile.tsx`, `src/components/patient/PatientHeader.tsx`, `src/components/patient/VitalsCard.tsx`, `src/components/patient/AllergiesCard.tsx`, `src/components/patient/MedicationsCard.tsx`, `src/components/patient/ConditionsCard.tsx`, `src/components/patient/SurgeriesCard.tsx`, `src/components/patient/EmergencyContactsCard.tsx`, `src/components/patient/SectionCard.tsx`, `src/components/patient/ProfileActions.tsx`, `src/components/patient/TopThreeFacts.tsx`.
- **AI involvement:** Indirect — hosts the AI Top 3, voice, translate, SOAP, and drug-interactions panels.
- **Where it appears:** `/patient/:id`.

#### 6. START Protocol (deterministic triage)

- **What it does:** Applies a simplified START (Simple Triage And Rapid Treatment) protocol to a patient's vitals and returns one of two colors (`red` or `green`) plus a list of `rulesFired`.
- **How it works:** `src/lib/triage.ts → startProtocol(patient)` is a pure function over `patient.demoVitals`. A single GREEN gate: ambulatory + alert + HR 50–110 + RR 10–30 + SpO₂ ≥ 92 + SBP ≥ 90 → green; otherwise the patient is RED and every failing vital is appended to `rulesFired` (cannot walk, AVPU != alert, RR thresholds, SpO₂ < 92, SBP < 90, HR < 50 or > 110, apnea). The `rulesFired` array makes it easy to debug or display the trace.
- **Key files:** `src/lib/triage.ts`.
- **AI involvement:** None (this is the rules layer that the AI step sits on top of).
- **Where it appears:** `/triage` (as the baseline color before AI evaluation) and as input to the AI triage call.

#### 7. AI Triage Context Layer

- **What it does:** Takes the START color and the patient's full record, asks Gemini 2.5 Pro to confirm or adjust the color with a medical justification and three concrete next actions.
- **How it works:** `src/lib/ai-triage.ts → evaluateTriage(patient)`. Calls `startProtocol` synchronously, then `generateStructured<TriageContextDecision>` with `SYSTEM_TRIAGE_CONTEXT` and `buildTriageContextUserPrompt(patient, startColor)`. Schema is `triageContextSchema` and requires `finalColor`, `startProtocolColor`, `confidence` (number), `reasoning`, `immediateActions` (array of strings ≤80 chars each), and `adjustedFromStart` (boolean). Model: `gemini-2.5-pro`, temperature `0.2`. The function returns Gemini's decision verbatim — no post-processing guards.
- **Key files:** `src/lib/ai-triage.ts`.
- **Caching:** `appStore.triageDecisions[pilgrimId]`.
- **Where it appears:** `/triage`, on every `TriageCard`. The "Adjusted from START" badge surfaces when `decision.adjustedFromStart === true`.

#### 8. Triage Group screen

- **What it does:** Mass-casualty view. Lists all 5 pilgrims sorted by severity (red → green). Each card shows the AI's final color, START color, presenting complaint, vitals, AI confidence, three immediate actions, and an "Adjusted from START" badge if relevant. Click a card to drill into that patient's profile.
- **How it works:** `src/pages/TriageGroup.tsx`. Loads all patients, runs `startProtocol` synchronously into a memoized map, fires `evaluateTriage` for every patient that doesn't already have a cached decision — in parallel (`Promise.all` over filtered patients). Per-card loading/error state is local component state. A live clock ticks once a second. A refresh button clears the decisions cache and re-fires. `motion.ul` with `staggerChildren: 0.08` gives the cards a cascading entrance.
- **Key files:** `src/pages/TriageGroup.tsx`, `src/components/triage/TriageCard.tsx`, `src/components/triage/TriageStats.tsx`, `src/components/triage/TriageStatsBar.tsx`, `src/components/ui/triage-badge.tsx`.
- **AI involvement:** Yes — Gemini 2.5 Pro × 5 in parallel.
- **Caching:** Each card hits `appStore.triageDecisions[pilgrimId]` first.
- **Where it appears:** `/triage`.

#### 9. Translation

- **What it does:** Translates the AI-generated Top 3 facts between Arabic and English, in place, preserving the JSON structure.
- **How it works:** `src/lib/translation.ts → translateFacts(facts, targetLang)` serializes the `LifeSavingFactsResponse` to JSON, prepends an augmented system prompt (`SYSTEM_TRANSLATION` + "translate all text fields, preserve structure, keys, and non-text values; output JSON only"), and calls `generateText` (not `generateStructured` — the response shape echoes runtime content; using a schema would conflict with the dynamic field set). Strips ```` ```json ```` fences if Gemini wraps the output. Model: `gemini-2.5-flash`, temperature `0.1`. There is also a generic `translateText(text, sourceLang, targetLang)` that uses `translationSchema` for arbitrary strings, though it is currently not invoked from any component.
- **Key files:** `src/lib/translation.ts`, `src/components/patient/TranslateButton.tsx`.
- **Caching:** `appStore.factsTranslationCache[pilgrimId][langCode]`. Each pilgrim can have an `ar` and an `en` cached translation.
- **Where it appears:** Translate button in `ProfileActions` on `/patient/:id`. The button toggles between original and translation views and shows the appropriate target language label (`translate.lang.ar` / `translate.lang.en`).

#### 10. Voice Output

- **What it does:** Reads the Top 3 facts aloud using the browser's Text-to-Speech engine in the currently displayed language (`ar-SA` or `en-US`). Has a Stop control.
- **How it works:** `src/hooks/useVoiceOutput.ts` wraps `SpeechSynthesisUtterance`. `findVoice(lang)` prefers an exact-locale voice (e.g. `ar-SA`), falls back to the prefix (`ar`). `speakSequence` cancels anything queued, then queues each utterance. `src/main.tsx` warms `speechSynthesis.getVoices()` on app boot so the first call doesn't hit an empty list. `VoiceButton` reads the fact title, content, and action for each of the three facts, with an intro line built from `voice.script.intro`.
- **Key files:** `src/hooks/useVoiceOutput.ts`, `src/components/patient/VoiceButton.tsx`.
- **AI involvement:** None — uses the browser's built-in voices.
- **Where it appears:** Voice button in `ProfileActions` on `/patient/:id`.

### 6.2 Stretch / polish features

#### 1. Cinematic Splash Screen

- **What it does:** Boot-style intro at `/`. Animated big iris (two counter-rotating dashed rings + a radial-gradient iris + a breathing pupil + a particle field), the word "BioLens" types in character by character, an audio "boot sweep" (sine 200→800Hz over 1.5s) plays once, then a CTA "Begin Demo" reveals at ~2.5s with a shimmering shine. Pressing it triggers a 1.3s exit sequence (a horizontal scan sweep across screen + radial darken + scale/blur of content) before navigating to `/home`.
- **How it works:** `src/pages/Splash.tsx`. Particle field uses 36 randomly-seeded vertical-rise particles. The exit sweep is rendered with two stacked `AnimatePresence` motion elements. Enter/Space triggers Begin Demo when the CTA is visible.
- **Why we added this:** First impressions form in seconds. Splash sets the "cinematic medical AI" tone before the rest of the app gets the chance to.
- **Key files:** `src/pages/Splash.tsx`.

#### 2. Scan Cinematic Polish

- **What it does:** A scan screen that looks like the inside of an aircraft HUD: cyan corner brackets, scanning bar, iris lock-on rings, "TARGET ACQUIRED" badge, three distinct stage visuals (a camera shutter for capturing, a neural-net animation for extracting, a scan-bar across enrolled avatars for matching), and a full-screen success overlay with patient preview before navigation.
- **How it works:** `src/components/iris/IrisScanner.tsx` mirrors the video horizontally (front-camera UX), draws corner brackets + a scan-line, surfaces the live mode pill, and switches the bottom-left status pill between "initializing" / "searching" / "locked" with a spring transition. `src/components/iris/MatchingStageVisual.tsx` provides three SVG/Motion compositions per stage. `src/components/iris/SuccessOverlay.tsx` cyan-flashes radially and reveals the patient avatar, name, age, nationality flag, and triage band for 1.5s.
- **Mode controls:** A segmented `Live` / `Demo` pill above the camera (`<motion.span layoutId="scan-mode-pill">` gives the active pill a smooth sliding background). When in Demo, a row of pilgrim avatars below lets the presenter pick which pilgrim to "match." Each avatar shows a triage-color dot.
- **Why we added this:** The bare biometric pipeline produces a tense few-second silence. The visuals turn that into spectacle and give the presenter rhythm.
- **Key files:** `src/components/iris/IrisScanner.tsx`, `src/components/iris/IrisOverlay.tsx`, `src/components/iris/IrisLockOn.tsx`, `src/components/iris/MatchingStageVisual.tsx`, `src/components/iris/SuccessOverlay.tsx`, `src/components/iris/ConfidenceCounter.tsx`, `src/pages/Scan.tsx`.

#### 3. Sound Design

- **What it does:** Five Web-Audio one-shots that punctuate moments in the demo: `lockBeep` (iris locks for the first time), `stageAdvance` (between matching stages), `successChime` (3-note arpeggio on a successful match), `failBuzz` (a low sawtooth on failure), and `softClick` (small button-press click).
- **How it works:** `src/lib/sounds.ts` keeps a singleton `AudioContext` and synthesizes each sound from oscillators (sine/triangle/sawtooth) with `exponentialRampToValueAtTime` envelopes. Every emitter is gated by `useAppStore.getState().soundEnabled`. The header has a mute toggle (`src/components/layout/SoundToggle.tsx`) that persists to `localStorage` under `biolens-sound`.
- **Why we added this:** Sound makes the same on-screen content feel ~30% more "real" to a live audience.
- **Key files:** `src/lib/sounds.ts`, `src/components/layout/SoundToggle.tsx`.

#### 4. SOAP Auto-Generation

- **What it does:** Generates a clinical SOAP note (Subjective / Objective / Assessment / Plan) from the patient record and a free-text intervention string, with quick-chip insertions, edit mode, copy, and print.
- **How it works:** `src/lib/soap.ts → generateSOAPNote(patient, intervention)` calls `generateStructured<SOAPNote>` with `SYSTEM_SOAP_NOTE` (`src/lib/ai-prompts.ts`), `buildSOAPNoteUserPrompt(patient, intervention)`, and `soapNoteSchema`. Model: `gemini-2.5-pro`, temperature `0.2`. The dialog (`src/components/patient/SOAPDialog.tsx`) accepts a textarea seeded with the AI triage actions (when available), exposes 10 chip-insertable interventions (Oxygen 15L NRB, IV access x2, Aspirin 325mg, 12-lead ECG, Atropine 1mg IV, Nitro 0.4mg SL, Cooling measures, Albuterol neb, D50W 25g, Naloxone 2mg IN), and provides Copy / Print / Edit / Done controls. Print mode toggles `body[data-soap-print="active"]` and a `@media print` block in `src/index.css` hides everything except `[data-soap-printable]`.
- **Caching:** `appStore.soapCache[pilgrimId]`.
- **Why we added this:** Documentation is the largest single time-sink in EMS, and the AI angle is most defensible there.
- **Key files:** `src/lib/soap.ts`, `src/components/patient/SOAPDialog.tsx`, `src/lib/ai-prompts.ts`, `src/lib/ai-schemas.ts`.

#### 5. Drug Interaction Checker

- **What it does:** Compares the patient's home medications against a paramedic-proposed intervention set (free text + 12 quick-add chips) and surfaces clinically significant interactions, severity-sorted, with source attribution (openFDA verified vs. AI knowledge only).
- **How it works:** `src/lib/drug-interactions.ts → checkInteractions(currentMeds, proposedInterventions)`. It (1) normalizes and dedupes both lists, (2) queries openFDA for each generic via `src/lib/openfda.ts → fetchMultipleDrugs` (which tries `openfda.generic_name`, `openfda.substance_name`, then `openfda.brand_name`, with a small alias table mapping `acetylsalicylic acid → aspirin`, `salbutamol → albuterol`, `paracetamol → acetaminophen`, etc.), (3) collates a clipped FDA label excerpt (contraindications ≤300 chars, interactions ≤600 chars) per drug, and (4) calls `generateStructured<InteractionAnalysis>` with a long inline system prompt, the user prompt that embeds the FDA context, and `interactionAnalysisSchema`. Model: `gemini-2.5-pro`, temperature `0.1`. Each alert carries a `sourceLabel` of either `openFDA` (when the FDA label was cited) or `AI-knowledge` (when the AI used established pharmacology).
- **Quick-add chips (translated):** Atropine, Epinephrine, Amiodarone, Vasopressin, Lidocaine, Heparin, Morphine, Furosemide, Naloxone, Adenosine, Magnesium, Calcium gluconate.
- **Caching:** `appStore.interactionCache[key]` where the key is `buildInteractionCacheKey(pilgrimId, interventions)` — pilgrim ID + sorted lowercased interventions joined by `|`. openFDA responses are independently cached in `biolens-openfda-cache-v2` (7-day TTL).
- **Why we added this:** Makes the drug-safety story concrete with a real, verifiable external source.
- **Key files:** `src/lib/drug-interactions.ts`, `src/lib/openfda.ts`, `src/components/patient/DrugInteractionsDialog.tsx`.

#### 6. Mecca Cases Heatmap

- **What it does:** A dark-themed map of the holy sites with each active case pinned at its `demoLocation`, color-coded by triage severity, plus a heat overlay weighted by severity. A sidebar lists the same cases and clicking either the marker or the list-item opens a popup with the pilgrim summary and an "Open Profile" button.
- **How it works:** `src/pages/CasesMap.tsx`. Centers on Mecca `[21.4225, 39.8262]`. Tile layer is CARTO `dark_all`. Custom Leaflet `divIcon` markers come from `src/lib/map-icons.ts` (animated pulse ring + colored core for each triage color). The heat layer is `leaflet.heat` with severity weights `red=1.0, green=0.3` and gradient stops 0.4→#22c55e, 0.8→#ef4444. The sidebar is RTL-aware (`text-${lang === 'ar' ? 'right' : 'left'}`) but the map itself is forced `dir="ltr"` so Leaflet doesn't flip.
- **Why we added this:** Gives the demo an "operational situational awareness" beat after the per-patient story.
- **Key files:** `src/pages/CasesMap.tsx`, `src/lib/map-icons.ts`, `src/lib/leaflet-types.d.ts`.

#### 7. Operations Dashboard

- **What it does:** Seven widgets summarizing the running session. Numbers count-up on render.
- **Widgets (all from `src/pages/Dashboard.tsx`):**
  1. **Active cases** — total pilgrim count, with a session-elapsed time line.
  2. **By severity** — 2-cell grid (red/green) with animated counts.
  3. **By nationality** — bar chart with flag emoji per country.
  4. **Top presenting complaints** — first ~4 words of each pilgrim's `demoPresentingComplaint.en`, dotted by severity.
  5. **Gemini API calls** — `geminiCallCount` from the store, with a fixed "~2.4s" avg latency line (static — `dashboard.widget.aiCalls.latency`).
  6. **Avg iris match confidence** — mean of the last 10 entries in `matchHistory`, as a percentage.
  7. **Avg AI triage confidence** — mean of `triageDecisions[*].confidence` × 100.
- **How it works:** Mostly pure derivations over `useAppStore` slices, with `framer-motion`'s `animate(useMotionValue, target)` to count up the numbers. A 1-second clock interval updates elapsed time.
- **Why we added this:** Gives the closing beat of the demo a "here is the whole picture" framing.
- **Key files:** `src/pages/Dashboard.tsx`.

#### 8. Director Mode

- **What it does:** A presenter-only control panel hidden behind `Cmd+Shift+D` (or `Ctrl+Shift+D`). Slides up from the bottom of the screen. Contains the scenarios, quick nav, cache management, speaker notes toggle, sound/language toggles, reset, and the precache builder.
- **How it works:** `src/components/director/DirectorPanel.tsx` registers a global keydown listener. `directorMode` lives in the Zustand store (not localStorage — it always starts off). The panel lazily loads pilgrim JSONs on first open. Scenario tiles set `scanMode: 'demo'`, set `demoTargetPilgrimId`, and `navigate('/scan')`. Reset clears the three AI caches and gemini call count, navigates `/`, and re-hydrates from the precache (so the next demo run is still warm).
- **Why we added this:** Live demos go off the rails without a fast undo and a one-tap "queue up patient X."
- **Key files:** `src/components/director/DirectorPanel.tsx`.

#### 9. Speaker Notes

- **What it does:** Route-aware floating note card pinned bottom-right when Director Mode is on AND `showSpeakerNotes === true`. Title + 3–4 bullets per screen.
- **How it works:** `src/components/director/SpeakerNotes.tsx` reads the current route and looks it up in `SPEAKER_NOTES` (`src/lib/speaker-notes.ts`). There's a fallback generic patient note for unmatched `/patient/*` paths. The toggle button is in the Director Panel.
- **Key files:** `src/components/director/SpeakerNotes.tsx`, `src/lib/speaker-notes.ts`.

#### 10. Pre-cache System

- **What it does:** Warms every AI cache for every pilgrim so the demo can run without making live Gemini calls.
- **How it works:** `src/lib/precache.ts → buildPrecache(onProgress)` walks all 5 patients and, sequentially, calls `fetchTopFacts`, `evaluateTriage`, and `generateSOAPNote` for each — 15 calls total — plus drug-interaction analysis for 3 patients flagged `HIGH_RISK_PATIENT_IDS = ["pilgrim_001","pilgrim_002","pilgrim_003"]`. Interventions for the drug check are extracted from the AI's `immediateActions` via a regex over a known emergency-drug vocabulary (Atropine, Epinephrine, Amiodarone, Vasopressin, Lidocaine, Heparin, Morphine, Furosemide, Naloxone, Adenosine, Magnesium, Calcium gluconate, Aspirin, Nitroglycerin, Albuterol, Dextrose/D50W, Oxygen). The result is persisted to `localStorage["biolens-precache-v1"]`. On app boot, `src/main.tsx` calls `loadPrecache()` + `isPrecacheFresh()` (24h TTL) and hydrates the store via `hydrateStoresFromPrecache(data)`.
- **Trigger:** Manual only — the Director Panel's "Run" button under "Build Precache" with a progress bar. Never auto-runs to avoid quota burn.
- **Why we added this:** Wi-Fi during demos is unreliable; the precache is the failover.
- **Key files:** `src/lib/precache.ts`, `src/main.tsx`, `src/components/director/DirectorPanel.tsx`.

#### 11. Failsafe Banner

- **What it does:** Surfaces a small amber pill near the top of the screen when Gemini fails AND a precache exists, signaling "we're degraded but cached responses are still playing."
- **How it works:** `src/components/layout/FailsafeBanner.tsx` listens for the `biolens:gemini-error` `CustomEvent` emitted by `src/lib/gemini.ts → emitGeminiError`. Only renders when `loadPrecache()` returns a value (i.e. a real fallback). Auto-dismisses after 8 seconds.
- **Key files:** `src/components/layout/FailsafeBanner.tsx`, `src/lib/gemini.ts`.

#### 12. Micro-interactions polish

- Vitals count-up via `animate(useMotionValue)` (`src/components/patient/VitalsCard.tsx`).
- Allergies card: pulsing red sweep on life-threatening severity (`src/components/patient/AllergiesCard.tsx`).
- Top 3 hover effects on each fact card.
- Triage card pulse glow (CSS keyframe `triage-pulse` in `tailwind.config.js`).
- Page transition: a thin cyan sweep crosses the viewport on every route change (`src/components/layout/PageTransition.tsx`).
- Branded skeletons via `BioSkeleton` (`src/components/ui/bio-skeleton.tsx`).
- Home page particle helix + animated stat numbers + ripple-CTA on Start Iris Scan + border sweep on stat-card hover (`src/pages/Home.tsx`).

---

## 7. AI Integration Deep Dive

All prompts live in `src/lib/ai-prompts.ts`. All schemas live in `src/lib/ai-schemas.ts`.

### 7.1 Top 3 Life-Saving Facts

- **System prompt (`SYSTEM_LIFE_SAVING_FACTS`):**
  > You are an emergency medicine triage AI assisting a paramedic in the field during Hajj season in Saudi Arabia. The pilgrim before them is impaired or unconscious. You have their full medical record from their home country.
  >
  > Your job: identify the THREE most critical life-saving facts the paramedic MUST know in the next 60 seconds to keep this person alive or prevent harm. Prioritize by immediate threat to life. Be specific. Be terse. Every word matters.
  >
  > Rules:
  > - Output exactly 3 facts, ranked by criticality (highest first)
  > - "title" ≤ 60 chars, "content" ≤ 200 chars, "actionRecommended" ≤ 100 chars
  > - "icon" must match the fact type
  > - Reference real drug names, dosages, conditions from the patient record
  > - Do NOT include vague advice like "monitor patient" or "call for help"

- **User prompt:** `buildLifeSavingFactsUserPrompt(patient)` — name, age, sex, nationality, blood type, primary language, presenting complaint, full vitals, all chronic conditions (with ICD-10 + severity + notes), all medications, all allergies, all past surgeries.
- **Schema (`lifeSavingFactsSchema`):** `{ facts: [{ id, icon ∈ {alert,pill,allergy,surgery,condition,heart,lung,brain}, title, content, criticality ∈ {high,medium,low}, actionRecommended }], reasoning }`. All fields required.
- **Model:** `gemini-2.5-flash`.
- **Temperature:** `0.2`.
- **Retry behavior:** inherited from `generateStructured` defaults — `maxRetries: 2`, exponential backoff 400ms × 2^attempt, retryable errors only.
- **Cache key strategy:** `appStore.topFactsCache[pilgrimId]`.

### 7.2 Triage Context Decision

- **System prompt (`SYSTEM_TRIAGE_CONTEXT`):**
  > You are a senior emergency physician overseeing mass-casualty triage during Hajj. A field paramedic has applied a simplified START protocol and produced an initial color: RED (critical, immediate action) or GREEN (stable, not immediate). Your job is to either confirm that color or change it based on the patient's specific medical context.
  >
  > Rules:
  > - Start from the START Protocol result given to you
  > - Output ONLY "red" or "green" — those are the only valid colors
  > - Adjust ONLY when context provides clear medical justification (e.g. known severe allergy + chest pain → upgrade green to red; benign chronic + stable vitals + ambulatory → downgrade red to green; pregnancy + active asthma attack history → keep red)
  > - Output "adjustedFromStart": true ONLY if finalColor differs from startProtocolColor
  > - "reasoning" must cite the specific medical fact that drove your decision
  > - "immediateActions" must be 3 concrete, prioritized interventions, each ≤80 chars

- **User prompt:** START color + patient name/age/sex + presenting complaint + vitals + AVPU + chronic conditions + allergies (with severity) + current meds.
- **Schema (`triageContextSchema`):** `{ finalColor, startProtocolColor, confidence: number, reasoning, immediateActions: string[], adjustedFromStart: boolean }`. Colors enum: red/green.
- **Model:** `gemini-2.5-pro`.
- **Temperature:** `0.2`.
- **Retry behavior:** default.
- **Cache key strategy:** `appStore.triageDecisions[pilgrimId]`.

### 7.3 Translation

- **System prompt (`SYSTEM_TRANSLATION`):**
  > You are a medical translator. Translate medical text accurately while preserving clinical meaning. Drug names, dosages, ICD codes, and anatomical terms must be precise. Output only the requested JSON structure.

- For `translateText(text, src, tgt)`: user prompt is `Translate this medical text from ${src} to ${tgt}:\n\n${text}`. Schema is `translationSchema` = `{ translatedText, sourceLanguage, targetLanguage }`. Currently unused by any component but exported.
- For `translateFacts(facts, targetLang)`: system prompt is `SYSTEM_TRANSLATION` plus an instruction to translate `title`/`content`/`actionRecommended`/`reasoning` and preserve `id`/`icon`/`criticality` and the JSON structure exactly. Uses `generateText` (no schema) and strips ```` ```json ```` fences from the result.
- **Model:** `gemini-2.5-flash`.
- **Temperature:** `0.1`.
- **Cache key strategy:** `appStore.factsTranslationCache[pilgrimId][langCode]`.

### 7.4 SOAP Note

- **System prompt (`SYSTEM_SOAP_NOTE`):**
  > You are a medical scribe generating a clinical SOAP note for an emergency encounter. Follow standard format strictly. Be objective, concise, and use proper medical terminology.

- **User prompt:** `buildSOAPNoteUserPrompt(patient, intervention)` — name/age/sex + chief complaint + vitals + past medical history (chronic conditions) + allergies (or "NKDA") + home meds + the free-text intervention string from the dialog.
- **Schema (`soapNoteSchema`):** `{ subjective, objective, assessment, plan, generatedAt }` (all strings, all required). `generatedAt` is overridden in `generateSOAPNote` to a fresh `new Date().toISOString()`.
- **Model:** `gemini-2.5-pro`.
- **Temperature:** `0.2`.
- **Cache key strategy:** `appStore.soapCache[pilgrimId]`. Note: the cache is keyed by pilgrim only, so regenerating with a different intervention string overwrites the previous cached SOAP for that pilgrim.

### 7.5 Drug Interactions

- **System prompt** (defined inline in `src/lib/drug-interactions.ts`):
  > You are a clinical pharmacology AI assistant for emergency medicine in the field. You are given:
  > 1. The patient's CURRENT home medications
  > 2. PROPOSED interventions the paramedic is considering
  > 3. openFDA label excerpts for both lists (may be partial or empty for some drugs)
  >
  > Your job: identify ALL clinically significant drug-drug interactions between current meds and proposed interventions. Be precise. Cite the FDA label when applicable; otherwise rely on established pharmacology knowledge and mark sourceLabel as 'AI-knowledge'.
  >
  > Rules:
  > - Only return interactions with REAL clinical significance — skip theoretical or negligible ones
  > - "contraindicated" = do not co-administer under any circumstance
  > - "major" = significant risk, requires intervention/monitoring
  > - "moderate" = clinically relevant, adjust dosing or monitor
  > - "minor" = noted but rarely actionable
  > - mechanism ≤ 200 chars, clinicalEffect ≤ 150 chars, recommendation ≤ 150 chars
  > - Always include both drugs by their generic name
  > - If no significant interactions exist, return empty alerts array (NOT a fake "minor" alert)

- **User prompt:** explicit "PATIENT'S CURRENT MEDICATIONS:", "PROPOSED INTERVENTIONS:", "OPENFDA LABEL EXCERPTS:" (per-drug `Contraindications:`/`Interactions:` blocks), and "DRUGS NOT FOUND IN FDA:".
- **Schema (`interactionAnalysisSchema`):** `{ alerts: [{ severity ∈ {contraindicated,major,moderate,minor}, drug1, drug2, mechanism, clinicalEffect, recommendation, sourceLabel ∈ {openFDA, AI-knowledge} }], drugsAnalyzed: string[], drugsNotFoundInFDA: string[], reasoning }`.
- **Model:** `gemini-2.5-pro`.
- **Temperature:** `0.1`.
- **Retry behavior:** `maxRetries: 2` (explicit), exponential backoff.
- **Cache key strategy:** `appStore.interactionCache[buildInteractionCacheKey(pilgrimId, interventions)]`.

### 7.6 Gemini Client (`src/lib/gemini.ts`)

- **`generateStructured<T>(systemPrompt, userPrompt, responseSchema, options)`** — the canonical entry point. Reads `import.meta.env.VITE_GEMINI_API_KEY` for direct mode and `VITE_USE_WORKER_PROXY`/`VITE_WORKER_URL` for proxy mode. Increments `geminiCallCount` once per call. Loops up to `maxRetries + 1` times with `400ms * 2^attempt` backoff between retries. If the final attempt fails, emits a `biolens:gemini-error` `CustomEvent` on `window` with the error message in `detail`, and rethrows.
- **`callDirect<T>`** — uses `@google/generative-ai` SDK with `responseMimeType: 'application/json'` + `responseSchema`. JSON-parses the response text; if parse fails, throws `{ code: 'invalid_response', retryable: true }` so the retry loop kicks in.
- **`callViaWorker<T>`** — `POST` to `WORKER_URL` with `{system, user, schema, model, temperature}`. Maps HTTP status to error code: 401/403 → `auth` (`retryable: false`), 429 → `rate_limit` (retryable), other → `network` (retryable).
- **`generateText(systemPrompt, userPrompt, options)`** — for free-text completion (used only by `translateFacts`). Does not retry, but still emits the error event on failure. Always uses the direct SDK path (no worker support).
- **Defaults:** `model: 'gemini-2.5-flash'`, `temperature: 0.3`, `maxRetries: 2`. Most call sites override.
- **Client singleton:** `GoogleGenerativeAI` is lazily constructed via `getClient()` and reused.

### 7.7 Quota & Cost Considerations

- Gemini 2.5 Flash free tier: ~15 RPM (requests per minute), ~1500 RPD (per day).
- Gemini 2.5 Pro free tier: ~2 RPM, ~50 RPD — this is the bottleneck.
- A full precache build issues 15 baseline + up to 3 interaction = up to 18 calls (mix of Flash and Pro). The free Pro tier exhausts after roughly 3 precache rebuilds in 24h.
- For production: paid tier rates apply. Verify current pricing at https://ai.google.dev/pricing before committing to a budget.
- Precache lives in `localStorage` for 24 hours specifically to spare the quota during rehearsals.

---

## 8. File Structure

```
/
├── PROJECT.md                       — this document
├── README.md                        — short user-facing readme
├── index.html                       — Vite entry HTML
├── package.json / package-lock.json — npm manifest + lock
├── tsconfig.json                    — TS project references
├── tsconfig.app.json                — app TS config (es2023, bundler resolution, @/* alias)
├── tsconfig.node.json               — Vite/Node TS config
├── vite.config.ts                   — Vite config (React plugin + @ alias + port 5173)
├── tailwind.config.js               — Tailwind config (triage/medical palettes, keyframes, animations)
├── postcss.config.js                — Tailwind + autoprefixer
├── eslint.config.js                 — ESLint flat config
├── components.json                  — shadcn/ui config
├── .env / .env.example              — env vars (API keys, worker toggle)
│
├── public/
│   ├── favicon.svg
│   ├── icons.svg
│   └── data/
│       ├── iris_embeddings.json     — empty array placeholder (real refs come from /data/iris_refs/, which is absent in repo)
│       └── pilgrims/
│           ├── _index.json          — list of pilgrim IDs/files
│           ├── pilgrim_001.json     — Budi Santoso (ID, cardiac, RED)
│           ├── pilgrim_002.json     — Fatima Bibi Khan (PK, heat stroke + post-ictal, RED)
│           ├── pilgrim_003.json     — Ayşe Yılmaz (TR, asthma + pregnant, RED)
│           ├── pilgrim_004.json     — Aisha Abubakar (NG, dizziness, GREEN)
│           └── pilgrim_005.json     — Mahmoud Hassan El-Sayed (EG, mild headache, GREEN)
│
├── src/
│   ├── App.tsx                      — Top-level routes + Director overlays
│   ├── main.tsx                     — Mount, i18n init, leaflet CSS, enrollment prewarm, precache hydrate, voice prewarm
│   ├── index.css                    — Tailwind layers + CSS vars + Inter/Cairo fonts + print stylesheet
│   ├── assets/
│   │   ├── hero.png
│   │   └── vite.svg
│   │
│   ├── i18n/
│   │   ├── index.ts                 — i18next setup, RTL/LTR dir switching, localStorage persistence
│   │   └── locales/
│   │       ├── ar.json              — Arabic translations (349 lines)
│   │       └── en.json              — English translations (350 lines)
│   │
│   ├── types/
│   │   ├── patient.ts               — Patient + nested record types
│   │   ├── ai.ts                    — Gemini response types, triage decision, SOAP, interactions
│   │   ├── biometric.ts             — IrisEmbedding
│   │   └── triage.ts                — TriageColor (duplicated in patient.ts) + TriageResult
│   │
│   ├── lib/
│   │   ├── ai-filtering.ts          — fetchTopFacts (Gemini Flash + lifeSavingFactsSchema)
│   │   ├── ai-prompts.ts            — All system prompts + user prompt builders
│   │   ├── ai-schemas.ts            — Google AI ResponseSchema definitions
│   │   ├── ai-triage.ts             — evaluateTriage (START + Gemini Pro, returns red/green verbatim)
│   │   ├── constants.ts             — MATCH_THRESHOLD, IRIS_CROP_SIZE, EMBEDDING_DIM, ROUTES
│   │   ├── cosine.ts                — Vector cosine similarity
│   │   ├── drug-interactions.ts     — checkInteractions (openFDA + Gemini Pro) + cache-key builder
│   │   ├── enrollment.ts            — enrollAll + getEnrolledEmbeddings + localStorage cache + window.clearEnrollmentCache helper
│   │   ├── gemini.ts                — Gemini client (direct + worker), retries, error event
│   │   ├── iris-refs.ts             — generateSyntheticIris (canvas) + getReferenceIrisImageUrl
│   │   ├── leaflet-types.d.ts       — Module + heatLayer typings
│   │   ├── loading-messages.ts      — Loading-state copy + useCyclingMessage hook
│   │   ├── map-icons.ts             — makeTriageIcon (custom Leaflet DivIcon with CSS pulse)
│   │   ├── matching.ts              — matchEmbedding + DEMO_BASELINE_SIMILARITY override
│   │   ├── mediapipe.ts             — FaceLandmarker singleton + iris index map + bbox extraction
│   │   ├── openfda.ts               — openFDA fetch + alias table + 7-day cache
│   │   ├── patients.ts              — fetchPatient / fetchAllPatients
│   │   ├── precache.ts              — buildPrecache + hydrate/load/clear + entry counter
│   │   ├── soap.ts                  — generateSOAPNote (Gemini Pro)
│   │   ├── sounds.ts                — Web Audio one-shots + sound-enabled guard
│   │   ├── speaker-notes.ts         — Route-keyed presenter bullets + fallback
│   │   ├── tensorflow.ts            — MobileNet singleton + cropToTensor + extractEmbedding
│   │   ├── translation.ts           — translateText + translateFacts
│   │   ├── triage.ts                — startProtocol (deterministic rules)
│   │   └── utils.ts                 — cn (clsx + tailwind-merge) + nationality/flag helpers
│   │
│   ├── store/
│   │   └── appStore.ts              — Zustand store (single global)
│   │
│   ├── hooks/
│   │   ├── useCamera.ts             — getUserMedia + cleanup
│   │   ├── useIrisDetection.ts      — rAF loop + FPS counter + lock-on beep
│   │   ├── useIrisMatching.ts       — staged matching pipeline + sound effects
│   │   └── useVoiceOutput.ts        — Web Speech wrapper + voice selection + sequence
│   │
│   ├── pages/
│   │   ├── Splash.tsx               — Cinematic intro (audio sweep + animated iris + CTA)
│   │   ├── Home.tsx                 — Landing page (iris illustration + stats + CTAs)
│   │   ├── Scan.tsx                 — Iris scanner page (mode toggle, demo picker, stage HUD)
│   │   ├── PatientProfile.tsx       — Patient record + Top 3 + actions
│   │   ├── TriageGroup.tsx          — Mass triage list + AI override
│   │   ├── CasesMap.tsx             — Lazy. Leaflet map of cases (heat + markers + sidebar)
│   │   ├── Dashboard.tsx            — Lazy. 7-widget operations dashboard
│   │   └── NotFound.tsx             — 404 page
│   │
│   └── components/
│       ├── director/
│       │   ├── DirectorPanel.tsx    — Cmd+Shift+D presenter panel
│       │   └── SpeakerNotes.tsx     — Route-aware presenter overlay
│       ├── iris/
│       │   ├── ConfidenceCounter.tsx — Animated %-confidence number
│       │   ├── IrisLockOn.tsx       — Concentric SVG lock-on rings
│       │   ├── IrisOverlay.tsx      — Canvas overlay drawing landmarks + lock-on
│       │   ├── IrisScanner.tsx      — Camera viewport + HUD chrome
│       │   ├── MatchingStageVisual.tsx — Per-stage SVG animations (shutter / neural net / scan-bar)
│       │   └── SuccessOverlay.tsx   — Full-screen success card before navigation
│       ├── layout/
│       │   ├── AppLayout.tsx        — Outlet + bg gradients + grid pattern
│       │   ├── FailsafeBanner.tsx   — Amber pill on gemini-error event
│       │   ├── Header.tsx           — Sticky header (logo, Mecca clock, nav, mode pill, sound, lang)
│       │   ├── LanguageToggle.tsx   — AR↔EN toggle (also writes localStorage via i18n)
│       │   ├── PageTransition.tsx   — Cyan sweep + opacity/y fade on route change
│       │   └── SoundToggle.tsx      — Volume toggle (header)
│       ├── patient/
│       │   ├── AllergiesCard.tsx    — Severity-styled allergy list with pulse for life-threatening
│       │   ├── ConditionsCard.tsx
│       │   ├── DrugInteractionsDialog.tsx — Full dialog UI for the drug-check feature
│       │   ├── EmergencyContactsCard.tsx
│       │   ├── MedicationsCard.tsx
│       │   ├── PatientHeader.tsx    — Bilingual name + identity strip
│       │   ├── ProfileActions.tsx   — Voice / Translate / SOAP / Drug Check buttons
│       │   ├── SectionCard.tsx      — Shared card chrome wrapper
│       │   ├── SOAPDialog.tsx       — SOAP generation dialog + edit + copy + print
│       │   ├── SurgeriesCard.tsx
│       │   ├── TopThreeFacts.tsx    — The hero AI panel
│       │   ├── TranslateButton.tsx  — Translate facts AR↔EN with cache
│       │   ├── VitalsCard.tsx       — Numeric-animated vitals with range alerts
│       │   └── VoiceButton.tsx      — Read top 3 aloud, stop control
│       ├── triage/
│       │   ├── TriageCard.tsx       — Per-pilgrim triage card (color, AI decision, actions)
│       │   ├── TriageStats.tsx      — Severity badge totals
│       │   └── TriageStatsBar.tsx   — Stacked-bar visualization of severity mix
│       └── ui/                      — shadcn/ui Radix primitives + bespoke
│           ├── alert.tsx
│           ├── avatar.tsx
│           ├── badge.tsx
│           ├── bio-skeleton.tsx     — Branded skeleton with sweep animation
│           ├── button.tsx
│           ├── card.tsx
│           ├── dialog.tsx
│           ├── glow-card.tsx        — Cyan-glow card variant
│           ├── progress.tsx
│           ├── scan-line.tsx        — Vertical scan-line decoration
│           ├── scroll-area.tsx
│           ├── separator.tsx
│           ├── skeleton.tsx
│           ├── sonner.tsx           — Toast (sonner) provider
│           ├── toggle.tsx
│           ├── tooltip.tsx
│           └── triage-badge.tsx     — Triage color chip
│
└── worker/                          — Cloudflare Worker proxy (scaffold, not deployed)
    ├── README.md
    ├── package.json
    ├── wrangler.toml                — name=biolens-gemini-proxy, ALLOWED_ORIGIN=http://localhost:5173
    └── src/
        └── index.ts                 — POST /, calls Gemini v1beta generateContent, returns parsed JSON
```

---

## 9. Data Models

All interfaces are defined in `src/types/`. Below are the verbatim definitions plus when each is used.

### From `src/types/patient.ts`

```ts
export type TriageColor = "red" | "green";
```
*Used everywhere triage status is rendered or compared.*

```ts
export interface Medication {
  generic: string;
  brand: string;
  dose: string;
  frequency: string;
  route: string;
  startedYear: number;
  indication: string;
}
```
*Each entry in `Patient.medications`. Powers `MedicationsCard`, the SOAP prompt's "HOME MEDS" line, and the drug-interaction `currentMeds` input.*

```ts
export interface ChronicCondition {
  name: string;
  icd10: string;
  diagnosedYear: number;
  severity: "mild" | "moderate" | "severe";
  notes: string;
}
```
*Each entry in `Patient.chronicConditions`. Surfaced in `ConditionsCard` and seeded into all four Gemini prompts.*

```ts
export interface Allergy {
  substance: string;
  type: "drug" | "food" | "environmental";
  reaction: string;
  severity: "mild" | "moderate" | "severe" | "life-threatening";
}
```
*The `life-threatening` value drives the pulsing red sweep on the allergy card.*

```ts
export interface Surgery {
  procedure: string;
  date: string;
  hospital: string;
  notes?: string;
}
```
*`SurgeriesCard`. Pilgrim 005's appendectomy and Pilgrim 001's CABG are the most narrative examples.*

```ts
export interface Vaccination {
  name: string;
  date: string;
  lotNumber?: string;
}
```
*Present in patient JSONs but not currently rendered in any card.*

```ts
export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  language: string;
}
```
*`EmergencyContactsCard`. `language` is informational.*

```ts
export interface ClinicalNote {
  date: string;
  author: string;
  content: string;
}
```
*Present in patient JSONs; not surfaced in the current UI but provides context for the AI prompts.*

```ts
export interface Patient {
  id: string;
  hajjPermitNumber: string;
  fullName: { ar: string; en: string };
  age: number;
  sex: "male" | "female";
  nationality: { ar: string; en: string };
  primaryLanguage: string;
  bloodType: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  weightKg: number;
  heightCm: number;
  chronicConditions: ChronicCondition[];
  medications: Medication[];
  allergies: Allergy[];
  surgeries: Surgery[];
  vaccinations: Vaccination[];
  emergencyContacts: EmergencyContact[];
  clinicalNotes: ClinicalNote[];
  demoSeverity: TriageColor;
  demoPresentingComplaint: { ar: string; en: string };
  demoVitals: {
    heartRate: number;
    respRate: number;
    systolicBP: number;
    diastolicBP: number;
    spo2: number;
    temperatureC: number;
    glucoseMgDl: number;
    consciousness: "alert" | "verbal" | "pain" | "unresponsive";
    canWalk: boolean;
  };
  demoLocation?: {
    lat: number;
    lng: number;
    siteName: { ar: string; en: string };
  };
}
```
*The whole record. `demoSeverity`/`demoPresentingComplaint`/`demoVitals`/`demoLocation` are demo overlays (a real system would have live vitals; here they are pre-baked per pilgrim).*

### From `src/types/ai.ts`

```ts
export type GeminiModel = "gemini-2.5-flash" | "gemini-2.5-pro";

export type FactIcon =
  | "alert" | "pill" | "allergy" | "surgery"
  | "condition" | "heart" | "lung" | "brain";
export type Criticality = "high" | "medium" | "low";

export interface LifeSavingFact {
  id: string;
  icon: FactIcon;
  title: string;
  content: string;
  criticality: Criticality;
  actionRecommended: string;
}

export interface LifeSavingFactsResponse {
  facts: LifeSavingFact[];
  reasoning: string;
}
```
*Returned by `fetchTopFacts`. `icon` maps to a Lucide icon in `TopThreeFacts.tsx`.*

```ts
export type TriageColor = "red" | "green";

export interface TriageContextDecision {
  finalColor: TriageColor;
  startProtocolColor: TriageColor;
  confidence: number;
  reasoning: string;
  immediateActions: string[];
  adjustedFromStart: boolean;
}
```
*Note: `TriageColor` is defined twice (here and in `patient.ts`) — they are structurally identical. Returned by `evaluateTriage`. `confidence` is a Gemini-supplied number that the Dashboard aggregates.*

```ts
export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
}
```
*Returned by `translateText` (currently unused by components but exported).*

```ts
export interface SOAPNote {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
  generatedAt: string;
}
```
*Returned by `generateSOAPNote`. `generatedAt` is server-stamped to `new Date().toISOString()` in `src/lib/soap.ts`.*

```ts
export interface GeminiError {
  code: "auth" | "rate_limit" | "invalid_response" | "network" | "unknown";
  message: string;
  retryable: boolean;
}
```
*Internal error envelope used by `src/lib/gemini.ts`.*

```ts
export type InteractionSeverity =
  | "contraindicated" | "major" | "moderate" | "minor";

export interface InteractionAlert {
  severity: InteractionSeverity;
  drug1: string;
  drug2: string;
  mechanism: string;
  clinicalEffect: string;
  recommendation: string;
  sourceLabel: "openFDA" | "AI-knowledge";
}

export interface InteractionAnalysis {
  alerts: InteractionAlert[];
  drugsAnalyzed: string[];
  drugsNotFoundInFDA: string[];
  reasoning: string;
}
```
*Returned by `checkInteractions`. The dialog renders the alerts sorted by severity.*

### From `src/types/biometric.ts`

```ts
export interface IrisEmbedding {
  pilgrimId: string;
  vector: number[];
}
```
*Type signature for the persisted enrolled embeddings (note: `src/lib/enrollment.ts` adds a `source: "real" | "synthetic"` field at runtime — see §16).*

### From `src/types/triage.ts`

```ts
export type TriageColor = "red" | "green";

export interface TriageResult {
  patientId: string;
  color: TriageColor;
  reason?: string;
  timestamp: number;
}
```
*Both are declared but `TriageResult` is not currently referenced. `TriageColor` here is identical to the one in `patient.ts` and `ai.ts`.*

---

## 10. The 5 Mock Pilgrims

All five live as JSON in `public/data/pilgrims/`. Names are real-looking but fictional.

| ID | Name (EN) | Nationality | Sex/Age | Severity | Presenting | Critical fact |
|---|---|---|---|---|---|---|
| pilgrim_001 | Budi Santoso | 🇮🇩 Indonesia | M, 67 | **RED** | Chest pain & collapse at Jamarat; suspected STEMI | Penicillin anaphylaxis + post-CABG x3 (LVEF 38%) |
| pilgrim_002 | Fatima Bibi Khan | 🇵🇰 Pakistan | F, 54 | **RED** | Heat stroke + post-ictal at Mina; core temp 41.2°C | Epilepsy + Stevens-Johnson to sulfa drugs |
| pilgrim_003 | Ayşe Yılmaz | 🇹🇷 Türkiye | F, 31 | **RED** | Moderate asthma attack at Masjid al-Haram; 22-week pregnant | Severe asthma (1 ICU admission) + AERD — no NSAIDs |
| pilgrim_004 | Aisha Abubakar | 🇳🇬 Nigeria | F, 42 | **GREEN** | Mild dizziness/headache after Tawaf | Sickle cell trait → rhabdo risk in extreme heat |
| pilgrim_005 | Mahmoud Hassan El-Sayed | 🇪🇬 Egypt | M, 58 | **GREEN** | Mild headache, BP check after walking in heat | Hypertension on amlodipine + losartan; no allergies |

### Detailed sketches

**pilgrim_001 — Budi Santoso** (Indonesia · O+ · permit ID-2025-3847291)
- **Chronic:** Type 2 diabetes (HbA1c 9.2, peripheral neuropathy), Coronary artery disease (triple-vessel, CABG x3 in 2017, LVEF 38%), Essential hypertension.
- **Meds:** Metformin 1g BID, Aspirin 81mg, Atorvastatin 40mg qHS, Bisoprolol 5mg, Nitroglycerin SL PRN.
- **Top allergy:** Penicillin — anaphylaxis with laryngeal edema (life-threatening).
- **Location:** Jamarat Bridge `21.4225, 39.8731`.
- **What the AI typically surfaces:** Penicillin anaphylaxis (avoid β-lactams), post-CABG with low EF (fragile cardiac reserve, careful fluids), STEMI workup (aspirin already on board, nitro available).

**pilgrim_002 — Fatima Bibi Khan** (Pakistan · A− · permit PK-2025-9921674)
- **Chronic:** Focal epilepsy with secondary generalization (last seizure 14 mo ago, AED-controlled), Stage 3a CKD (eGFR 52).
- **Meds:** Levetiracetam 500mg BID, Lamotrigine 100mg BID, Furosemide 20mg.
- **Top allergy:** Sulfa drugs — Stevens-Johnson 2003 (life-threatening); iodinated contrast (severe rash).
- **Location:** Mina Camps `21.4133, 39.8933`.
- **What the AI typically surfaces:** Heat-induced seizure risk (rapid cooling), absolute sulfa contraindication, CKD (avoid contrast and NSAIDs).

**pilgrim_003 — Ayşe Yılmaz** (Türkiye · B+ · permit TR-2025-5562108)
- **Chronic:** Severe persistent asthma (1 ICU admission 2018), 22-week intrauterine pregnancy.
- **Meds:** Fluticasone/Salmeterol Diskus, Salbutamol/Albuterol PRN, prenatal multivitamin, ferrous sulfate.
- **Top allergy:** Aspirin/NSAIDs — bronchospasm within minutes, AERD/Samter's triad suspected (severe).
- **Location:** Masjid al-Haram `21.4225, 39.8262`.
- **What the AI typically surfaces:** Strict NSAID avoidance, albuterol on Top 3, pregnancy-safe selections only, escalate quickly given prior status asthmaticus.

**pilgrim_004 — Aisha Abubakar** (Nigeria · AB+ · permit NG-2025-7783094)
- **Chronic:** Sickle cell trait (heterozygous HbAS, rhabdomyolysis risk in extreme heat), primary hypothyroidism.
- **Meds:** Levothyroxine 75mcg, Folic acid 5mg.
- **Top allergy:** Codeine — nausea/vomiting only (mild).
- **Location:** Mataaf Area `21.4220, 39.8265`.
- **What the AI typically surfaces:** Hydration + heat precautions (sickle trait amplifier), monitor for dark urine/muscle pain, otherwise GREEN.

**pilgrim_005 — Mahmoud Hassan El-Sayed** (Egypt · O− · permit EG-2025-1140573)
- **Chronic:** Essential hypertension (135/82 home avg), mixed hyperlipidemia.
- **Meds:** Amlodipine 10mg, Losartan 50mg, Rosuvastatin 20mg.
- **Allergies:** None on file.
- **Location:** Mount Arafat `21.3547, 39.9842`.
- **What the AI typically surfaces:** BP control, statin tolerance, no acute concerns — minor.

> **Note on speaker-notes wording:** `src/lib/speaker-notes.ts` uses slightly different first-name framings than the JSONs (`Aisha` for pilgrim_002, `Fatima` for pilgrim_004) — the prebuilt note for `/patient/pilgrim_002` says "Aisha (sickle cell)" while the actual JSON for pilgrim_002 is Fatima (epilepsy). This is a known inconsistency between the speaker-notes copy and the underlying data; the data is the ground truth.

---

## 11. Demo Flow / User Journey

A typical 5-minute presenter run. Times approximate.

### 0:00 — Splash `/`
- **What they see:** A black-on-cyan iris swims into view, "BioLens" types in, "Hajj Emergency Identification" tagline below, an audio boot sweep plays, "Begin Demo" CTA shimmers in at 2.5s.
- **Presenter line (`SPEAKER_NOTES["/"]`):** "147,000 medical services per Hajj season. 180 countries, often unconscious patients. Medics can't identify them, don't know allergies. BioLens solves this in under 3 seconds."

### 0:15 — Home `/home`
- **What they see:** Iris illustration; "BioLens" wordmark; CTAs "Start Iris Scan" and "Triage Group"; stat row (147,000+ services / 180 countries / < 3s ID).
- **Presenter line (`SPEAKER_NOTES["/home"]`):** "Two entry points: individual scan or mass-casualty triage. Real-time, multi-language by default."

### 0:30 — Scan `/scan`
- **What they see:** Live camera feed, corner brackets, scan-line, mode pill (Demo by default), demo pilgrim picker. As the medic looks at their iris, cyan landmarks draw on the eye, lock-on rings pulse, "Iris locked" pill appears bottom-left, the lock-beep sounds.
- **Presenter line:** "MediaPipe runs on-device — no server. TF.js MobileNet extracts the iris embedding. Cosine similarity matches against an enrolled database. Demo mode picks a pre-seeded pilgrim."

### 1:00 — Identify
- **What they see:** Three-stage HUD: shutter visual for "Capturing iris pattern," neural-net visual for "Extracting biometric features," scan-bar-across-avatars for "Matching against 5 enrolled pilgrims." Stage-advance tones at each step. After ~1s, a full-screen cyan flash and `SuccessOverlay` with patient name, age, nationality flag, and triage band.

### 1:30 — Patient Profile loads `/patient/<id>`
- **What they see:** Bilingual header (AR + EN names, photo, age, sex, nationality, blood type, permit number), then a red-bordered "Top 3 Life-Saving Facts — AI Filtered" panel pulsing while Gemini Flash works (3 cycling messages: "Analyzing context…", "Cross-referencing medical history…", "Prioritizing critical facts…"). Cards reveal in a stagger as the patient data settles.
- **Presenter line for pilgrim_001:** "TOP 3 FACTS are AI-filtered, not lookup. Gemini surfaces penicillin allergy first — anaphylaxis risk."

### 2:15 — Voice + Translate
- **What they see/hear:** Voice button speaks the three facts in the current display language using `ar-SA` or `en-US` voices, with a "Speaking" badge and a Stop button. Translate button switches between original (English) and the target language (Arabic by default), preserving the UI structure while only translating the text fields. Toast confirms the cached translation.

### 3:00 — SOAP generation
- **What they see:** A dialog opens with the patient summary at the top, a textarea seeded with the AI triage actions (when cached), and 10 chip buttons to insert standard interventions. "Generate SOAP Note" triggers Gemini Pro; a 4-step status cycler runs ("Drafting subjective…" → "Compiling objective…" → "Formulating assessment…" → "Generating plan…"). The result renders as 4 labeled sections (S/O/A/P) with Copy, Print, Edit, Regenerate, Close.

### 3:30 — Drug Interactions
- **What they see:** A dialog with the patient's current meds listed, a textarea for proposed interventions, and 12 quick-add chips for common emergency drugs. "Check Interactions" runs openFDA lookups in parallel chunks of 5 and feeds the FDA excerpts into Gemini Pro. Result: severity-sorted alert cards with mechanism / effect / recommendation, each tagged "openFDA verified" or "AI knowledge."

### 4:00 — Triage Group `/triage`
- **What they see:** 5 pilgrim cards sorted red → green (3 red, 2 green), with a live LIVE pill, Mecca clock, and severity totals. Each card shows triage color (sometimes with "Adjusted from START" badge), the START rule that fired, the AI confidence number, and three immediate actions. AI calls fire in parallel — cards individually animate from skeleton to filled.
- **Presenter line:** "START Protocol applied first — deterministic rules. Gemini adds a context layer; see the 'adjusted from START' badges. Each card has 3 AI-generated immediate actions."

### 4:30 — Map / Dashboard `/map` and `/dashboard`
- **Map:** Dark CARTO tiles, animated pulsing triage markers at each pilgrim's `demoLocation`, severity-weighted heatmap, sidebar list. Click a pin → popup → "Open Profile."
- **Dashboard:** 7 widgets: active cases, severity grid, nationality bar chart, top complaints, Gemini API call count, avg match confidence, avg triage confidence. All numbers count up on entry.

### 5:00 — Close
- Close the loop back to the medic story: the same paramedic now has identity, top facts, triage color, drug-safety check, and a clinical SOAP note generated in under 30 seconds.

### 11.1 Feature-to-Pilgrim Demo Map

Recommended pilgrim per feature for live demo impact:

| Feature                  | Best pilgrim         | Why                                                        |
|--------------------------|----------------------|------------------------------------------------------------|
| Top 3 Life-Saving Facts  | Budi (pilgrim_001)   | Penicillin anaphylaxis is dramatic, post-CABG layered      |
| SOAP narrative           | Fatima (pilgrim_002) | Heat stroke + epilepsy → rich clinical story               |
| Triage AI override badge | Ayşe (pilgrim_003)   | Pregnancy + AERD + active asthma attack keeps her RED      |
| Drug Interactions        | Budi (pilgrim_001)   | Atropine/Epinephrine vs Bisoprolol = visible conflicts     |
| AI escalation surprise   | Aisha (pilgrim_004)  | Sickle trait + heat may bump GREEN→RED in AI layer         |
| Stable case closer       | Mahmoud (pilgrim_005)| Demonstrates system handles non-critical patients          |

Skip Aisha in time-pressed runs; use Mahmoud as the closing "no-drama, still useful" case.

---

## 12. Internationalization & RTL

- **Default language:** Arabic (`localStorage.getItem("biolens-lang") ?? "ar"` in `src/i18n/index.ts`).
- **Toggle:** Header button (`src/components/layout/LanguageToggle.tsx`). The button label shows the *target* language (`EN` if currently Arabic, `ع` if currently English).
- **Persistence:** `localStorage` key `biolens-lang`. The store mirror lives at `appStore.language`.
- **Direction switching:** `applyDocumentLang(lang)` in `src/i18n/index.ts` flips `document.documentElement.dir` between `rtl` and `ltr` on every change. The `<body>` font-family swaps to Cairo/Tajawal when `dir="rtl"` (see the `html[dir="rtl"] body` rule in `src/index.css`).
- **RTL exceptions:**
  - Map view forces `dir="ltr"` on the map container (`src/pages/CasesMap.tsx`) so Leaflet's internal calculations stay coherent.
  - Splash wordmark has `dir="ltr"` on the `<h1>` so "BioLens" doesn't reverse.
  - SOAP note bodies are English-only by design (medical English is the lingua franca in EMS handoffs) — there is no translation step on the SOAP output.
- **Voice languages:** `ar-SA` for Arabic, `en-US` for English (`src/components/patient/VoiceButton.tsx` selects based on `displayedLang`). `useVoiceOutput.findVoice` falls back from `ar-SA` to any `ar-*` voice if `ar-SA` isn't installed.
- **i18n resources:** English (`src/i18n/locales/en.json`, 350 lines) and Arabic (`src/i18n/locales/ar.json`, 349 lines). The structure mirrors the screens (`splash`, `home`, `scan`, `profile`, `triage`, `soap`, `interactions`, `dashboard`, `map`, `header`, `common`, `loading`, `voice`, `translate`, `pages`, `app`, `nav`, `mode`, `toast`).

---

## 13. Director Mode Reference

- **Hotkey:** `Cmd+Shift+D` on macOS, `Ctrl+Shift+D` on Windows/Linux. Registered as a global keydown listener in `DirectorPanel`.
- **Visibility:** Off by default. Not discoverable from the UI — only the hotkey opens it. Closing via the ⌘⇧D ✕ button in the panel header or pressing the hotkey again.
- **Panel sections (top to bottom):**
  - **Status bar (monospace):** `route /scan · lang AR · scan demo · precache 18 · 12m old · gemini 7`.
  - **Scenarios:** Horizontal scroll of 5 pilgrim tiles. Click sets `scanMode=demo`, sets `demoTargetPilgrimId`, navigates to `/scan`.
  - **Quick actions:** Home / Scan / Triage / Map View / Dashboard / Reset.
  - **Toggle row:** Notes (speaker notes overlay on/off) · Sound · Lang (AR↔EN) · Clear cache (only enabled when precache exists).
  - **Build Precache:** A "Run" button + progress bar. Hint text: "Eats API quota — run once per rehearsal."
- **Pre-cache button behavior:** Builds the 15 (or 18 with high-risk drug analyses) Gemini responses in series with a progress callback, hydrates the store, persists to `localStorage["biolens-precache-v1"]`, and toasts the entry count. Errors toast the error message; the panel stays open.
- **Reset Demo behavior:** Clears `topFactsCache`, `triageDecisions`, `soapCache`, and `geminiCallCount`. Re-hydrates the precache if one exists (so the next demo round still feels instant). Navigates to `/`. Toasts "Demo reset — Cleared session, kept precache."

---

## 14. Pre-cache System

- **Why it exists:** Live demos on conference Wi-Fi fail. The precache is the safety net.
- **What it caches:** For all 5 patients — Top 3 Facts (5 entries) + AI triage decisions (5) + SOAP notes (5). For the 3 patients in `HIGH_RISK_PATIENT_IDS = ["pilgrim_001","pilgrim_002","pilgrim_003"]` it additionally generates drug interaction analyses using interventions extracted from the AI's immediate-actions list (up to 3 entries). Total = 15 baseline + up to 3 = up to **18 Gemini responses**.
- **Storage location:** `localStorage["biolens-precache-v1"]`.
- **Shape (`PrecacheData`):** `{ topFacts, triageDecisions, soapNotes, interactionAnalyses, timestamp }` where each map is keyed by pilgrim ID (interactions are keyed by `pilgrimId:sorted|interventions`).
- **TTL behavior:** `isPrecacheFresh` returns true if `(now - data.timestamp) < 24h`. Past 24 hours, the cache is treated as stale and `src/main.tsx` does **not** hydrate it. The cache is not deleted automatically — clearing happens only via the Director Panel's "Clear cache" button or `clearPrecache()`.
- **Hydration on app boot:** `src/main.tsx` calls `loadPrecache()` → `isPrecacheFresh(cached)` → `hydrateStoresFromPrecache(cached)`. Hydration calls `appStore.setTopFacts`, `setTriageDecision`, `setSOAPNote`, and `setInteractionAnalysis` for every entry.
- **Manual rebuild trigger:** Director Panel → "Build Precache" → Run. No auto-rebuild.
- **Interaction with FailsafeBanner:** When a live Gemini call fails *and* a precache exists, the failsafe banner appears. The cached response is what the UI ends up rendering (`fetchTopFacts` will throw, but `topFactsCache` already has the entry from hydration, so the component selects the cache).

---

## 15. Environment & Setup

### Install + run

```bash
npm install

# Create .env (see .env.example)
cp .env.example .env
# Edit .env to fill in VITE_GEMINI_API_KEY

npm run dev          # serves on http://localhost:5173
```

### Env variables

```ini
# .env (loaded by Vite at build time; values must be prefixed VITE_ to be exposed)
VITE_GEMINI_API_KEY=AIza...            # Required for AI features. Get one at https://aistudio.google.com/apikey
VITE_USE_WORKER_PROXY=false            # Optional. true to route Gemini calls through the Cloudflare Worker
VITE_WORKER_URL=                       # Optional. Worker endpoint URL (used when VITE_USE_WORKER_PROXY=true)
```

### Build

```bash
npm run build        # tsc -b && vite build (output in dist/)
npm run preview      # serve the production build locally
```

### Lint

```bash
npm run lint         # ESLint over the project
```

### Cloudflare Worker (optional, scaffold only)

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put GEMINI_API_KEY
npm run deploy
```

Then in the root `.env`:
```
VITE_USE_WORKER_PROXY=true
VITE_WORKER_URL=https://biolens-gemini-proxy.<your-subdomain>.workers.dev
```
Restart `npm run dev` to pick it up. `worker/wrangler.toml` defaults `ALLOWED_ORIGIN` to `http://localhost:5173`; update for production deploy.

### Vite specifics

- Port: 5173 (hardcoded in `vite.config.ts`).
- Path alias `@/*` → `./src/*` (configured in both `vite.config.ts` and `tsconfig*.json`).
- Strict mode is enabled (`React.StrictMode` wraps `App` in `src/main.tsx`).
- TS target: `es2023`; module resolution: `bundler`; JSX: `react-jsx`.

### 15.5 If You're New To This Project

Recommended onboarding sequence to be productive in under 30 minutes:

1. Read Sections 1–3 of this document (5 min) — understand the problem and shape.
2. Read Section 11 (Demo Flow) — understand how the project is used live.
3. Open `src/lib/ai-prompts.ts` — these prompts are the conceptual core; everything else is plumbing around them.
4. For the deeper AI mental model, read Section 7 of this document (AI Integration Deep Dive).
5. Run `npm install && npm run dev`, then open `http://localhost:5173`. Press Cmd+Shift+D (or Ctrl+Shift+D) to open Director Mode and try each scenario.
6. Skim Section 16 (Limitations) before writing any new code. Know the landmines: synthetic iris, demo-mode short-circuit, speaker-notes drift, duplicate `TriageColor`.

---

## 16. Known Limitations & Trade-offs

A frank list.

- **Iris matching is synthetic in practice.** `src/lib/enrollment.ts` attempts to read `/data/iris_refs/<pilgrim_id>.jpg`, but no such files exist in `public/data/`. The catch branch falls through to `generateSyntheticIris(seed)` — a procedural canvas image. The 5 enrolled embeddings are therefore embeddings of synthetic iris images, and an enrolled embedding's `source` field will be `"synthetic"`. `public/data/iris_embeddings.json` exists but is `[]` (also unused).
- **Demo mode short-circuits the biometric loop.** When `scanMode === "demo"`, `matchEmbedding` forces the result to `demoTargetPilgrimId` with a hard-coded similarity score in `[0.928, 0.981]`. The pipeline still *runs* (MediaPipe + MobileNet still execute) but the output is decoupled from the actual similarity. In live mode against synthetic refs, similarity is the genuine cosine value and `MATCH_THRESHOLD = 0.85` determines `isMatch`.
- **AI hallucination risk.** Gemini can and does invent specifics that look real (e.g. fabricated LVEF percentages, dosages, or follow-up timelines that aren't in the source data). Outputs should be treated as illustrative, not clinical.
- **openFDA gaps.** Many international brand names and some generics return no results. The alias table in `src/lib/openfda.ts` only covers ~10 common AR↔EN drug naming differences (e.g. `acetylsalicylic acid → aspirin`, `salbutamol → albuterol`). Anything outside the table that isn't a US generic is likely to fall through to "AI-knowledge" only.
- **No authentication, no audit logging, no encryption.** Everything is in the browser and accessible to anyone with the URL.
- **API key is in the browser bundle.** `import.meta.env.VITE_GEMINI_API_KEY` is inlined at build time. The Worker proxy (`worker/`) exists but is not deployed by default. Anyone who opens DevTools can read the key.
- **TF.js + MediaPipe is GPU-hungry.** On a weak laptop or thermally-throttled machine, the iris-detection rAF loop can drop below 20fps. The mirror, overlay redraw, and per-frame `detectForVideo` call are the main cost.
- **localStorage size.** Enrollment (5 vectors × 1024 floats × ~8 chars each in JSON) is ~40KB; precache plus openFDA cache can push the total toward ~2MB. Some browsers cap localStorage at 5MB per origin; large precache rebuilds could hit it.
- **All patient JSONs ship to the client.** `_index.json` plus the 5 records all live under `public/data/pilgrims/` and are served as-is. There is no pagination, no on-demand fetch from a backend, and no privacy boundary.
- **Voice quality depends on the host browser.** Browsers ship different `SpeechSynthesisVoice` sets. Safari's `ar-SA` voice is reasonable; Chromium on Linux often has no Arabic voice at all. `findVoice` falls back to a same-prefix voice but the result is unpredictable cross-platform.
- **`lucide-react` v1.16.0 in `package.json`.** This version range is unusual (Lucide is normally ^0.x); icons resolve at runtime so it works in this environment, but the version line in `package.json` is worth verifying before pinning for production.
- **Speaker-notes vs. data drift.** `src/lib/speaker-notes.ts` lists `Aisha` as `pilgrim_002` (sickle cell trait) and `Fatima` as `pilgrim_004` (severe asthma + ICU). The actual JSONs assign Fatima → pilgrim_002 (epilepsy + post-ictal heat stroke), Ayşe → pilgrim_003 (asthma + pregnancy), and Aisha → pilgrim_004 (sickle cell). The data is the ground truth; the speaker notes have not been rewritten to match the most recent JSON content.
- **`TriageColor` is defined three times.** In `src/types/patient.ts`, `src/types/ai.ts`, and `src/types/triage.ts`. They are structurally identical but the duplication exists.
- **`TriageResult` and `translateText` are declared but unused.** Type-only and API-only deadwood respectively.
- **`SOAP cache` is keyed only by pilgrim.** Regenerating the SOAP for the same patient with a different intervention overwrites the previous entry — the intervention is not part of the key.

### 16.5 Common Failure Modes & Fixes

| Symptom                                | Likely cause                              | Fix                                                                  |
|----------------------------------------|-------------------------------------------|----------------------------------------------------------------------|
| 404 on `face_landmarker.task`          | MediaPipe CDN URL outdated                | Update `MODEL_URL`/`WASM_URL` in `src/lib/mediapipe.ts` to a newer version |
| openFDA returns 404 for a known drug   | Drug name not in FDA's generic_name index | Add an entry to the `ALIASES` map in `src/lib/openfda.ts`            |
| Gemini "auth" error                    | API key missing or invalid                | Verify `VITE_GEMINI_API_KEY` in `.env` and rebuild                   |
| Gemini "rate_limit" error              | Free tier RPM/RPD hit                     | Wait, or rebuild precache so demos use cached responses              |
| Voice doesn't speak Arabic             | Browser missing `ar-SA` voice             | Test on Safari/Chrome (macOS); Chromium on Linux often lacks Arabic  |
| Camera permission denied               | Not on localhost or HTTPS                 | `getUserMedia` requires secure context. Use `localhost:5173` or HTTPS |
| Iris detection drops below 20 FPS      | CPU fallback / weak GPU                   | Confirm `delegate: 'GPU'` in `mediapipe.ts`; close other GPU-heavy tabs |
| MobileNet load fails                   | TF.js WebGL backend init error            | Check console for `tf.setBackend` errors; verify `@tensorflow/tfjs` deps |
| Precache "Run" produces 0 entries      | Gemini key not set when called            | Set `VITE_GEMINI_API_KEY` first, then rebuild precache               |
| Triage card stuck on skeleton          | `evaluateTriage` threw, no cached fallback | Check console; verify pilgrim JSON has all required vital fields    |

---

## 17. What Would Production Need

This is a demo; here is what's intentionally missing.

- **Real iris enrollment pipeline.** A secure capture station at visa/arrival, with multiple-sample averaging, quality checks (gaze, occlusion, lighting), and a real iris-specialized model (e.g. OSIRIS or a domain-trained CNN) rather than generic MobileNet on a cropped patch.
- **Backend service + database.** Postgres with row-level encryption for PII. Patient records served via authenticated APIs, not as static JSON in `public/`.
- **Authentication and authorization.** Medic and admin roles, SSO with the Saudi Ministry of Health identity provider, session management.
- **Audit logging.** Every record access logged with who, when, what fields. Required for any health-data regulation environment (KSA's PDPL plus MoH guidance).
- **Licensed drug interaction database.** First DataBank, Lexicomp, or openFDA paid tier — not the public free endpoint, which is heavily rate-limited, US-formulary-biased, and returns inconsistent labels.
- **Hajj permit system integration.** Real linkage to MoH or General Authority of Statistics so that iris → permit number → demographic + travel record is automatic.
- **Multi-tenant support.** Different hospitals, NGOs, Red Crescent teams each need scoped access.
- **Offline-first PWA architecture.** Service worker, IndexedDB-backed records, conflict-resolution sync. Today's localStorage scaffold is only enough for a demo.
- **End-to-end encryption** for any patient data leaving the device (not just TLS; a patient-specific key derived from device + permit).
- **Medical clearance, IRB review, regulatory submissions.** Saudi Food and Drug Authority is the relevant regulator.
- **Real localization.** Today: AR + EN. Production needs at minimum Urdu, Indonesian, Turkish, Hausa, French, Malay, Persian — and bilingual voice synthesis for each.
- **Performance on field hardware.** Production targets paramedic tablets, often older mid-range Android. The TF.js + MediaPipe + Leaflet + Framer Motion stack here is browser-only and not optimized for those constraints.

---

## 18. Glossary

- **AVPU** — Alert / Verbal / Pain / Unresponsive. A 4-level field-tested mental-status assessment. Used in `Patient.demoVitals.consciousness` and in the START protocol.
- **BCP-47** — IETF tag for languages and locales (e.g. `ar-SA`, `en-US`). Used by Web Speech API and i18n.
- **CABG** — Coronary Artery Bypass Graft. Pilgrim 001 had CABG x3 in 2017.
- **Cosine similarity** — A measure of angular closeness between two vectors, scaled to `[-1, 1]`. Used to compare iris embeddings; `1.0` is identical.
- **DivIcon** — A Leaflet `L.divIcon` is an HTML-based map marker (vs. a raster image). Used in `src/lib/map-icons.ts` for the pulsing triage markers.
- **ICD-10** — International Classification of Diseases, 10th revision. Diagnosis codes shown on chronic conditions (e.g. `E11.9` for Type 2 Diabetes).
- **LVEF** — Left Ventricular Ejection Fraction. A cardiac function measure (~55–70% is normal; pilgrim 001's 38% is clinically significant).
- **MediaPipe** — Google's on-device ML toolkit. `FaceLandmarker` produces 478 facial landmarks; indices 468–477 are the iris.
- **MobileNet** — A family of lightweight CNNs designed for on-device inference. We use v2 alpha 1.0 to extract 1024-dim image embeddings.
- **NKDA** — "No Known Drug Allergies." Used in the SOAP prompt fallback.
- **ROSC** — Return of Spontaneous Circulation. Standard cardiac-arrest milestone; not directly used in the demo data but standard EMS vocabulary.
- **SOAP** — Subjective / Objective / Assessment / Plan. The four-part canonical clinical note format.
- **SOAP printable** — A scoped print mode toggled via `body[data-soap-print="active"]` + `@media print` CSS in `src/index.css`.
- **START Protocol** — Simple Triage And Rapid Treatment. A widely-taught civilian mass-casualty triage rule set; the deterministic baseline implemented in `src/lib/triage.ts`.
- **STEMI** — ST-Elevation Myocardial Infarction. Pilgrim 001's presenting suspicion.
- **Stevens-Johnson syndrome** — Severe mucocutaneous drug reaction. Pilgrim 002's sulfa allergy reaction (life-threatening).
- **Triage colors (START):** Classical START uses four colors — RED (immediate), ORANGE (delayed), GREEN (minor), BLACK (expectant). BioLens deliberately simplifies to two: RED = critical, immediate action; GREEN = stable, not immediate. The 2-color scheme is the value space of `TriageColor`.

---

## 19. Credits & Context

- **AI assistance:** The codebase was scaffolded with help from Claude (Anthropic). All medical content and pilgrim records are fictional and authored for demo purposes only.

---

*If the codebase has moved, treat this document as historical reference and verify against the current files cited.*
