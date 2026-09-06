"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { isPlaying, play, subscribe, toggle, wasOn } from "@/lib/sound";
import { usePathname } from "next/navigation";
import { useCreateFabShown } from "./CreateFab";

/**
 * Controls for the WAWU theme. The track itself lives in `@/lib/sound`, not
 * in here: see that file for why it had to stop being the button's property.
 *
 * Two shapes, because it belongs in two different kinds of place:
 *
 *  - `SoundFab`, the floating circle, on the right, stacked over the Create
 *    button. It used to be bottom-LEFT, which put it over the content column
 *    on every screen; the right-hand corner is already the floating-button
 *    corner, so it is the one place a circle is expected. It takes itself off
 *    screens somebody is reading.
 *  - `SoundSetting`, the same control as a settings row, for people who would
 *    rather set it once and not have a button following them around.
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

/*
  Routes where a floating circle sits on top of the thing you are using.

  Same list, same reason, as CreateFab's. The QA pass found this button
  covering the "96% liked" figure on a content page and floating in the middle
  of the empty detail pane on the desktop paid-questions inbox. A reading
  surface and a conversation are both things somebody is IN, and a music
  control is not worth a pixel of either.
*/
const HIDDEN_ON = ["/content/", "/messages", "/communities/", "/learn/"];

export function SoundFab() {
  const pathname = usePathname();
  const on = usePlaying();
  const flip = useCallback(() => void toggle(), []);
  /*
    Stacked ABOVE the Create button rather than beside it.

    Create owns bottom-right at 94px up and is 56px across; this is 44px, so
    `right-[24px]` puts the two on one vertical axis instead of leaving them
    slightly out of line, and 160px clears Create with a gap. When there is no
    Create button (a member account, or a screen where it hides itself) this
    drops into the space Create would have used, so there is never a floating
    circle hovering over an empty gap.
  */
  const stacked = useCreateFabShown();

  if (HIDDEN_ON.some((p) => pathname.startsWith(p))) return null;

  return (
    <button
      type="button"
      onClick={flip}
      aria-pressed={on}
      aria-label={on ? "Turn the music off" : "Play the WAWU theme"}
      title={on ? "Turn the music off" : "Play the WAWU theme"}
      className={[
        "fixed right-[24px] z-40 grid h-[44px] w-[44px] place-items-center rounded-full border border-hairline bg-[rgba(19,19,22,0.92)] text-text-secondary shadow-float backdrop-blur-md transition-colors hover:text-text-primary active:bg-surface-press",
        stacked ? "bottom-[160px]" : "bottom-[94px]",
        /*
          NOT ON THE READING SCREEN.

          TGIF is a page somebody reads, and a button parked over the corner of
          it is exactly the thing that was reported. The reader sets a
          `data-reading` flag on <body> while it is open and this hides itself
          for as long as it is there. Doing it in CSS rather than in React
          keeps the two apart: the reader does not import the button, and the
          button does not need to know a tab exists.
        */
        "[body[data-reading]_&]:hidden",
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
