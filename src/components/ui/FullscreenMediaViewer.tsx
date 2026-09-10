"use client";

import { useEffect } from "react";
import { Icon } from "./Icon";

/**
 * THE FULL-SCREEN PLAYER.
 *
 * A content card's preview used to be the whole of video/audio playback: a
 * muted, silent `<video preload="metadata">` painting one frame, with a play
 * glyph that did nothing when tapped. This is what tapping it now opens —
 * native controls, autoplaying, edge to edge.
 *
 * Callers gate WHETHER this can open, not this component: a locked paid
 * piece never receives a `src` to open with in the first place (see
 * MediaBlock in content/[id]/page.tsx), so there is nothing here checking
 * `locked` again. One gate, one place.
 */
export function FullscreenMediaViewer({
  open,
  onClose,
  src,
  kind,
  title,
}: {
  open: boolean;
  onClose: () => void;
  src: string;
  kind: "video" | "audio";
  title: string;
}) {
  // Escape closes it, same as every other overlay in the app.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(6,6,8,0.96)] [backdrop-filter:var(--blur-chrome)]"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full border border-hairline bg-[rgba(19,19,22,0.7)] text-text-primary hover:bg-surface-hover active:bg-surface-press"
      >
        <Icon name="X" size={18} strokeWidth={2.2} />
      </button>

      {kind === "video" ? (
        <video
          src={src}
          controls
          autoPlay
          playsInline
          className="max-h-full max-w-full"
        />
      ) : (
        <div className="flex w-full max-w-[420px] flex-col items-center gap-6 px-6">
          <span className="grid h-24 w-24 place-items-center rounded-full bg-accent-tint text-accent-hover">
            <Icon name="Headphones" size={38} strokeWidth={2} />
          </span>
          <span className="truncate text-[15px] font-semibold text-text-primary">{title}</span>
          <audio src={src} controls autoPlay className="w-full" />
        </div>
      )}
    </div>
  );
}
