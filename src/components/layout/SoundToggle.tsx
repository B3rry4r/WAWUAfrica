"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";

const KEY = "wawu.sound";
const TRACK = "/wawu-theme.mp3";

/**
 * The WAWU theme, and the button that turns it off.
 *
 * ── IT CANNOT AUTOPLAY, AND THAT IS NOT A CHOICE WE MAKE ───────────────────
 * Every current browser blocks audible autoplay until the page has had a real
 * user gesture. Chrome, Safari and Firefox all refuse it, and Safari on iOS
 * refuses it hardest. So the track starts on a TAP, always. Anything that
 * claimed to autoplay would simply be silent on most devices, with no way for
 * anyone to tell whether the feature was broken or the song had not started.
 *
 * ── WHY THE FILE IS NOT DOWNLOADED UNTIL SOMEBODY ASKS ─────────────────────
 * `preload="none"`. The track is 8.7MB, most of this audience is on mobile
 * data in Nigeria, and most visitors will never turn music on. Fetching it on
 * page load would spend their money on something they did not ask for. It is
 * requested the first time the button is pressed and cached from then on.
 *
 * ── THE CHOICE STICKS ──────────────────────────────────────────────────────
 * Somebody who turned it ON gets it back on their next visit, because the tap
 * that navigated them into the page counts as the gesture. Somebody who never
 * asked for it, or turned it off, hears nothing — silence is the default and
 * stays the default.
 */
export function SoundToggle() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [on, setOn] = useState(false);
  // Until the browser has confirmed it will play, the button must not claim
  // sound is on. A control that lies about its own state is worse than none.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setOn(window.localStorage.getItem(KEY) === "on");
    } catch {
      // Private window, or site data blocked. Silence is the safe default.
    }
    setReady(true);
  }, []);

  // Resume a previous "on" once the visitor interacts with the page. Their
  // first click anywhere is the gesture the browser is waiting for.
  useEffect(() => {
    if (!ready || !on) return;
    const el = audioRef.current;
    if (!el || !el.paused) return;

    const tryPlay = () => {
      void el.play().catch(() => {
        // Still refused. Reflect reality rather than showing a speaker icon
        // over silence.
        setOn(false);
      });
    };
    tryPlay();
    window.addEventListener("pointerdown", tryPlay, { once: true });
    return () => window.removeEventListener("pointerdown", tryPlay);
  }, [ready, on]);

  const toggle = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    if (on) {
      el.pause();
      setOn(false);
      try {
        window.localStorage.setItem(KEY, "off");
      } catch {
        /* choice is still honoured for this page */
      }
      return;
    }
    void el
      .play()
      .then(() => {
        setOn(true);
        try {
          window.localStorage.setItem(KEY, "on");
        } catch {
          /* as above */
        }
      })
      .catch(() => setOn(false));
  }, [on]);

  return (
    <>
      <audio
        ref={audioRef}
        src={TRACK}
        loop
        preload="none"
        // Not a player: no controls, no keyboard target, nothing for a screen
        // reader to announce. The button below is the whole interface.
        aria-hidden="true"
        tabIndex={-1}
      />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? "Turn the music off" : "Play the WAWU theme"}
        title={on ? "Turn the music off" : "Play the WAWU theme"}
        /*
          Bottom-LEFT on a phone. The Create FAB owns bottom-right at
          `bottom-[94px] right-[18px]`, and two floating circles in one corner
          is a mis-tap waiting to happen. Same height so they read as a pair.
          Bottom-right on desktop, where there is no FAB and no bottom bar.
        */
        className="fixed bottom-[94px] left-[18px] z-40 grid h-[44px] w-[44px] place-items-center rounded-full border border-hairline bg-[rgba(19,19,22,0.92)] text-text-secondary shadow-float backdrop-blur-md transition-colors hover:text-text-primary active:bg-surface-press xl:bottom-[24px] xl:left-auto xl:right-[24px]"
      >
        <Icon name={on ? "Volume2" : "VolumeX"} size={19} strokeWidth={2} color={on ? "var(--accent)" : "currentColor"} />
      </button>
    </>
  );
}
