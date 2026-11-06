/**
 * Demo-only build flag. When VITE_DEMO_ONLY === "true" the app never calls
 * Gemini (or openFDA) and serves AI output exclusively from the shipped
 * precache. Vite inlines this as a literal, so dead branches are dropped.
 */
export const DEMO_ONLY: boolean = import.meta.env.VITE_DEMO_ONLY === "true";

export class DemoModeError extends Error {
  readonly code = "demo_mode";
  constructor() {
    super("Demo mode — live AI disabled");
    this.name = "DemoModeError";
  }
}

export function isDemoModeError(err: unknown): err is DemoModeError {
  return err instanceof DemoModeError;
}
