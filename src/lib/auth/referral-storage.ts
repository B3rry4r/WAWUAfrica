/**
 * The referral code somebody arrived with, carried from sign-up to checkout.
 *
 * ── WHY localStorage AND NOT sessionStorage ────────────────────────────────
 * This used to be sessionStorage, which dies with the TAB. The real journey
 * is: apply the code, register, leave for your email client to fetch the
 * verification code, come back. Coming back is very often a new tab — from
 * the mail app, from a link, from a browser that dropped the old one. The
 * code was gone by then, so the tier screen quietly showed full price with no
 * discount, which is exactly what the product owner reported after using a
 * 100%-off code and still being asked for ₦14,999.
 *
 * A code is also not one sitting's business: somebody given one on Monday and
 * subscribing on Wednesday was promised the same price.
 *
 * It is still cleared the moment it is spent or found invalid, so a stale
 * code cannot follow somebody around forever. Every access is wrapped because
 * storage throws outright in a private window or with site data blocked, and
 * a storage failure must never break signing up.
 */
const KEY = "wawu.referral";

export const referralStorage = {
  get(): string | null {
    try {
      return window.localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(code: string): void {
    try {
      window.localStorage.setItem(KEY, code);
    } catch {
      // Nothing to do: the code still applies for the rest of this page.
    }
  },
  clear(): void {
    try {
      window.localStorage.removeItem(KEY);
      // Clear the old sessionStorage home too, so a browser that still has a
      // value there does not shadow this one after the change ships.
      window.sessionStorage.removeItem(KEY);
    } catch {
      // ignored, same reason
    }
  },
};
