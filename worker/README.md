# BioLens — Gemini Proxy Worker

A Cloudflare Worker that proxies requests from the BioLens frontend to the
Gemini API. Keeps `GEMINI_API_KEY` out of the browser bundle for production.

**Status:** scaffold only. Not deployed. Direct frontend calls are used in dev.

## Deploying

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put GEMINI_API_KEY   # paste your key when prompted
npm run deploy
```

`wrangler deploy` prints the worker URL — copy it.

## Wire the frontend to the deployed worker

In the project root `.env`:

```
VITE_USE_WORKER_PROXY=true
VITE_WORKER_URL=https://biolens-gemini-proxy.<your-subdomain>.workers.dev
```

Restart `npm run dev`. The frontend will route all `generateStructured` calls
through the worker instead of calling Gemini directly.

## CORS

`ALLOWED_ORIGIN` is set in `wrangler.toml` to `http://localhost:5173` for dev.
Update it to your production origin before deploying for real use.

## Request contract

`POST /` with JSON body:

```json
{
  "system": "...",
  "user": "...",
  "schema": { ... },
  "model": "gemini-2.5-flash",
  "temperature": 0.3
}
```

Response is the parsed `application/json` payload from Gemini.
