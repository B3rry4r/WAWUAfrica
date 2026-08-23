"use client";

import { useRef, useState } from "react";
import { uploadFile, UploadError } from "@/lib/api/uploads";
import { Button } from "@/components/ui/Button";
import { CommunityImage } from "@/components/ui/CommunityImage";
import { Icon } from "@/components/ui/Icon";
import { formatCredits } from "@/lib/format";

/** What a member may attach. Mirrors the server's image-only allowlist for `community/message`. */
const ACCEPTED_IMAGES = "image/png,image/jpeg,image/webp";

export interface CommunityComposerProps {
  /** Mobile is the sticky bottom bar; desktop is the bordered card (design D14). */
  variant: "mobile" | "desktop";
  communityName: string;
  /** Credit COUNT, never a naira value. */
  balance: number;
  sending: boolean;
  sendError: string | null;
  /** Resolves true when the message really went; the composer clears only then. */
  onSend: (text: string, imageUrl: string | null) => Promise<boolean>;
  onTopUp: () => void;
}

/**
 * The one community composer, at both breakpoints.
 *
 * Members could only ever send text — there was no attach control anywhere,
 * because `CommunityMessage` had no image column. Now a message is text, a
 * photo, or both, and it costs the SAME one credit either way: the server
 * prices per message, never per content type (docs/01 §3, "1 credit = 1
 * message"), so the count a member sees stays predictable.
 *
 * The mobile bar and the desktop card were two separate blocks of nearly
 * identical send logic; adding an upload to both would have doubled the
 * divergence, so this is one component with a `variant` prop.
 */
export function CommunityComposer({
  variant,
  communityName,
  balance,
  sending,
  sendError,
  onSend,
  onTopUp,
}: CommunityComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [image, setImage] = useState<{ url: string; name: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const uploading = uploadProgress !== null;
  // Text OR an image — never neither, which the server rejects with a 400.
  const canSend = (text.trim().length > 0 || image !== null) && !sending && !uploading;

  const pickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so re-picking the same file still fires a change event.
    e.target.value = "";
    if (!file) return;

    setUploadError(null);
    setUploadProgress(0);
    try {
      // Presign + PUT straight to storage; only the resulting URL is sent
      // with the message. See lib/api/uploads.ts.
      const uploaded = await uploadFile(file, "community/message", setUploadProgress);
      setImage({ url: uploaded.fileUrl, name: uploaded.name });
    } catch (err) {
      setUploadError(
        err instanceof UploadError ? err.message : "That photo did not go through. Please try again.",
      );
    } finally {
      setUploadProgress(null);
    }
  };

  const handleSend = async () => {
    if (!canSend) return;
    const ok = await onSend(text.trim(), image?.url ?? null);
    if (ok) {
      setText("");
      setImage(null);
      setUploadError(null);
    }
  };

  const errorText = uploadError ?? sendError;

  // The attached photo, before it is sent. Shown at both breakpoints so
  // nobody sends a picture they have not seen.
  const attachment =
    image || uploading ? (
      <div className="flex items-center gap-[10px] rounded-input border border-hairline bg-card px-[10px] py-[8px]">
        {uploading ? (
          <>
            <Icon
              name="Loader2"
              size={16}
              color="var(--accent)"
              className="[animation:wawuSpin_900ms_linear_infinite]"
            />
            <span className="flex-1 text-[12.5px] text-text-secondary">Uploading photo… {uploadProgress}%</span>
          </>
        ) : (
          <>
            <CommunityImage src={image?.url} icon="Image" iconSize={15} className="h-9 w-9 rounded-[10px] bg-tag" />
            <span className="min-w-0 flex-1 truncate text-[12.5px] text-text-secondary">
              {image?.name} · still 1 credit
            </span>
            <button
              type="button"
              onClick={() => setImage(null)}
              aria-label="Remove photo"
              className="grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-full border-none bg-transparent text-text-muted hover:bg-state-hover hover:text-danger active:bg-state-press"
            >
              <Icon name="X" size={15} strokeWidth={2.2} />
            </button>
          </>
        )}
      </div>
    ) : null;

  const attachButton = (
    <button
      type="button"
      onClick={() => inputRef.current?.click()}
      disabled={uploading}
      aria-label="Attach a photo"
      className="grid h-[46px] w-[46px] shrink-0 cursor-pointer place-items-center rounded-full border-none bg-tag text-text-secondary enabled:hover:bg-state-hover enabled:active:bg-state-press disabled:cursor-default disabled:text-[var(--text-disabled)]"
    >
      <Icon name="ImagePlus" size={18} strokeWidth={2} />
    </button>
  );

  const fileInput = (
    <input
      ref={inputRef}
      type="file"
      accept={ACCEPTED_IMAGES}
      onChange={pickImage}
      className="hidden"
      tabIndex={-1}
    />
  );

  if (variant === "mobile") {
    return (
      <footer className="sticky bottom-0 border-t border-hairline bg-elevated px-4 pb-[calc(22px_+_env(safe-area-inset-bottom))] pt-3">
        {fileInput}
        {errorText && <p className="m-0 mb-2 text-[12.5px] text-[var(--danger)]">{errorText}</p>}
        {balance < 1 ? (
          <Button full icon="Ticket" onClick={onTopUp}>
            Top up credits
          </Button>
        ) : (
          <div className="flex flex-col gap-2">
            {attachment}
            <div className="flex items-end gap-2">
              {attachButton}
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend();
                }}
                placeholder={`Message ${communityName} (1 credit)`}
                className="h-[46px] flex-1 rounded-[var(--radius-chip)] border border-hairline bg-input px-4 text-[14.5px] text-text-primary outline-none"
              />
              <button
                type="button"
                aria-label="Send"
                onClick={handleSend}
                disabled={!canSend}
                className={[
                  "grid h-[46px] w-[46px] shrink-0 place-items-center rounded-full border-none",
                  canSend
                    ? "cursor-pointer bg-accent text-[var(--text-on-accent)] hover:bg-accent-hover active:bg-accent-press"
                    : "cursor-default bg-tag text-[var(--text-disabled)]",
                ].join(" ")}
              >
                <Icon
                  name={sending ? "Loader2" : "Send"}
                  size={17}
                  strokeWidth={2.2}
                  className={sending ? "[animation:wawuSpin_900ms_linear_infinite]" : ""}
                />
              </button>
            </div>
          </div>
        )}
      </footer>
    );
  }

  return (
    <div className="mt-auto shrink-0 p-[18px]">
      {fileInput}
      {errorText && <p className="m-0 mb-2 text-[12.5px] text-[var(--danger)]">{errorText}</p>}
      {balance < 1 ? (
        <Button full icon="Ticket" onClick={onTopUp}>
          Top up credits to send a message
        </Button>
      ) : (
        <div className="flex flex-col gap-2 rounded-[var(--radius-card)] border border-hairline bg-card p-3">
          {attachment}
          <div className="flex items-center gap-3">
            {attachButton}
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Write a message or attach a photo · costs 1 credit"
              className="h-10 flex-1 bg-transparent px-2 text-[14px] text-text-primary outline-none placeholder:text-text-muted"
            />
            <span className="shrink-0 text-[12.5px] text-text-muted [font-feature-settings:var(--font-feature-tabular)]">
              {formatCredits(balance)} left
            </span>
            <Button size="sm" iconRight="Send" onClick={handleSend} loading={sending} disabled={!canSend}>
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
