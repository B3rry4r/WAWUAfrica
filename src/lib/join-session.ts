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
