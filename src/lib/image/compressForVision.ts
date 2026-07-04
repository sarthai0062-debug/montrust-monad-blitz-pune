export interface CompressedImage {
  base64: string;
  mimeType: string;
  width: number;
  height: number;
  originalBytes: number;
  compressedBytes: number;
}

const MAX_DIMENSION = 1024;
const JPEG_QUALITY = 0.82;
const MAX_BYTES = 900_000;

/**
 * Resize and compress screenshots before NVIDIA MiniMax-M3 vision calls.
 * Large PNG uploads can push inference past Vercel's 60s limit.
 */
export async function compressImageForVision(file: File): Promise<CompressedImage> {
  const originalBytes = file.size;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not prepare image canvas.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = JPEG_QUALITY;
  let blob = await canvasToBlob(canvas, quality);

  while (blob.size > MAX_BYTES && quality > 0.45) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, quality);
  }

  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return {
    base64: btoa(binary),
    mimeType: "image/jpeg",
    width,
    height,
    originalBytes,
    compressedBytes: bytes.length,
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Image compression failed"))),
      "image/jpeg",
      quality
    );
  });
}
