/**
 * What /join keeps in the browser: a reference, and nothing about the person.
 *
 * A refresh in the middle of registering has to pick up where it was, and the
 * only thing it needs for that is the registration's reference (a random
 * string the server made) and, once Flutterwave has handed one back, the
 * transaction id of the charge. Neither identifies anyone. The name, phone and
 * email the person typed live in the form's own state and die with the page;
 * they are never written here, to localStorage, or to a cookie.
 *
 * sessionStorage rather than localStorage so the record goes when the tab
 * does, and every access is guarded because storage throws outright in a
 * private window: a storage failure must not take registration down with it.
 */

const KEY = "wawu.join.registration";
const ABANDONED_KEY = "wawu.join.abandoned";
/** How many walked-away-from references are remembered (the newest win). */
const ABANDONED_KEEP = 8;

export interface JoinResume {
  /** The registration's reference (the tx_ref). */
  reference: string;
  /** Set once Flutterwave has returned a transaction id. From then on the page never offers to pay again. */
  transactionId?: string;
}

const REFERENCE_SHAPE = /^[A-Za-z0-9_-]{8,128}$/;
/** Flutterwave transaction ids are numbers; the backend takes up to 20 digits. */
const TRANSACTION_SHAPE = /^[0-9]{1,20}$/;

/** Narrows whatever is in storage (or in a URL) to a record this page wrote. */
export function isReference(value: unknown): value is string {
  return typeof value === "string" && REFERENCE_SHAPE.test(value);
}

export function isTransactionId(value: unknown): value is string {
  return typeof value === "string" && TRANSACTION_SHAPE.test(value);
}

/**
 * The short form of a reference for a person to read out: the first 8
 * characters of its random part, upper-cased, in two groups of 4
 * ("wawu-join-47331ba7..." is "4733 1BA7"). It is only for the eye. The full
 * reference stays in sessionStorage, in the /join/paid address and in every
 * API call, and it starts with these 8 characters, so support can match a
 * spoken one against the admin export.
 */
export function shortReference(reference: string): string {
  const random = reference.replace(/^wawu-join-/i, "").replace(/[^A-Za-z0-9]/g, "");
  const head = random.slice(0, 8).toUpperCase();
  return head.length > 4 ? `${head.slice(0, 4)} ${head.slice(4)}` : head;
}

export const joinResume = {
  get(): JoinResume | null {
    try {
      const raw = window.sessionStorage.getItem(KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (typeof parsed !== "object" || parsed === null) return null;
      const bag = parsed as { reference?: unknown; transactionId?: unknown };
      if (!isReference(bag.reference)) return null;
      return {
        reference: bag.reference,
        transactionId: isTransactionId(bag.transactionId) ? bag.transactionId : undefined,
      };
    } catch {
      return null;
    }
  },
  set(value: JoinResume): void {
    try {
      window.sessionStorage.setItem(KEY, JSON.stringify(value));
    } catch {
      // Non-fatal: without it a refresh starts again from the form.
    }
  },
  clear(): void {
    try {
      window.sessionStorage.removeItem(KEY);
    } catch {
      // Nothing to clear.
    }
  },
};

/**
 * References the person chose to walk away from with "Start again", after the
 * five minutes of checking found no payment. The server reuses an unpaid
 * registration for the same offer, phone and email, so a fresh form filled in
 * with the same details can come back with the SAME reference. If a transfer
 * landed late on that reference, a second window on it would charge it twice
 * (and the second charge is invisible to the server). The page therefore never
 * opens a payment window on a reference listed here. Like the resume record it
 * holds references only, in sessionStorage, and a storage failure is not fatal.
 */
export const joinAbandoned = {
  list(): string[] {
    try {
      const raw = window.sessionStorage.getItem(ABANDONED_KEY);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.filter(isReference).slice(-ABANDONED_KEEP) : [];
    } catch {
      return [];
    }
  },
  has(reference: string): boolean {
    return joinAbandoned.list().includes(reference);
  },
  add(reference: string): void {
    if (!isReference(reference)) return;
    try {
      const next = [...joinAbandoned.list().filter((r) => r !== reference), reference].slice(-ABANDONED_KEEP);
      window.sessionStorage.setItem(ABANDONED_KEY, JSON.stringify(next));
    } catch {
      // Non-fatal: the five-minute wait and the confirmation still stand in front of "Start again".
    }
  },
};
