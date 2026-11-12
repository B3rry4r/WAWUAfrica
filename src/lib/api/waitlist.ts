import { apiFetch, ApiError, isNetworkError } from "@/lib/api/client";
import type { operations } from "@/types/api.generated";

/**
 * The event registration link's public routes (backend JOIN-01, R-48). Since R-141 (owner, 12 Nov 2026) the
 * website starts no registration: /join/paid only reads the status of a payment already made, and the admin
 * referral page reads the open offer.
 *
 * A waiting list, not an account: none of these takes a token, and the page
 * that calls them has no session. Every shape here is the generated contract
 * (`src/types/api.generated.ts`, copied from the backend's own OpenAPI), so a
 * field the backend renames stops compiling here instead of breaking a
 * payment at an event.
 *
 * The backend explains each refusal as `reason.code` (client.ts puts it on
 * `ApiError.code`). The page switches on that code, never on a message.
 */
export type WaitlistOffer = operations["WaitlistPublicController_currentOffer"]["responses"][200]["content"]["application/json"];
export type WaitlistStatus = operations["WaitlistPublicController_status"]["responses"][200]["content"]["application/json"];

/** GET /waitlist/offers/current: the offer open now, or a 404 `no_open_offer`. */
export function getCurrentOffer(): Promise<WaitlistOffer> {
  return apiFetch<WaitlistOffer>("/api/hub/waitlist/offers/current");
}

/**
 * POST /waitlist/registrations/verify: the server asks Flutterwave itself
 * whether this transaction paid this registration. Safe to call again with
 * the same pair (it answers the same result), which is what "Check again"
 * does. A payment that is not confirmed yet is a 409 `payment_not_confirmed`.
 */
export async function verifyRegistration(
  reference: string,
  transactionId: string,
): Promise<{ paid: boolean; reference: string; firstName: string }> {
  const r = await apiFetch<WaitlistStatus>("/api/hub/waitlist/registrations/verify", {
    method: "POST",
    body: { reference, transactionId },
  });
  return { paid: r.status === "paid", reference: r.reference, firstName: r.firstName };
}

/**
 * GET /waitlist/registrations/:reference: the status and first name only,
 * never a phone or email.
 *
 * `failed` is not a failed payment. It is the server's name for a SECOND
 * payment by someone who is already registered, kept for a refund.
 */
export async function getRegistrationStatus(
  reference: string,
): Promise<{ status: WaitlistStatus["status"]; firstName: string }> {
  const r = await apiFetch<WaitlistStatus>(`/api/hub/waitlist/registrations/${encodeURIComponent(reference)}`);
  return { status: r.status, firstName: r.firstName };
}

/** The words for a code the server does not have: the same the server sends, kept for when it sends none. */
export const REFERRAL_UNKNOWN_WORDS =
  "We do not recognise that referral code. Check it, or leave it empty to pay the standard price.";

/**
 * The words for an address that tried too many codes (429 `referral_attempts_limited`):
 * the same the server sends, kept for when it sends none. It says minutes, not
 * seconds, because the wait is minutes.
 */
export const REFERRAL_PROBING_WORDS =
  "Too many codes were tried from this connection. Please wait a few minutes and try again, or leave the code empty to pay the standard price.";

/** A field the server refused, so the page can say so under that field. */
export type RefusedField = "fullName" | "phone" | "email" | "consent";

/**
 * Every `reason.code` the four routes can give (backend JOIN-01,
 * `waitlist-error.ts`). `refusalOf` has one `case` per code and ends in a
 * `never` check, so a code added here and not handled stops the build. A code
 * the server adds later, which this list cannot know, lands on `unknown`: the
 * page treats that as "not sure", and never says "not charged" after a payment
 * because of it.
 */
type WaitlistCode =
  | "no_open_offer"
  | "offer_closed"
  | "already_registered"
  | "not_found"
  | "payment_not_confirmed"
  | "payment_mismatch"
  | "transaction_already_used"
  | "payment_check_unavailable"
  | "payments_unavailable"
  | "phone_invalid"
  | "email_invalid"
  | "name_invalid"
  | "consent_required"
  | "referral_unknown"
  | "tier_invalid";

export type Refusal =
  | {
      kind:
        | "no_open_offer"
        | "offer_closed"
        | "already_registered"
        | "not_found"
        | "payment_not_confirmed"
        | "payment_mismatch"
        | "transaction_already_used"
        | "payment_check_unavailable";
    }
  | { kind: "field"; field: RefusedField; message: string }
  /** REF-01: a referral code the server does not have. Nothing was charged; the page says so under the code field. */
  | { kind: "referral_unknown"; message: string }
  /** JOIN-TIERS: the plan asked for is not one the Hub sells (it changed while the page was open). Nothing was charged. */
  | { kind: "tier_invalid"; message: string }
  | { kind: "rate_limited" | "payments_unavailable" | "invalid" | "unreachable" | "unknown"; message: string };

const WAITLIST_CODES: readonly WaitlistCode[] = [
  "no_open_offer",
  "offer_closed",
  "already_registered",
  "not_found",
  "payment_not_confirmed",
  "payment_mismatch",
  "transaction_already_used",
  "payment_check_unavailable",
  "payments_unavailable",
  "name_invalid",
  "phone_invalid",
  "email_invalid",
  "consent_required",
  "referral_unknown",
  "tier_invalid",
];

function isWaitlistCode(code: string): code is WaitlistCode {
  return (WAITLIST_CODES as readonly string[]).includes(code);
}

/** Turns whatever a call threw into the one thing the page should do about it. */
export function refusalOf(e: unknown): Refusal {
  if (isNetworkError(e)) {
    return { kind: "unreachable", message: "We couldn't reach WAWU. Check your connection and try again. You have not been charged." };
  }
  if (e instanceof ApiError) {
    const code = e.code ?? "";
    if (isWaitlistCode(code)) {
      const field = (name: RefusedField): Refusal => ({
        kind: "field",
        field: name,
        message: e.serverMessage ?? "Check this and try again.",
      });
      // One case per code: adding a code to WaitlistCode without a case here
      // stops the build, which is how "no code falls through silently" is kept.
      switch (code) {
        case "no_open_offer":
        case "offer_closed":
        case "already_registered":
        case "not_found":
        case "payment_not_confirmed":
        case "payment_mismatch":
        case "transaction_already_used":
        case "payment_check_unavailable":
          return { kind: code };
        case "payments_unavailable":
          return { kind: "payments_unavailable", message: "Payments are not available right now. You have not been charged. Please try again later." };
        case "name_invalid":
          return field("fullName");
        case "phone_invalid":
          return field("phone");
        case "email_invalid":
          return field("email");
        case "consent_required":
          return field("consent");
        case "referral_unknown":
          return { kind: "referral_unknown", message: e.serverMessage ?? REFERRAL_UNKNOWN_WORDS };
        case "tier_invalid":
          return { kind: "tier_invalid", message: "That plan is not available right now. You have not been charged. Please choose a plan again." };
        default: {
          const unmapped: never = code;
          void unmapped;
        }
      }
    }
    if (e.status === 429) {
      if (e.code === "referral_attempts_limited") {
        return { kind: "rate_limited", message: e.serverMessage ?? REFERRAL_PROBING_WORDS };
      }
      return { kind: "rate_limited", message: "Busy right now. Wait a few seconds and try again. You have not been charged." };
    }
    if (e.status === 400) return { kind: "invalid", message: e.serverMessage ?? "Check your details and try again." };
    if (e.status >= 500) {
      return { kind: "unreachable", message: "Something went wrong on our side. You have not been charged. Try again in a moment." };
    }
  }
  return { kind: "unknown", message: "Something went wrong. You have not been charged. Try again in a moment." };
}
