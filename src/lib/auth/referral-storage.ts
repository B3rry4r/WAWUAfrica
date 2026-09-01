/**
 * The referral code somebody arrived with, carried from sign-up to checkout.
 *
 * A code is applied on the sign-up screen — it is what opens the door — but
 * the discount it carries is spent later, when a plan is actually bought.
 * Asking for the same code twice is how a discount somebody was promised gets
 * quietly lost between two screens.
 *
 * sessionStorage, not localStorage: it belongs to this signup, not to the
 * browser forever. Every access is wrapped because sessionStorage throws
 * outright in a private window or with site data blocked, and a storage
 * failure must never break signing up.
 */
const KEY = "wawu.referral";

export const referralStorage = {
  get(): string | null {
    try {
      return window.sessionStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(code: string): void {
    try {
      window.sessionStorage.setItem(KEY, code);
    } catch {
      // Nothing to do: the code still applies for the rest of this page.
    }
  },
  clear(): void {
    try {
      window.sessionStorage.removeItem(KEY);
    } catch {
      // ignored, same reason
    }
  },
};
