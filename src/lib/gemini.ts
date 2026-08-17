import {
  GoogleGenerativeAI,
  type ResponseSchema,
} from "@google/generative-ai";
import type { GeminiModel, GeminiError } from "@/types/ai";
import { useAppStore } from "@/store/appStore";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const USE_WORKER = import.meta.env.VITE_USE_WORKER_PROXY === "true";
const WORKER_URL = import.meta.env.VITE_WORKER_URL as string;

if (!API_KEY && !USE_WORKER) {
  console.warn(
    "[BioLens] VITE_GEMINI_API_KEY missing in .env. AI features will fail.",
  );
}

let clientInstance: GoogleGenerativeAI | null = null;
function getClient(): GoogleGenerativeAI {
  if (!clientInstance) clientInstance = new GoogleGenerativeAI(API_KEY);
  return clientInstance;
}

export interface GenerateOptions {
  model?: GeminiModel;
  temperature?: number;
  maxRetries?: number;
}

const DEFAULT_OPTIONS: Required<GenerateOptions> = {
  model: "gemini-2.5-flash",
  temperature: 0.3,
  maxRetries: 2,
};

function emitGeminiError(err: unknown): void {
  if (typeof window === "undefined") return;
  try {
    const detail =
      err && typeof err === "object" && "message" in err
        ? (err as { message: string }).message
        : String(err);
    window.dispatchEvent(
      new CustomEvent("biolens:gemini-error", { detail }),
    );
  } catch {
    /* ignore */
  }
}

export async function generateStructured<T>(
  systemPrompt: string,
  userPrompt: string,
  responseSchema: ResponseSchema,
  options: GenerateOptions = {},
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;

  useAppStore.getState().incrementGeminiCallCount();

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      if (USE_WORKER && WORKER_URL) {
        return await callViaWorker<T>(
          systemPrompt,
          userPrompt,
          responseSchema,
          opts,
        );
      }
      return await callDirect<T>(systemPrompt, userPrompt, responseSchema, opts);
    } catch (err) {
      lastError = err;
      const e = err as GeminiError | Error;
      const retryable = "retryable" in e ? e.retryable : true;
      if (!retryable || attempt === opts.maxRetries) break;
      await new Promise((r) => setTimeout(r, 400 * Math.pow(2, attempt)));
    }
  }
  emitGeminiError(lastError);
  throw lastError;
}

async function callDirect<T>(
  system: string,
  user: string,
  schema: ResponseSchema,
  opts: Required<GenerateOptions>,
): Promise<T> {
  const client = getClient();
  const model = client.getGenerativeModel({
    model: opts.model,
    systemInstruction: system,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: schema,
      temperature: opts.temperature,
    },
  });
  const result = await model.generateContent(user);
  const text = result.response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw {
      code: "invalid_response",
      message: `Failed to parse Gemini JSON: ${text.slice(0, 200)}`,
      retryable: true,
    } as GeminiError;
  }
}

async function callViaWorker<T>(
  system: string,
  user: string,
  schema: ResponseSchema,
  opts: Required<GenerateOptions>,
): Promise<T> {
  const res = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system,
      user,
      schema,
      model: opts.model,
      temperature: opts.temperature,
    }),
  });
  if (!res.ok) {
    const code =
      res.status === 401 || res.status === 403
        ? "auth"
        : res.status === 429
          ? "rate_limit"
          : "network";
    throw {
      code,
      message: `Worker returned ${res.status}`,
      retryable: code !== "auth",
    } as GeminiError;
  }
  return res.json();
}

export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  options: GenerateOptions = {},
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  useAppStore.getState().incrementGeminiCallCount();
  const client = getClient();
  const model = client.getGenerativeModel({
    model: opts.model,
    systemInstruction: systemPrompt,
    generationConfig: { temperature: opts.temperature },
  });
  try {
    const result = await model.generateContent(userPrompt);
    return result.response.text();
  } catch (err) {
    emitGeminiError(err);
    throw err;
  }
}
