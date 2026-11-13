# BioLens — AI Architecture

A conceptual / educational companion to `PROJECT.md`.

---

## 1. What This Document Is (and What It Isn't)

`PROJECT.md` is the **operational reference**: it describes the codebase as it is — every screen, every prop, every file. If you want to know *what the code does*, you read that document.

This file is different. It is the **mental model**. The aim here is to explain *how the AI in BioLens actually works and why it is built the way it is*, in a way that someone comfortable with React but new to AI engineering can follow end-to-end. Every concept is anchored to a real file path so the reader can move from idea to source code without guessing. PROJECT.md tells you *what is there*; this document tells you *why it is there and how it fits together*.

The two files are designed to be read side by side. When a section here says "see PROJECT.md §7 for the verbatim prompts," that is not a hand-wave — that's exactly where the literal strings live, and they're long enough that duplicating them here would just rot.

---

## 2. The Big Idea: Four AI/ML Layers

BioLens is not one model. There is no "the AI" in this codebase. Instead there are **four collaborating AI/ML layers**, each doing one thing well, handing data to the next:

| Layer | Technology        | Type                  | Where it runs        | Pre-trained by |
|-------|-------------------|-----------------------|----------------------|----------------|
| 1     | MediaPipe         | Computer Vision       | Browser (WASM + GPU) | Google         |
| 2     | TF.js MobileNet   | Feature Extraction    | Browser (WebGL)      | Google         |
| 3     | Cosine Similarity | Classical ML / Math   | Browser (pure JS)    | N/A (no model) |
| 4     | Gemini 2.5        | LLM (reasoning)       | Google Cloud (HTTPS) | Google         |

Read top-to-bottom, that is also the data flow:

```
            ┌──────────────────────────────────────────────┐
            │  Webcam frame (HTMLVideoElement, ~30 FPS)    │
            └──────────────────────┬───────────────────────┘
                                   │
                                   ▼
            ┌──────────────────────────────────────────────┐
   LAYER 1  │  MediaPipe FaceLandmarker                    │
            │  → 478 facial landmarks (iris = 468..477)    │
            └──────────────────────┬───────────────────────┘
                                   │  iris bounding box
                                   ▼
            ┌──────────────────────────────────────────────┐
   LAYER 2  │  TF.js MobileNet v2 (alpha 1.0)              │
            │  → 1024-dim embedding (Float32Array)          │
            └──────────────────────┬───────────────────────┘
                                   │  query vector
                                   ▼
            ┌──────────────────────────────────────────────┐
   LAYER 3  │  Cosine similarity vs 5 enrolled vectors     │
            │  → pilgrimId + score (threshold 0.85)         │
            └──────────────────────┬───────────────────────┘
                                   │  patient identity
                                   ▼
            ┌──────────────────────────────────────────────┐
   LAYER 4  │  Gemini 2.5 (cloud, JSON-schema constrained) │
            │  → Top 3 facts, triage, SOAP, interactions   │
            └──────────────────────────────────────────────┘
```

Layers 1–3 run *inside the user's browser*. Only layer 4 makes a network call to Google. That split is not accidental, and section 9 explains why it matters.

---

## 3. Training vs Inference (the foundational concept)

The single most important concept for understanding this codebase:

- **Training** is the slow, expensive part where you show a neural network millions of labeled examples until it learns to map inputs to outputs. Training a model like MobileNet took Google days of GPU time on a dataset (ImageNet) of 1.4M images.
- **Inference** is the cheap, fast part where you take that already-trained model and run it on new inputs.

BioLens is **100% inference, 0% training**. Every model in this codebase was trained by someone else (Google, in all four cases). We load the trained weights and use them.

| Aspect             | Training                           | Inference                           |
|--------------------|------------------------------------|-------------------------------------|
| Who does it        | Model author (Google)              | BioLens (in the browser)          |
| When               | Once, ahead of time                | Every request, in real time         |
| Data needed        | Millions of labeled examples       | One new input                       |
| Compute            | GPU-hours to GPU-weeks             | Milliseconds per call               |
| Code in our repo   | None                               | All of `src/lib/{mediapipe,tensorflow,cosine,gemini}.ts` |

This is not a workaround. It is the dominant pattern in modern AI engineering. Almost every AI-first product you've used in the last three years — Cursor, Notion AI, Perplexity, GitHub Copilot — is inference-only on top of someone else's foundation model. The product is the *pipeline*, not the weights.

---

## 4. Why We Didn't Train Our Own CNN in Python

If you are new to AI engineering you may be tempted to think "real" AI means training a custom convolutional neural network on iris images. Let's be frank about why that would have been the wrong call here, even ignoring the short build timeline.

- **Data.** A serious iris classifier needs on the order of 50,000 labeled iris images. We have zero. The CASIA-IrisV4 dataset is gated and the few open alternatives are too small and too uniform to generalize.
- **Compute.** Training even a small CNN from scratch is GPU-hours of work. The prototype is built and run on a single laptop.
- **Expertise.** Architecture choice, loss function, batch size, learning-rate schedule, train/val split, augmentation strategy — every one of those is its own rabbit hole.
- **Time.** Realistically 2–4 weeks of full-time work to do this competently. Integrating MediaPipe took roughly three minutes (`src/lib/mediapipe.ts` is 96 lines).
- **Quality.** MediaPipe's face/iris landmarker was trained by Google on tens of millions of faces with industrial-grade labeling. Our hypothetical custom model would almost certainly be worse, not better.
- **Deployment.** A self-trained PyTorch model runs in Python. The BioLens app runs in the browser. Adding a Python backend just to host a worse model is a strict downgrade.

When should you train your own model? Generally when at least one of these is true:

| Reason                          | Applies to BioLens? |
|---------------------------------|-----------------------|
| Domain-specific medical imaging (rare-disease X-rays, custom histology) | No |
| Proprietary data that can't leave premises | No — we have no proprietary data |
| Research goal: novel architecture or capability | No — this is product work |
| Latency / size budget unreachable by off-the-shelf models | No — MobileNet already runs in ~50 ms |

Zero rows say "yes." Pre-trained is the correct choice.

---

## 5. Layer 1: MediaPipe (Computer Vision)

**What it does.** Takes a video frame and returns the precise (x, y) coordinates of 478 landmarks on the face — eyebrows, lip corners, nose tip, and, critically for us, the iris contour of both eyes. BioLens uses only the iris indices and ignores the rest.

**Model details.**
- Package: `@mediapipe/tasks-vision` `^0.10.35` (see `package.json`)
- Model file: `face_landmarker.task`, ~5 MB, float16 weights
- Loaded from: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`
- WASM runtime loaded from: `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm`
- Execution: GPU delegate (`delegate: "GPU"`), `VIDEO` running mode, `numFaces: 1`

**Input.** An `HTMLVideoElement` plus a monotonically increasing timestamp.

**Output.** A `FaceLandmarkerResult` containing 478 normalized `(x, y, z)` points. BioLens pulls out the iris ring:

- Right iris center: index **468**
- Right iris contour: indices **469, 470, 471, 472**
- Left iris center: index **473**
- Left iris contour: indices **474, 475, 476, 477**

These indices are defined as a constant in code:

```ts
// src/lib/mediapipe.ts:35
export const IRIS_INDICES = {
  rightCenter: 468,
  right: [469, 470, 471, 472],
  leftCenter: 473,
  left: [474, 475, 476, 477],
} as const;
```

**Where it lives in our code.**
- Model lifecycle (singleton load, lazy init): `src/lib/mediapipe.ts:15` `getFaceLandmarker`
- Per-frame iris extraction + bounding-box padding: `src/lib/mediapipe.ts:63` `extractIrisData`
- The per-frame render loop that calls `detectForVideo`: `src/hooks/useIrisDetection.ts:34` `tick`

**Performance.** With the GPU delegate this runs at roughly 30 FPS on a modern laptop. The `useIrisDetection` hook measures live FPS in a 1-second window (`useIrisDetection.ts:54`) and exposes it to the UI. Errors during a frame are swallowed and the loop continues — see `useIrisDetection.ts:49`.

---

## 6. Layer 2: TF.js MobileNet (Feature Extraction)

**What it does.** Takes the cropped iris region and converts it into a **1024-dimensional vector** — a list of 1024 floating-point numbers. That vector is the iris's *signature*. Two photos of the same iris produce two vectors that are close together in 1024-dim space; two photos of *different* irises produce vectors that are far apart. This vector is called an **embedding**.

**Model details.**
- Packages: `@tensorflow/tfjs ^4.22.0`, `@tensorflow-models/mobilenet ^2.1.1`
- Model variant: `mobilenet.load({ version: 2, alpha: 1.0 })` — MobileNet v2 at full width
- Pre-trained on: ImageNet (1.4M images across 1000 object classes)
- Execution: WebGL backend
- Input shape: `[224, 224, 3]` RGB tensor (a constant in `src/lib/constants.ts:9` `IRIS_CROP_SIZE = 224`)
- Output shape: `[1, 1024]` — flattened into a `Float32Array` of length 1024

**Where it lives in our code.**
- Model lifecycle: `src/lib/tensorflow.ts:9` `getEmbeddingModel`
- Iris-region crop into a tensor: `src/lib/tensorflow.ts:21` `cropToTensor`
- Embedding extraction (calls `model.infer(tensor, true)` — the `true` flag asks for the penultimate layer's activations, *not* the 1000-class softmax): `src/lib/tensorflow.ts:49` `extractEmbedding`
- The hook that orchestrates capture → crop → embed → match: `src/hooks/useIrisMatching.ts:26` `run`

### What an embedding IS, conceptually

This is the single most important concept in modern AI. It deserves a careful explanation.

An **embedding** is a vector of numbers that represents the *essence* of an input as a point in a high-dimensional space. The neural network has learned, during its original training, to arrange its internal representations such that **inputs that "mean" similar things end up near each other**, and inputs that mean different things end up far apart.

For MobileNet trained on ImageNet, "similar" was originally defined by visual category — two photos of cats end up near each other; a photo of a cat and a photo of an airplane end up far apart. But the representation is rich enough that it transfers cleanly to other visual tasks: two photos of the same iris end up much closer than two photos of different irises, even though MobileNet has never seen an iris labeled as such.

This trick — using a pre-trained network's penultimate layer as a generic visual feature extractor — is called **transfer learning** or **feature extraction**, and it is the workhorse of practical computer vision.

The same idea powers:

- **Apple Face ID.** Your face becomes a vector; unlock = "is this vector close enough to the enrolled one?"
- **Google Image Search.** Every indexed image has an embedding; "find similar images" = nearest neighbours in embedding space.
- **Spotify recommendations.** Songs and users become vectors; you get recommended songs whose vectors are near yours.
- **Semantic text search / RAG.** Sentences become vectors via a text model; "find relevant passages" = cosine similarity in embedding space.

If you understand embeddings + cosine similarity, you understand the operating model of a large fraction of all production AI systems.

---

## 7. Layer 3: Cosine Similarity (Matching)

**What it does.** Given the query embedding from Layer 2 and the five enrolled embeddings stored in localStorage, it answers: *which enrolled pilgrim is this most likely to be, and is the match confident enough to act on?*

**This is not a neural network.** There are no weights, no training. It is a single linear-algebra formula that measures the angle between two vectors. The closer the angle to zero (the more parallel they point), the more similar the vectors.

**Formula.**

```
cosine(A, B) = dot(A, B) / (|A| * |B|)
```

Result is bounded in [−1, 1]. For non-negative embeddings like MobileNet's, the practical range is roughly [0, 1].

**Implementation** (`src/lib/cosine.ts:1`):

```ts
export function cosineSimilarity(a, b) {
  if (a.length !== b.length) throw new Error("Vector length mismatch");
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot   += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
```

Sixteen lines. That's the entire matcher.

**Threshold.** `MATCH_THRESHOLD = 0.85` in `src/lib/constants.ts:8`. A similarity ≥ 0.85 is reported as a match.

**Demo override.** Because synthetic enrollment vectors don't produce realistic similarities for a live demo, `src/lib/matching.ts:6` defines `DEMO_BASELINE_SIMILARITY` per pilgrim:

```ts
const DEMO_BASELINE_SIMILARITY: Record<string, number> = {
  pilgrim_001: 0.967,
  pilgrim_002: 0.943,
  pilgrim_003: 0.981,
  pilgrim_004: 0.952,
  pilgrim_005: 0.928,
};
```

In `scanMode === "demo"` with a `demoTargetPilgrimId` set, `matchEmbedding` returns the rigged similarity instead of the raw computed one — see `src/lib/matching.ts:33`. Live mode (`scanMode === "live"`) uses the real cosine score and the 0.85 threshold.

**Where it lives.**
- Pure math: `src/lib/cosine.ts`
- Ranking + threshold + demo override: `src/lib/matching.ts`
- Enrollment of the 5 reference vectors: `src/lib/enrollment.ts` (loads `/data/iris_refs/pilgrim_00X.jpg`, falls back to `generateSyntheticIris` from `src/lib/iris-refs.ts` when the file is missing)

---

## 8. Layer 4: Gemini (LLM Reasoning)

The first three layers do *identification*. Layer 4 does *reasoning over a chart*: read the patient record we just identified and produce something clinically useful.

This layer is qualitatively different from the others.

| Aspect          | Layers 1–3 (Browser)                  | Layer 4 (Cloud)                        |
|-----------------|---------------------------------------|----------------------------------------|
| Execution       | User's GPU / CPU                      | Google's servers                       |
| Internet needed | Only for initial model download       | Every single call                      |
| Latency         | <50 ms per stage                      | 1–5 seconds per call                   |
| Cost            | Free                                  | Quota-limited (see PROJECT.md §7.7)    |
| Failure mode    | Rare; degraded landmarks at worst     | Network errors, rate limits, auth, parse |

**Client.** `@google/generative-ai ^0.24.1`, wrapped in `src/lib/gemini.ts`. Two entry points:

- `generateStructured<T>(system, user, schema, opts)` — `responseMimeType: "application/json"` + `responseSchema`. Used everywhere a typed object is expected.
- `generateText(system, user, opts)` — free-form text. Used only for `translateFacts` in `src/lib/translation.ts:31` because the response is a whole JSON document and the schema would be unwieldy.

**Models.** `gemini-2.5-flash` is the default for low-latency tasks; `gemini-2.5-pro` is used for the harder reasoning tasks (triage, SOAP, drug interactions). Defaults live in `src/lib/gemini.ts:30`.

**Retry policy.** Up to `maxRetries: 2` with exponential backoff: `400 * 2^attempt` ms — see `src/lib/gemini.ts:78`. Non-retryable errors (e.g. `auth`) short-circuit. Every call increments `geminiCallCount` in the store (`gemini.ts:60`), which the Dashboard and DirectorPanel surface live.

**The five Gemini tasks.**

| Task                | Entry point                                     | Model              | Schema                          |
|---------------------|-------------------------------------------------|--------------------|---------------------------------|
| Top 3 Life-Saving Facts | `src/lib/ai-filtering.ts:10` `fetchTopFacts`   | gemini-2.5-flash   | `lifeSavingFactsSchema`         |
| Triage Context (LLM half of START hybrid) | `src/lib/ai-triage.ts:11` `evaluateTriage` | gemini-2.5-pro     | `triageContextSchema`           |
| Translation         | `src/lib/translation.ts:11` `translateText` / `:24` `translateFacts` | gemini-2.5-flash   | `translationSchema` (or free text) |
| SOAP Note           | `src/lib/soap.ts:7` `generateSOAPNote`          | gemini-2.5-pro     | `soapNoteSchema`                |
| Drug Interactions   | `src/lib/drug-interactions.ts:23` `checkInteractions` | gemini-2.5-pro | `interactionAnalysisSchema`     |

The verbatim prompts (system + user-template) all live in `src/lib/ai-prompts.ts` and `src/lib/drug-interactions.ts:6`. Schemas live in `src/lib/ai-schemas.ts`. For the full prompt text and per-task design notes, defer to **PROJECT.md §7**.

---

## 9. Browser vs Cloud: The Architectural Split

```
┌────────────────────────────────────────────────────────────────┐
│ BROWSER (the paramedic's device)                               │
│                                                                │
│   MediaPipe ────► MobileNet ────► Cosine ────► Zustand store   │
│       (CV)        (embedding)     (match)      (single source) │
│                                                    │           │
│                                                    ▼           │
│                                             React UI (pages,   │
│                                             components)        │
│                                                                │
└───────────────────────────────┬────────────────────────────────┘
                                │
                          HTTPS │ (only Gemini + openFDA)
                                │
┌───────────────────────────────┴────────────────────────────────┐
│ CLOUD                                                          │
│                                                                │
│   Google AI: Gemini 2.5 (Flash + Pro)                          │
│   openFDA:   https://api.fda.gov/drug/label.json              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

The implications are not just stylistic; they shape what BioLens is good at:

- **Privacy.** The iris embedding never leaves the device. The cosine match never leaves the device. The only thing that crosses the wire is *the patient's chart* once they're already identified — and even that is the existing JSON record being sent up as part of a prompt.
- **Resilience.** Once MediaPipe's `.task` file and MobileNet's weights are cached by the browser, identification (layers 1–3) keeps working offline. Only the Gemini features degrade. PROJECT.md §11 documents the `biolens:gemini-error` event and failsafe banner that surface this.
- **Cost.** The expensive parts (real-time CV at 30 FPS, embedding extraction, similarity search) are free — they run on the user's hardware. Only Gemini calls metered against a quota.
- **Speed.** Identification is sub-second end-to-end. The user-facing 850 ms in `useIrisMatching` is *artificial pacing* (two `setTimeout`s at `useIrisMatching.ts:36` and `:51`) so the stage transitions register visually. The real work is faster than that. Gemini features add 1–5 s of cloud round-trip on top.

---

## 10. How the Dashboard Communicates with AI Without Calling AI

A subtle but important pattern. The Dashboard page renders Gemini-generated content (Top 3 facts, triage colors, SOAP notes, interactions) but makes **zero direct AI calls**. A grep proves it:

```
$ grep -n "fetchTopFacts\|generateSOAPNote\|checkInteractions\|evaluateTriage\|matchEmbedding\|extractEmbedding" src/pages/Dashboard.tsx
(no matches)
```

The pattern is **single source of truth via Zustand**:

- AI-*producing* components write results into `useAppStore`.
- AI-*consuming* components read from the same store.
- The Dashboard is purely a consumer — it aggregates already-computed data.

```
   AI producers (write to store)              Store slice           AI consumers (read)
   ─────────────────────────────────────────────────────────────────────────────────────
   PatientProfile.tsx → fetchTopFacts ──────► topFactsCache  ──────► Dashboard, TopThreeFacts
   TriageGroup.tsx    → evaluateTriage ─────► triageDecisions ─────► Dashboard, triage UI
   SOAPDialog.tsx     → generateSOAPNote ───► soapCache       ─────► Dashboard
   DrugInteractions   → checkInteractions ──► interactionCache ────► Dashboard
   useIrisMatching    → matchEmbedding ─────► matchHistory     ────► Dashboard
   gemini.ts          → increment counter ──► geminiCallCount  ────► Dashboard, DirectorPanel
```

The store definition is `src/store/appStore.ts`:
- `topFactsCache: Record<string, LifeSavingFactsResponse>` — line 45
- `triageDecisions: Record<string, TriageContextDecision>` — line 48
- `soapCache: Record<string, SOAPNote>` — line 60
- `interactionCache: Record<string, InteractionAnalysis>` — line 63
- `matchHistory: {pilgrimId, similarity, timestamp}[]` — line 74
- `geminiCallCount: number` — line 71

Why this matters: the Dashboard renders **instantly** because it's not triggering inference, it's reading completed results out of memory. The `precache` system (`src/lib/precache.ts`) takes this one step further — at startup it pre-runs every Gemini task for every patient and dumps the results into the store via `hydrateStoresFromPrecache` (`precache.ts:132`), so even the first patient visit feels instantaneous.

---

## 11. Full Data Flow: From Camera to Top 3 Facts

A trace of the path a frame takes from `/scan` to the rendered Top 3 cards on `/patient/<id>`. Each step cites the file/function involved.

```
  /scan                                            /patient/<id>
  ─────                                            ─────────────
  1. user grants camera                            14. PatientProfile mounts
  2. video stream begins                           15. fetchPatient(id) reads JSON
  3. iris detection loop runs                      16. fetchTopFacts (cache miss path)
  4. landmarks per frame                           17. POST to Google AI
  5. iris bounding box                             18. JSON parsed vs schema
  6. lock-on rings + beep                          19. setTopFacts() writes store
  7. user taps Identify                            20. TopThreeFacts re-renders
  8. matching pipeline begins
  9.  → capturing
  10. → extracting (embedding)
  11. → matching (cosine)
  12. SuccessOverlay (1.5s)
  13. navigate to /patient/<id>
```

Step by step:

1. **Camera access.** `useCamera` hook acquires `getUserMedia`, attaches the stream to a hidden `<video>`. Source: `src/hooks/useCamera.ts`.
2. **Video plays.** The video element's `readyState >= 2` gates frame processing in step 4.
3. **Detection loop starts.** `useIrisDetection.ts:24` mounts an effect that `getFaceLandmarker()` then enters a `requestAnimationFrame` loop at `useIrisDetection.ts:34`.
4. **Per-frame MediaPipe.** `landmarker.detectForVideo(video, ts)` at `useIrisDetection.ts:41` returns the 478-point result.
5. **Iris extraction.** `extractIrisData(result)` at `src/lib/mediapipe.ts:63` reads indices 468–477 and computes padded bounding boxes for both eyes.
6. **Lock-on UX.** The `IrisLockOn` component animates rings around the detected iris; `playLockBeep()` fires once on the rising edge of `nowLocked` (`useIrisDetection.ts:45`).
7. **User taps Identify.** The Scan page calls `useIrisMatching().run(video, irisData)` (`src/hooks/useIrisMatching.ts:26`).
8. **Stage: capturing.** `playStageAdvance()` and a 350 ms pacing delay (`useIrisMatching.ts:36`).
9. **Pick the better eye.** Whichever bounding box is wider is chosen — `useIrisMatching.ts:32`.
10. **Stage: extracting.** `cropToTensor(video, bbox.*)` at `src/lib/tensorflow.ts:21` rasterizes the iris region into a 224×224 canvas and reads it as a `tf.Tensor3D`. Then `extractEmbedding(tensor)` at `src/lib/tensorflow.ts:49` runs `model.infer(tensor, true)` to get a 1024-dim `Float32Array`.
11. **Stage: matching.** A 500 ms pacing delay, then `matchEmbedding(embedding)` at `src/lib/matching.ts:21`. This loads the 5 enrolled vectors via `getEnrolledEmbeddings()` (`src/lib/enrollment.ts:56`), computes `cosineSimilarity` against each, sorts descending, and applies either the real 0.85 threshold or the demo override.
12. **Success path.** `addMatchToHistory` writes into the store (`useIrisMatching.ts:56`), stage flips to `success`, `playSuccessChime`. SuccessOverlay animates for ~1.5 s.
13. **Navigation.** `navigate('/patient/<id>')` — the React Router transition.
14. **PatientProfile mounts.** `src/pages/PatientProfile.tsx` reads the `id` param.
15. **Patient JSON resolves.** `fetchPatient(id)` from `src/lib/patients.ts` loads `/data/pilgrims/<id>.json`.
16. **Top-facts effect.** If `topFactsCache[id]` already has facts (e.g. from precache), this is a no-op. Otherwise `fetchTopFacts(patient)` is called (`PatientProfile.tsx:87`).
17. **HTTPS to Gemini.** `fetchTopFacts` → `generateStructured` → `callDirect` → `GoogleGenerativeAI.getGenerativeModel(...).generateContent(...)` (`src/lib/gemini.ts:101`).
18. **Schema-validated parse.** Response text is `JSON.parse`'d; the schema in `lifeSavingFactsSchema` (`src/lib/ai-schemas.ts:3`) is what told Gemini to emit a 3-element `facts[]` array with specific enum'd icons and criticalities. Bad JSON → `invalid_response` error, retryable.
19. **Store write.** `setTopFacts(id, res)` (`PatientProfile.tsx:93`).
20. **Re-render.** `TopThreeFacts` reads `topFactsCache[id]` from the store and renders the three cards.

The user perceives this as: tap → 850 ms of identification animation → patient page → cards appear (instantly if precached, ~1–3 s otherwise).

---

## 12. Industry Context: Why This is "Real AI Engineering"

A common misconception: "you're just calling an API, that's not AI." Worth addressing head-on.

Consider what these companies are, at the API level:

- **Cursor** ($9B+ valuation) is an editor that calls OpenAI and Anthropic APIs.
- **Notion AI** is Notion calling OpenAI APIs.
- **GitHub Copilot** is VS Code calling OpenAI Codex / GPT.
- **Perplexity** is a search UI calling Claude and GPT.

The defensible value is almost never *where the model runs*. It is **how the model is orchestrated**:

- The **pipeline design**: which model handles which task, in which order, with what fallbacks.
- The **prompt engineering**: system instructions tight enough that the output is reliably usable. BioLens's prompts in `src/lib/ai-prompts.ts` enforce character limits, ranking order, enum'd icons, "don't say 'monitor patient'", "cite a specific medical fact in reasoning". Each of those rules is a debugged behavior.
- The **schemas**: `responseSchema` + `responseMimeType: "application/json"` (`src/lib/gemini.ts:96`) turns Gemini from a chatbot into a typed function. The schema in `src/lib/ai-schemas.ts` is what makes `LifeSavingFactsResponse` a TypeScript type the rest of the app can rely on.
- The **fallbacks**: the precache (`src/lib/precache.ts`) so a network failure mid-demo doesn't break the experience; the failsafe banner driven by the `biolens:gemini-error` event (`src/lib/gemini.ts:43`); the synthetic-iris fallback in `enrollment.ts:32` when reference images are missing.
- The **integration with classical components**: in `src/lib/ai-triage.ts:11`, the deterministic START Protocol rules (`src/lib/triage.ts`) run *first*, then Gemini-2.5-pro is asked to confirm or adjust the color, and the system uses two colors (red/green) with no irreversible states. That hybrid — rules first, LLM-as-second-opinion — is exactly the pattern serious medical AI products use, and it's hard to get right.

That last point bears repeating: `ai-triage.ts` is roughly 30 lines, but it encodes a real engineering decision about when to trust an LLM and when not to. That kind of orchestration is the actual job.

---

## 13. Where to Look in the Code (Quick Reference)

| To understand...                | Open...                                                |
|---------------------------------|--------------------------------------------------------|
| Iris detection                  | `src/lib/mediapipe.ts`, `src/hooks/useIrisDetection.ts` |
| Embedding extraction            | `src/lib/tensorflow.ts`                                |
| Similarity matching             | `src/lib/cosine.ts`, `src/lib/matching.ts`             |
| Enrollment (synthetic refs)     | `src/lib/enrollment.ts`, `src/lib/iris-refs.ts`        |
| Matching pipeline (stages)      | `src/hooks/useIrisMatching.ts`                         |
| Gemini client                   | `src/lib/gemini.ts`                                    |
| All AI prompts                  | `src/lib/ai-prompts.ts` (+ `drug-interactions.ts:6`)   |
| All AI schemas                  | `src/lib/ai-schemas.ts`                                |
| AI triage hybrid                | `src/lib/ai-triage.ts`, `src/lib/triage.ts`            |
| Top 3 facts task                | `src/lib/ai-filtering.ts`                              |
| SOAP note task                  | `src/lib/soap.ts`                                      |
| Translation task                | `src/lib/translation.ts`                               |
| Drug interactions               | `src/lib/drug-interactions.ts`, `src/lib/openfda.ts`   |
| Pre-cache (resilience)          | `src/lib/precache.ts`                                  |
| Where AI results live           | `src/store/appStore.ts`                                |
| Constants (threshold, dims)     | `src/lib/constants.ts`                                 |

---

## 14. Glossary

Terms used above, in the order a learner usually meets them. PROJECT.md has the medical glossary; this one is AI-specific.

- **Inference.** Running a trained model on a new input. The cheap, fast, in-production half of an ML system. BioLens is 100% inference.
- **Embedding.** A vector of numbers — for us, length 1024 — that represents the "essence" of an input as a point in a high-dimensional space. Inputs with similar meaning are close together; dissimilar ones are far apart. The foundation of modern similarity search, face recognition, and semantic retrieval.
- **Pre-trained model.** A model whose weights were learned by someone else (here: Google) and which we just load and use. All four AI layers in BioLens are pre-trained.
- **Fine-tuning.** Continuing to train a pre-trained model on a small task-specific dataset to specialize it. BioLens does *not* fine-tune — we have no labeled data, and the embedding quality is already good enough for a 5-pilgrim demo.
- **Foundation model.** A very large pre-trained model intended to be used as a base for many downstream tasks. Gemini 2.5 is the foundation model here; MobileNet is a smaller, older example of the same idea for vision.
- **Prompt engineering.** Writing the system + user instructions such that the model reliably emits the output you want. See `src/lib/ai-prompts.ts` for ours.
- **Structured output / `responseSchema`.** A constraint passed to the model that forces its output to conform to a JSON schema. Turns a chatbot into a typed function. Used everywhere in `src/lib/gemini.ts` except `translateFacts`.
- **Temperature.** A parameter (0–1+) that controls how random the model's sampling is. Lower = more deterministic. BioLens defaults to 0.3 (`gemini.ts:33`), drops to 0.1 for translation and interactions, and uses 0.2 for triage and SOAP.
- **RAG (Retrieval-Augmented Generation).** The pattern of fetching relevant documents from a vector store at query time and stuffing them into the prompt. BioLens does *not* use RAG — the patient record is small enough that we just inject the whole thing into the user prompt verbatim (see `buildLifeSavingFactsUserPrompt` in `ai-prompts.ts:14`).
- **Hallucination.** When an LLM emits a fluent but wrong claim. In BioLens this would be e.g. inventing a drug interaction or fabricating a dose. Mitigations in this codebase: strict schemas, low temperature, openFDA grounding for interactions (`drug-interactions.ts`), START Protocol as a deterministic floor for triage (`ai-triage.ts`), and the "this is a demo, not for clinical use" disclaimer surface.
- **Multi-modal AI.** A system that operates across multiple modalities (vision, text, audio). BioLens qualifies: vision (MediaPipe + MobileNet) → identity → text reasoning (Gemini) → optional audio (browser TTS in `useVoiceOutput.ts`). The chain of modalities, not any single model in it, is what makes the system multi-modal.
