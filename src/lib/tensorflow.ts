import * as tf from "@tensorflow/tfjs";
import * as mobilenet from "@tensorflow-models/mobilenet";

import { IRIS_CROP_SIZE } from "./constants";

let modelInstance: mobilenet.MobileNet | null = null;
let modelPromise: Promise<mobilenet.MobileNet> | null = null;

export async function getEmbeddingModel(): Promise<mobilenet.MobileNet> {
  if (modelInstance) return modelInstance;
  if (modelPromise) return modelPromise;
  modelPromise = (async () => {
    await tf.ready();
    const m = await mobilenet.load({ version: 2, alpha: 1.0 });
    modelInstance = m;
    return m;
  })();
  return modelPromise;
}

export function cropToTensor(
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
  cropX: number,
  cropY: number,
  cropW: number,
  cropH: number,
  outSize = IRIS_CROP_SIZE,
): tf.Tensor3D {
  const srcW =
    (source as HTMLVideoElement).videoWidth ??
    (source as HTMLCanvasElement | HTMLImageElement).width;
  const srcH =
    (source as HTMLVideoElement).videoHeight ??
    (source as HTMLCanvasElement | HTMLImageElement).height;

  const sx = Math.max(0, cropX * srcW);
  const sy = Math.max(0, cropY * srcH);
  const sw = Math.min(srcW - sx, cropW * srcW);
  const sh = Math.min(srcH - sy, cropH * srcH);

  const off = document.createElement("canvas");
  off.width = outSize;
  off.height = outSize;
  const ctx = off.getContext("2d")!;
  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, outSize, outSize);
  return tf.browser.fromPixels(off);
}

export async function extractEmbedding(tensor: tf.Tensor3D): Promise<Float32Array> {
  const model = await getEmbeddingModel();
  const embedding = tf.tidy(() => {
    return model.infer(tensor, true) as tf.Tensor;
  });
  const data = (await embedding.data()) as Float32Array;
  embedding.dispose();
  tensor.dispose();
  return data;
}

export async function extractEmbeddingFromImage(
  url: string,
  bbox?: { x: number; y: number; width: number; height: number },
): Promise<Float32Array> {
  const img = await loadImage(url);
  const t = bbox
    ? cropToTensor(img, bbox.x, bbox.y, bbox.width, bbox.height)
    : (tf.tidy(() =>
        tf.browser
          .fromPixels(img)
          .resizeBilinear([IRIS_CROP_SIZE, IRIS_CROP_SIZE]),
      ) as tf.Tensor3D);
  return extractEmbedding(t);
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}
