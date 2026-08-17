export const ROUTES = {
  HOME: "/",
  SCAN: "/scan",
  PATIENT: "/patient/:id",
  TRIAGE: "/triage",
} as const;

export const MATCH_THRESHOLD = 0.85;
export const IRIS_CROP_SIZE = 224;
export const EMBEDDING_DIM = 1024;
