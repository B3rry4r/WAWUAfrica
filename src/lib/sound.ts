/**
 * The WAWU theme, and where it lives.
 *
 * The audio element used to be owned by the floating button, which meant the
 * button had to stay mounted on every screen for the music to keep playing,
 * which meant it had to float over the content, which meant it covered
 * whatever happened to be at the bottom-left of the page. It was reported
 * sitting on top of a card's own text.
 *
 * So the track is a module singleton instead. It is created on the first tap,
 * outside React, and it survives navigation because nothing unmounts it. The
 * control that toggles it can then live wherever it makes sense (Settings,
 * for a preference) rather than wherever it has to.
 *
 * ── IT CANNOT AUTOPLAY, AND THAT IS NOT A CHOICE WE MAKE ───────────────────
 * Every current browser blocks audible autoplay until the page has had a real
 * user gesture. Chrome, Safari and Firefox all refuse it, and Safari on iOS
 * refuses it hardest. So the track starts on a TAP, always. Anything that
 * claimed to autoplay would simply be silent on most devices, with no way for
 * anyone to tell whether the feature was broken or the song had not started.
 *
 * ── WHY THE FILE IS NOT DOWNLOADED UNTIL SOMEBODY ASKS ─────────────────────
 * The track is 8.7MB, most of this audience is on mobile data in Nigeria, and
 * most visitors will never turn music on. It is not fetched until the first
 * tap, and cached from then on.
 *
 * ── THE CHOICE STICKS ──────────────────────────────────────────────────────
 * Somebody who turned it ON gets it back on their next visit, because the tap
 * that navigated them into the page counts as the gesture. Somebody who never
 * asked for it, or turned it off, hears nothing. Silence is the default and
 * stays the default.
 */
const KEY = "wawu.sound";
const TRACK = "/wawu-theme.mp3";

let el: HTMLAudioElement | null = null;
let playing = false;
const listeners = new Set<() => void>();

function announce() {
  for (const l of listeners) l();
}

function element(): HTMLAudioElement | null {
  if (typeof window === "undefined") return null;
  if (!el) {
    el = new Audio(TRACK);
    el.loop = true;
    el.preload = "none";
    // The browser can stop it for reasons of its own; the control must show
    // what is true rather than what it last asked for.
    el.addEventListener("pause", () => {
      playing = false;
      announce();
    });
  }
  return el;
}

/** Did the visitor leave the music on last time? */
export function wasOn(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "on";
  } catch {
    // Private window, or site data blocked. Silence is the safe default.
    return false;
  }
}

function remember(on: boolean) {
  try {
    window.localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* the choice is still honoured for this page */
  }
}

export function isPlaying(): boolean {
  return playing;
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Starts the track. Resolves to whether the browser actually allowed it. */
export async function play(): Promise<boolean> {
  const audio = element();
  if (!audio) return false;
  try {
    await audio.play();
    playing = true;
    announce();
    return true;
  } catch {
    // Refused, almost always for want of a gesture. Reflect reality rather
    // than showing a speaker icon over silence.
    playing = false;
    announce();
    return false;
  }
}

export function stop() {
  element()?.pause();
  playing = false;
  announce();
}

/** Flips it, and remembers which way. */
export async function toggle(): Promise<boolean> {
  if (playing) {
    stop();
    remember(false);
    return false;
  }
  const started = await play();
  if (started) remember(true);
  return started;
}
