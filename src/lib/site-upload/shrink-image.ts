/**
 * A picture piece sends its own smaller copy as the preview (the Hub cannot cut a picture; WEB-HOLD,
 * PREVIEW-AUTO). This makes that copy in the browser with the app's own numbers (R-118): at most 640 px on the
 * long side, never enlarged, as a JPEG at 0.7 (see `previewSize` in rules.ts). Audio, video and PDF pieces send none (the Hub cuts those).
 *
 * Browser only (canvas). Resolves with a File named after the original, or throws a sentence a person can read.
 */

import { PREVIEW_QUALITY, previewSize } from "./rules";

export class ShrinkError extends Error {}

function load(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ShrinkError("We could not read that picture. Try a PNG or a JPEG."));
    };
    img.src = url;
  });
}

export async function shrinkImage(file: File): Promise<File> {
  const img = await load(file);
  if (!img.naturalWidth || !img.naturalHeight) throw new ShrinkError("We could not read that picture. Try a PNG or a JPEG.");
  const { width, height } = previewSize(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ShrinkError("We could not prepare your picture. Try again.");
  ctx.drawImage(img, 0, 0, width, height);
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", PREVIEW_QUALITY));
  if (!blob) throw new ShrinkError("We could not prepare your picture. Try again.");
  const base = file.name.replace(/\.[^.]+$/, "") || "picture";
  return new File([blob], `${base}-preview.jpg`, { type: "image/jpeg" });
}
