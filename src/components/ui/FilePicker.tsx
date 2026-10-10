"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { isCancelled, uploadFile, UploadError, type UploadFolder, type UploadedFile } from "@/lib/api/uploads";

function humanSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/*
  NO CAPACITY BAR UNDER THE PICKER.

  There used to be one on every content and community upload: "130MB of 2GB
  used" over a progress track. Product owner, 21 Sep 2026, scribbled across
  it on the video step: "Remove this."

  It earned its space nowhere. A creator is capped at five listings, so the
  ceiling that actually binds is the slot count, which the Create hub already
  states. The bar measured a limit almost nobody reaches, and it did it on
  step one of four, before a file had even been chosen, which is exactly
  where an upload flow should be asking for one thing only.
*/

interface FilePickerBaseProps {
  /** `accept` for the underlying input, e.g. "image/*,video/mp4". */
  accept?: string;
  label: string;
  hint?: string;
  /** Fires when the chosen file is removed. */
  onCleared?: () => void;
  /** Offers a camera capture on mobile (used by KYC ID capture). */
  capture?: boolean;
  disabled?: boolean;
}

/**
 * HOLD MODE: the picker chooses and checks a file, and the caller sends it.
 *
 * Opening a wallet sends the two sides of an ID in one request, so a front
 * cannot be uploaded the moment it is picked: the caller has to hold it until
 * the back is chosen too. In this mode nothing is uploaded here. The file is
 * checked against `check` (a type and size test the caller supplies, from the
 * limits the server stated) and handed up; the row shows it as ready to send.
 */
export interface FilePickerHold {
  /** The file the caller is holding, or null. The caller owns it. */
  file: File | null;
  /** The chosen file, after `check` found nothing wrong; null when it is removed. */
  onChange: (file: File | null) => void;
  /** Why a chosen file can't go, or null when it can. Runs before `onChange`. */
  check?: (file: File) => string | null;
}

export type FilePickerProps = FilePickerBaseProps &
  (
    | {
        /** Where the object is stored. Must be one the backend allows. */
        folder: UploadFolder;
        /** Fires with the stored file once the upload genuinely completes. */
        onUploaded: (file: UploadedFile) => void;
        hold?: undefined;
      }
    | { hold: FilePickerHold; folder?: undefined; onUploaded?: undefined }
  );

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
  hold,
  onCleared,
  capture = false,
  disabled = false,
}: FilePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploaded, setUploaded] = useState<UploadedFile | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Bumped after every successful upload so the meter re-reads rather than
  // showing a total that is one file out of date.
  const [uploadCount, setUploadCount] = useState(0);


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
    if (!folder || !onUploaded) return;
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
    if (hold) {
      const problem = hold.check?.(file) ?? null;
      setError(problem);
      if (!problem) hold.onChange(file);
      return;
    }
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
    hold?.onChange(null);
    onCleared?.();
  };

  // A held picture is shown back to the person (a blurred or cropped shot is
  // caught here, not after a rejection). The object URL is freed when the file
  // changes or the picker goes.
  const heldFile = hold?.file ?? null;
  const [heldPreview, setHeldPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!heldFile || !heldFile.type.startsWith("image/")) {
      setHeldPreview(null);
      return;
    }
    const url = URL.createObjectURL(heldFile);
    setHeldPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [heldFile]);
  const chosen: { name: string; size: number; note: string } | null = heldFile
    ? { name: heldFile.name, size: heldFile.size, note: "ready to send" }
    : uploaded
      ? { name: uploaded.name, size: uploaded.size, note: "uploaded" }
      : null;

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

      {chosen ? (
        <div className="flex items-center gap-[12px] rounded-[var(--radius-input)] border border-[var(--border-decor)] bg-[var(--decor-tint)] p-[13px_14px]">
          {heldPreview ? (
            // A local blob URL of the person's own picture: next/image has nothing to optimise here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={heldPreview}
              alt=""
              className="h-[38px] w-[38px] shrink-0 rounded-[11px] border border-hairline object-cover"
            />
          ) : (
            <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[11px] bg-[var(--surface-card)]">
              <Icon name="Check" size={17} color="var(--accent)" strokeWidth={2.6} />
            </span>
          )}
          <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
            <span className="truncate text-[14px] font-semibold text-[var(--text-primary)]">{chosen.name}</span>
            <span className="text-[12px] text-[var(--text-muted)]">{humanSize(chosen.size)} · {chosen.note}</span>
          </span>
          <button
            type="button"
            onClick={clear}
            aria-label={`Remove ${chosen.name}`}
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

    </div>
  );
}
