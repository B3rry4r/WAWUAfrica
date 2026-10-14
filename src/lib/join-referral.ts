/**
 * Referral codes on /join (REF-01, owner, 14 Oct 2026). Pure helpers, no
 * imports, so the page and its test read the same rules.
 *
 * A code is 3 to 20 letters and digits. The page uppercases what is typed and
 * drops anything else; the server matches in any case and decides what a code
 * is worth. Nothing here knows a price: every amount comes from the server.
 */

/** Where the code is kept for the length of the visit, so a reload still has it. */
export const REFERRAL_STORAGE_KEY = "wawu.join.ref";

export const REFERRAL_MIN = 3;
export const REFERRAL_MAX = 20;

/** What the person typed, as the page keeps it: upper case letters and digits, at most 20. */
export function cleanReferral(raw: string): string {
  return raw.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, REFERRAL_MAX);
}

/** True when the code is the shape of one (3 to 20 letters and digits), so asking the server is worth it. */
export function looksLikeReferral(code: string): boolean {
  return code.length >= REFERRAL_MIN && code.length <= REFERRAL_MAX && /^[A-Z0-9]+$/.test(code);
}

/** The `ref` in an address search string ("?ref=logoart"), cleaned; null when there is none. */
export function referralFromSearch(search: string): string | null {
  const value = new URLSearchParams(search).get("ref");
  if (value === null) return null;
  const code = cleanReferral(value);
  return code === "" ? null : code;
}

/** The code kept for this visit, or null (also when storage is blocked or unavailable). */
export function storedReferral(): string | null {
  try {
    const code = cleanReferral(window.sessionStorage.getItem(REFERRAL_STORAGE_KEY) ?? "");
    return code === "" ? null : code;
  } catch {
    return null;
  }
}

/** Keeps (or, with null, forgets) the code for this visit. Never throws: the page works without storage. */
export function storeReferral(code: string | null): void {
  try {
    if (code === null || code === "") window.sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
    else window.sessionStorage.setItem(REFERRAL_STORAGE_KEY, code);
  } catch {
    /* blocked storage: the code lives in the form only */
  }
}

/** What the server's check said about a code. */
export type ReferralVerdict =
  | { kind: "none" }
  | { kind: "checking"; code: string }
  /** The code applies; `priceKobo` is what the person pays (0 is no payment). */
  | { kind: "applies"; code: string; priceKobo: number }
  | { kind: "notApplied"; code: string; reason: "full" | "inactive"; priceKobo: number }
  | { kind: "unknown"; code: string; message: string }
  /** The check could not be made (offline, busy). The server decides when the person registers. */
  | { kind: "unchecked"; code: string };

/** What the person will be charged: the code's price when it applies, otherwise the offer's. */
export function payKoboFor(offerKobo: number, verdict: ReferralVerdict): number {
  return verdict.kind === "applies" ? verdict.priceKobo : offerKobo;
}

/** True when the person pays nothing: the code applies at price 0. */
export function isNoPayment(offerKobo: number, verdict: ReferralVerdict): boolean {
  return payKoboFor(offerKobo, verdict) === 0 && verdict.kind === "applies";
}
