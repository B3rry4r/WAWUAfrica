"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { isPlaying, play, subscribe, toggle, wasOn } from "@/lib/sound";

/**
 * Controls for the WAWU theme. The track itself lives in `@/lib/sound`, not
 * in here: see that file for why it had to stop being the button's property.
 *
 * Two shapes, because it belongs in two different kinds of place:
 *
 *  - `SoundFab`, the floating circle. It is right on the LANDING page, which
 *    is a poster with nothing underneath it to cover.
 *  - `SoundSetting`, a row. It is right in the app, where every screen is
 *    somebody's content and a circle pinned over the bottom-left corner sits
 *    on top of it. It was reported doing exactly that.
 *
 * `SoundResume` is neither: no UI at all, mounted once by the app shell, so
 * that somebody who left the music on gets it back.
 */

/** Subscribes to the track and reports whether it is actually sounding. */
function usePlaying(): boolean {
  const [on, setOn] = useState(false);
  useEffect(() => {
    setOn(isPlaying());
    return subscribe(() => setOn(isPlaying()));
  }, []);
  return on;
}

/**
 * Resumes a previous "on", once the visitor gives the browser the gesture it
 * is waiting for. Their first tap anywhere counts, so this waits for one
 * rather than trying and failing on load.
 */
export function SoundResume() {
  useEffect(() => {
    if (!wasOn() || isPlaying()) return;
    const tryPlay = () => {
      void play();
    };
    tryPlay();
    window.addEventListener("pointerdown", tryPlay, { once: true });
    return () => window.removeEventListener("pointerdown", tryPlay);
  }, []);
  return null;
}

export interface SoundFabProps {
  /**
   * Lift the button clear of a bottom bar.
   *
   * The app shell has a 78px bar and a Create FAB above it; the landing page
   * has neither. Without this the button floated 94px up an empty page,
   * which reads as misplaced rather than as clearing something.
   */
  aboveBottomBar?: boolean;
}

export function SoundFab({ aboveBottomBar = false }: SoundFabProps) {
  const on = usePlaying();
  const flip = useCallback(() => void toggle(), []);

  return (
    <button
      type="button"
      onClick={flip}
      aria-pressed={on}
      aria-label={on ? "Turn the music off" : "Play the WAWU theme"}
      title={on ? "Turn the music off" : "Play the WAWU theme"}
      className={[
        "fixed left-[18px] z-40 grid h-[44px] w-[44px] place-items-center rounded-full border border-hairline bg-[rgba(19,19,22,0.92)] text-text-secondary shadow-float backdrop-blur-md transition-colors hover:text-text-primary active:bg-surface-press",
        aboveBottomBar ? "bottom-[94px]" : "bottom-[24px]",
        "xl:bottom-[24px] xl:left-auto xl:right-[24px]",
      ].join(" ")}
    >
      <Icon name={on ? "Volume2" : "VolumeX"} size={19} strokeWidth={2} color={on ? "var(--accent)" : "currentColor"} />
    </button>
  );
}

/** The same control as a settings row, with a switch instead of a circle. */
export function SoundSetting() {
  const on = usePlaying();
  const flip = useCallback(() => void toggle(), []);

  return (
    <button
      type="button"
      onClick={flip}
      role="switch"
      aria-checked={on}
      className="flex w-full items-center gap-[13px] rounded-[var(--radius-input)] p-[11px_10px] text-left transition-colors hover:bg-[var(--state-hover)] active:bg-[var(--state-press)]"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-hairline bg-input text-text-secondary">
        <Icon name={on ? "Volume2" : "VolumeX"} size={17} color={on ? "var(--accent)" : "currentColor"} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[1px]">
        <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">The WAWU theme</span>
        <span className="text-[12.5px] text-[var(--text-muted)]">
          {on ? "Playing. Tap to turn it off." : "Background music while you browse."}
        </span>
      </span>
      {/* A real switch, because this row changes something rather than opening
          somewhere, and a chevron would promise a screen that does not exist. */}
      <span
        aria-hidden="true"
        className={`relative h-[24px] w-[42px] shrink-0 rounded-full transition-colors ${
          on ? "bg-accent" : "bg-tag"
        }`}
      >
        <span
          className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white transition-all ${
            on ? "left-[21px]" : "left-[3px]"
          }`}
        />
      </span>
    </button>
  );
}
