import {
  FaceLandmarker,
  FilesetResolver,
  type FaceLandmarkerResult,
} from "@mediapipe/tasks-vision";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task";
const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";

let landmarkerInstance: FaceLandmarker | null = null;
let landmarkerPromise: Promise<FaceLandmarker> | null = null;

export async function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (landmarkerInstance) return landmarkerInstance;
  if (landmarkerPromise) return landmarkerPromise;

  landmarkerPromise = (async () => {
    const vision = await FilesetResolver.forVisionTasks(WASM_URL);
    const instance = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
      runningMode: "VIDEO",
      numFaces: 1,
      outputFaceBlendshapes: false,
      outputFacialTransformationMatrixes: false,
    });
    landmarkerInstance = instance;
    return instance;
  })();

  return landmarkerPromise;
}

export const IRIS_INDICES = {
  rightCenter: 468,
  right: [469, 470, 471, 472],
  leftCenter: 473,
  left: [474, 475, 476, 477],
} as const;

export interface IrisPoint {
  x: number;
  y: number;
}

export interface IrisBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface IrisData {
  rightCenter: IrisPoint;
  rightPoints: IrisPoint[];
  leftCenter: IrisPoint;
  leftPoints: IrisPoint[];
  rightBoundingBox: IrisBoundingBox;
  leftBoundingBox: IrisBoundingBox;
}

export function extractIrisData(result: FaceLandmarkerResult): IrisData | null {
  if (!result.faceLandmarks || result.faceLandmarks.length === 0) return null;
  const lm = result.faceLandmarks[0];
  if (lm.length < 478) return null;

  const rightCenter = { x: lm[468].x, y: lm[468].y };
  const rightPoints = IRIS_INDICES.right.map((i) => ({ x: lm[i].x, y: lm[i].y }));
  const leftCenter = { x: lm[473].x, y: lm[473].y };
  const leftPoints = IRIS_INDICES.left.map((i) => ({ x: lm[i].x, y: lm[i].y }));

  const bbox = (points: IrisPoint[]): IrisBoundingBox => {
    const xs = points.map((p) => p.x);
    const ys = points.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const w = maxX - minX;
    const h = maxY - minY;
    const padX = w * 0.75;
    const padY = h * 0.75;
    return { x: minX - padX, y: minY - padY, width: w + 2 * padX, height: h + 2 * padY };
  };

  return {
    rightCenter,
    rightPoints,
    leftCenter,
    leftPoints,
    rightBoundingBox: bbox(rightPoints),
    leftBoundingBox: bbox(leftPoints),
  };
}
