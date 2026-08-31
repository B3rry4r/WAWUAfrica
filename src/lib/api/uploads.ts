import { apiFetch, isMockModeError } from "./client";
import { describeError } from "./errors";

/**
 * File uploads.
 *
 * Nothing in this app could previously upload a file: there was no upload
 * endpoint, no file input, and the publishing wizard sent empty strings where
 * the backend requires a URL (`previewAsset` is `@IsUrl()`), so publishing
 * always failed. KYC and the CAC/NEPC flows had fake `setInterval` progress
 * bars with no file behind them at all.
 *
 * The real flow is two steps, and the browser never sees bucket credentials:
 *   1. POST /api/hub/uploads/presign {folder, contentType, extension}
 *      -> {uploadUrl, key, fileUrl}
 *   2. PUT the file bytes straight at `uploadUrl`.
 * The returned `fileUrl` is what gets sent on the real create/submit call.
 */

export type UploadFolder =
  | "content/preview"
  | "content/full"
  | "kyc/id-document"
  | "service-application/document"
  // A practising licence or qualification supporting a professional-profile
  // application. Its own prefix, matching UPLOAD_FOLDERS in the backend.
  | "professional/document"
  // A document attached to a legal intake. Its own prefix, matching
  // UPLOAD_FOLDERS in the backend.
  | "legal/document"
  | "avatars"
  // A community's own cover image, and a photo posted into a room. Two
  // destinations, not one, matching UPLOAD_FOLDERS in the backend's
  // presign-upload.dto.ts — the cover is written by the host alone, a message
  // photo by any member. Both are image-only server-side.
  | "community/image"
  | "community/message";

interface PresignResponse {
  uploadUrl: string;
  key: string;
  fileUrl: string;
}

export interface UploadedFile {
  /** URL to store on the owning record (previewAsset, idDocumentUrl, …). */
  fileUrl: string;
  key: string;
  name: string;
  size: number;
}

function extensionOf(file: File): string {
  const fromName = file.name.includes(".") ? file.name.split(".").pop() ?? "" : "";
  if (fromName) return fromName;
  const fromType = file.type.split("/")[1] ?? "";
  return fromType || "bin";
}

/** 512MB — matches the largest asset the product allows (video). */
export const MAX_UPLOAD_BYTES = 512 * 1024 * 1024;

export class UploadError extends Error {}

/**
 * The object URL handed back in mock mode, per folder. A blob URL is held by
 * the document until it is explicitly revoked, so re-picking a file (a new KYC
 * document, a different cover image) used to strand the previous file's bytes
 * in memory for the life of the tab. Each folder holds one current selection,
 * so creating the next one frees the last.
 */
const mockObjectUrls = new Map<UploadFolder, string>();

function mockObjectUrl(file: File, folder: UploadFolder): string {
  const previous = mockObjectUrls.get(folder);
  if (previous) URL.revokeObjectURL(previous);
  const url = URL.createObjectURL(file);
  mockObjectUrls.set(folder, url);
  return url;
}

/**
 * Uploads one file and resolves with the URL to persist.
 *
 * `onProgress` reports real bytes-sent from the XHR, not a simulated timer.
 */
export async function uploadFile(
  file: File,
  folder: UploadFolder,
  onProgress?: (percent: number) => void,
): Promise<UploadedFile> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new UploadError("That file is too large. The limit is 512MB.");
  }

  let presign: PresignResponse;
  try {
    presign = await apiFetch<PresignResponse>("/api/hub/uploads/presign", {
      method: "POST",
      authed: true,
      body: {
        folder,
        contentType: file.type || "application/octet-stream",
        extension: extensionOf(file),
        // The URL is signed for exactly this length, so storage rejects an
        // upload of any other size — the client-side cap above is a courtesy,
        // this is the enforcement.
        contentLength: file.size,
      },
    });
  } catch (e) {
    if (isMockModeError(e)) {
      // No backend configured: hand back a local object URL so the UI is
      // still explorable offline. This is a real, viewable reference to the
      // chosen file — it simply does not outlive the page.
      return {
        fileUrl: mockObjectUrl(file, folder),
        key: `mock/${file.name}`,
        name: file.name,
        size: file.size,
      };
    }
    // A REFUSAL is re-thrown as an UploadError carrying the server's own
    // sentence. Presign is where the storage quota is enforced, and its 413
    // says exactly how much room is left — but FilePicker only renders
    // UploadError messages, so without this the one useful thing the server
    // said would be replaced by "that upload did not go through".
    throw new UploadError(describeError(e).body);
  }

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presign.uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new UploadError(`Upload failed (${xhr.status}). Please try again.`));
    };
    xhr.onerror = () => reject(new UploadError("Upload failed. Check your connection and try again."));
    xhr.onabort = () => reject(new UploadError("Upload cancelled."));
    xhr.send(file);
  });

  onProgress?.(100);
  return { fileUrl: presign.fileUrl, key: presign.key, name: file.name, size: file.size };
}


/**
 * How much of their storage this account has used.
 *
 * Every field is measured server-side: `usedBytes` is a sum over recorded
 * objects and `limitBytes` derives from the plan. Nothing here is estimated
 * client-side, so the meter cannot disagree with the refusal.
 */
export interface StorageUsage {
  usedBytes: number;
  limitBytes: number;
  remainingBytes: number;
  /** Null for an account with no creator plan — it still has the 2GB floor. */
  tier: string | null;
}

export async function getStorageUsage(): Promise<StorageUsage> {
  // SEAM: replace with GET /api/hub/uploads/usage
  return apiFetch<StorageUsage>("/api/hub/uploads/usage", { authed: true });
}
