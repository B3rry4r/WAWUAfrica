import { staleDraftKeys } from "./rules";

/**
 * Removes the stored drafts that are not `wawuId`'s (all of them when it is null). A draft holds what a person typed and the
 * name of a file they uploaded, so one person's must never be there for the next person on the same tab. Browser only.
 */
export function clearDrafts(wawuId: string | null): void {
  try {
    const keys: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i += 1) {
      const k = window.sessionStorage.key(i);
      if (k !== null) keys.push(k);
    }
    for (const k of staleDraftKeys(keys, wawuId)) window.sessionStorage.removeItem(k);
  } catch {
    // no storage: nothing was kept
  }
}
