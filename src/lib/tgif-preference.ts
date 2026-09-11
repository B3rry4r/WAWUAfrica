/**
 * Whether the TGIF tab shows on Home.
 *
 * A pure client-side preference, the same shape as `sound.ts`: localStorage
 * only, no account write behind it, because hiding a devotional read from
 * your own home screen is not something the server needs to know or a
 * choice that needs to follow you to another device. Shown is the default —
 * nothing is stored until somebody actually turns it off.
 */
const KEY = "wawu.tgif.hidden";

const listeners = new Set<() => void>();

function announce() {
  for (const l of listeners) l();
}

export function isHidden(): boolean {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    // Private window, or site data blocked. Shown is the safe default.
    return false;
  }
}

export function setHidden(hidden: boolean) {
  try {
    if (hidden) window.localStorage.setItem(KEY, "1");
    else window.localStorage.removeItem(KEY);
  } catch {
    /* the choice still applies for this page */
  }
  announce();
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
