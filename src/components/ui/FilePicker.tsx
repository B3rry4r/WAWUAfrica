"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { StorageMeter } from "./StorageMeter";
import { isCancelled, uploadFile, UploadError, type UploadFolder, type UploadedFile } from "@/lib/api/uploads";

function humanSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/**
 * The destinations where a capacity bar is worth the space: the ones a
 * creator returns to and genuinely fills. Compliance uploads are excluded —
 * see `showStorage`.
 */
const DEFAULT_SHOWS_STORAGE = new Set<UploadFolder>([
  "content/preview",
  "content/full",
  "community/image",
  "community/message",
]);

export interface FilePickerProps {
  /** Where the object is stored. Must be one the backend allows. */
  folder: UploadFolder;
  /** `accept` for the underlying input, e.g. "image/*,video/mp4". */
  accept?: string;
  label: string;
  hint?: string;
  /** Fires with the stored file once the upload genuinely completes. */
  onUploaded: (file: UploadedFile) => void;
  /** Fires when the chosen file is removed. */
  onCleared?: () => void;
  /** Offers a camera capture on mobile (used by KYC ID capture). */
  capture?: boolean;
  disabled?: boolean;
  /**
   * Shows how much of the account's storage is left, under the picker.
   *
   * On by default for the destinations a creator fills up — content and
   * community media. Off for one-off compliance documents (a KYC ID, a CAC
   * certificate): those are a few hundred KB against a 2GB ceiling, and a
   * capacity bar next to "photograph your ID" reads as an obstacle in a flow
   * that already makes people nervous.
   */
  showStorage?: boolean;
}

/**
 * The one real file input in the app.
 *
 * Every upload surface previously faked this: the publishing wizard rendered a
 * hardcoded filename and marked the step complete without a file, KYC's
 * "Take a photo" / "Choose file" buttons just called their callback, and the
 * CAC/NEPC pages ran `setInterval` progress bars with nothing behind them.
 * This picks a real file, uploads it, reports real byte progress, and only
 * calls `onUploaded` once the bytes are actually stored.
 */
export function FilePicker({
  folder,
  accept,
  label,
  hint,
  onUploaded,
  onCleared,
  capture = false,
  disabled = false,
  showStorage,
}: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Bumped after every successful upload so the meter re-reads rather than
  // showing a total that is one file out of date.
  const [uploadCount, setUploadCount] = useState(0);

  const withMeter = showStorage ?? DEFAULT_SHOWS_STORAGE.has(folder);

  const choose = () => {
    if (disabled || progress !== null) return;
    inputRef.current?.click();
  };

  /*
    A HELD REFERENCE TO THE UPLOAD IN FLIGHT, so it can be stopped.

    Without one there was no way out of an upload that had died: the picker
    disables itself while `progress` is non-null, and a stalled XHR fires
    nothing at all, so `progress` stayed set and the control was locked for
    the life of the tab. The only escape was to reload the page.
  */
  const abortRef = useRef<AbortController | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);

  const send = async (file: File) => {
    const controller = new AbortController();
    abortRef.current = controller;
    setError(null);
    setProgress(0);
    try {
      const result = await uploadFile(file, folder, setProgress, controller.signal);
      setUploaded(result);
      setUploadCount((n) => n + 1);
      onUploaded(result);
    } catch (err) {
      // A cancellation is not a failure, and must not be reported as one.
      if (isCancelled(err)) setError(null);
      else setError(err instanceof UploadError ? err.message : "That upload did not go through. Please try again.");
    } finally {
      abortRef.current = null;
      setProgress(null);
    }
  };

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so re-picking the same file still fires a change event.
    e.target.value = "";
    if (!file) return;
    setLastFile(file);
    await send(file);
  };

  const cancel = () => abortRef.current?.abort();

  // Leaving the screen mid-upload should stop it, not leave a request running
  // against a component that no longer exists.
  useEffect(() => () => abortRef.current?.abort(), []);

  const clear = () => {
    setUploaded(null);
    setError(null);
    onCleared?.();
  };

  return (
    <div className="flex flex-col gap-[10px]">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        {...(capture ? { capture: "environment" as const } : {})}
        onChange={onChange}
        className="hidden"
        tabIndex={-1}
      />

      {uploaded ? (
        <div className="flex items-center gap-[12px] rounded-[var(--radius-input)] border border-[var(--border-decor)] bg-[var(--decor-tint)] p-[13px_14px]">
          <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] bg-[var(--surface-card)]">
            <Icon name="Check" size={17} color="var(--accent)" strokeWidth={2.6} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <span className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{uploaded.name}</span>
            <span className="text-[12px] text-[var(--text-muted)]">{humanSize(uploaded.size)} · uploaded</span>
          </span>
          <button
            type="button"
            onClick={clear}
            aria-label={`Remove ${uploaded.name}`}
            className="grid h-[32px] w-[32px] shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-[var(--text-muted)] hover:bg-state-hover hover:text-danger active:bg-state-press"
          >
            <Icon name="X" size={16} strokeWidth={2.2} />
          </button>
        </div>
      ) : progress !== null ? (
        <div className="flex flex-col gap-[9px] rounded-[var(--radius-input)] border border-hairline bg-[var(--surface-input)] p-[14px]">
          <div className="flex items-center gap-[10px]">
            <Icon name="Loader2" size={16} color="var(--accent)" className="[animation:wawuSpin_900ms_linear_infinite]" />
            <span className="flex-1 text-[13.5px] font-semibold text-[var(--text-primary)]">Uploading…</span>
            <span className="text-[12.5px] font-semibold text-[var(--text-secondary)] [font-feature-settings:var(--font-feature-tabular)]">
              {progress}%
            </span>
            <button
              type="button"
              onClick={cancel}
              aria-label="Cancel this upload"
              className="grid h-[26px] w-[26px] shrink-0 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-[var(--text-muted)] hover:bg-state-hover hover:text-danger active:bg-state-press"
            >
              <Icon name="X" size={15} strokeWidth={2.2} />
            </button>
          </div>
          <div className="h-[5px] w-full overflow-hidden rounded-full bg-[var(--surface-tag)]">
            <div className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-200" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={choose}
          disabled={disabled}
          className="flex cursor-pointer items-center gap-[12px] rounded-[var(--radius-input)] border border-dashed border-strong bg-[var(--surface-input)] p-[15px_14px] text-left enabled:hover:bg-surface-hover enabled:active:bg-surface-press disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] bg-[var(--surface-tag)]">
            <Icon name={capture ? "Camera" : "Upload"} size={17} color="var(--text-secondary)" strokeWidth={2} />
          </span>
          <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <span className="text-[14px] font-semibold text-[var(--text-primary)]">{label}</span>
            {hint ? <span className="text-[12px] leading-[1.4] text-[var(--text-muted)]">{hint}</span> : null}
          </span>
        </button>
      )}

      {error ? (
        <div className="flex flex-col gap-[7px]">
          <span className="flex items-start gap-[7px] text-[12.5px] leading-[1.45] text-[var(--danger)]">
            <Icon name="TriangleAlert" size={14} color="var(--danger)" className="mt-[1px] shrink-0" />
            {error}
          </span>
          {/* The file is still in hand, so retrying should not make them find
              it again. Most of these failures are a dropped connection. */}
          {lastFile && progress === null ? (
            <button
              type="button"
              onClick={() => void send(lastFile)}
              className="self-start text-[12.5px] font-semibold text-[var(--accent)] hover:underline"
            >
              Try again
            </button>
          ) : null}
        </div>
      ) : null}

      {withMeter ? <StorageMeter refreshKey={uploadCount} className="pt-[2px]" /> : null}
    </div>
  );
}
