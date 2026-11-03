import { apiFetch, ApiError, isNetworkError } from "@/lib/api/client";
import { formatNairaFromKobo } from "@/lib/format";
import type { FlutterwaveChargeConfig } from "@/lib/flutterwave";
import type { components, operations } from "@/types/api.generated";
import type { WaitlistTier, WaitlistTiers } from "@/lib/join-tiers";

/**
 * The event registration link's four public routes (backend JOIN-01, R-48).
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
/**
 * The three fields the owner's redesign added (JOIN-V2: the craft, the city
 * and the updates answer) are in the backend's contract, but this repo's pinned
 * copy (`contract/openapi.json`) predates them, so they are declared here until
 * `npm run contract:sync` is next run. That refresh also brings in every route
 * the backend has added since, which is not this task's change; once it has
 * run, the intersection below can be dropped.
 */
type RegistrationBody = components["schemas"]["CreateWaitlistRegistrationDto"] & {
  craft?: string;
  city?: string;
  updatesOptIn?: boolean;
  /** REF-01: an optional referral code. Left out, the registration is exactly what it was before codes. */
  referralCode?: string;
  /** JOIN-TIERS (R-125): the plan being bought (`verify`, `plus`, `founding`). Left out, the registration is the old offer's Verify. */
  tier?: string;
};

export type WaitlistOffer = operations["WaitlistPublicController_currentOffer"]["responses"][200]["content"]["application/json"];
export type WaitlistStatus = operations["WaitlistPublicController_status"]["responses"][200]["content"]["application/json"];

/**
 * REF-01 widened the register answer three ways, all declared here until
 * `npm run contract:sync` next copies the backend's contract: `flutterwaveConfig`
 * is absent when the registration is already complete (a referral code at price
 * 0 opens no payment window), `completed` then carries what the page shows next,
 * and `referral` says what became of a code that was sent.
 */
export type WaitlistStart = Omit<
  operations["WaitlistPublicController_register"]["responses"][200]["content"]["application/json"],
  "flutterwaveConfig"
> & {
  flutterwaveConfig?: operations["WaitlistPublicController_register"]["responses"][200]["content"]["application/json"]["flutterwaveConfig"];
  completed?: { status: "paid"; firstName: string; accessCode: string };
  referral?: { code: string; applied: boolean; reason?: "full" | "inactive" | "other_tier" };
  /** JOIN-TIERS: the plan this registration pays for, when one was named. */
  tier?: string;
};

/** GET /waitlist/referral-codes/:code: does it apply, and what would the person pay. */
export interface WaitlistReferralCheck {
  code: string;
  applies: boolean;
  /** Only when `applies` is false. `other_tier` is a real code that is bound to a different plan (R-125: the Hub binds LOGOART to the verify tier; the page shows the Hub's reason). */
  reason?: "full" | "inactive" | "other_tier";
  /** What the person would pay, in whole kobo (the code's price, or the plan's full price). 0 means no payment. */
  priceKobo: number;
  /** Asked with a plan: the plan the price is for, and the plan the code belongs to. */
  tier?: string;
  forTier?: string;
  /** With `other_tier`: the Hub's plain sentence, shown as it is. */
  message?: string;
}

/**
 * GET /waitlist/referral-codes/:code, before paying. Never carries the limit,
 * the count or the community. An unknown code is a 404 `referral_unknown`
 * (see `refusalOf`).
 */
export function checkReferralCode(code: string, tier?: string): Promise<WaitlistReferralCheck> {
  const query = tier ? `?tier=${encodeURIComponent(tier)}` : "";
  return apiFetch<WaitlistReferralCheck>(`/api/hub/waitlist/referral-codes/${encodeURIComponent(code)}${query}`);
}

/**
 * GET /waitlist/tiers (JOIN-TIERS, R-125): the three plans the app sells, at the app's live prices, with
 * what each gives. Public. The page draws every figure and benefit from this answer and writes none itself.
 */
export function getTiers(): Promise<WaitlistTiers> {
  return apiFetch<WaitlistTiers>("/api/hub/waitlist/tiers");
}

/** GET /waitlist/offers/current: the offer open now, or a 404 `no_open_offer`. */
export function getCurrentOffer(): Promise<WaitlistOffer> {
  return apiFetch<WaitlistOffer>("/api/hub/waitlist/offers/current");
}

/**
 * POST /waitlist/registrations: register, and get the reference plus the
 * Flutterwave settings to pay with. Nothing is charged by this call. The
 * amount and currency in `checkout` are the server's, from its price file.
 *
 * `amountKobo` is what the server will charge, and it is the truth: the page
 * compares it with the fee the button showed before it opens any window, so a
 * price changed while the form was open is never charged unseen.
 */
export async function startRegistration(
  offer: WaitlistOffer,
  input: Pick<RegistrationBody, "fullName" | "phone" | "email" | "craft" | "city" | "updatesOptIn" | "referralCode" | "tier">,
): Promise<{
  reference: string;
  amountKobo: number;
  /** The payment window's settings; null when the registration is already complete (no payment). */
  checkout: FlutterwaveChargeConfig | null;
  /** Present when the registration is complete at once (a referral code at price 0): no window, show the access code. */
  completed: { firstName: string } | null;
  /** What became of the code, when one was sent. */
  referral: { code: string; applied: boolean; reason?: "full" | "inactive" | "other_tier" } | null;
}> {
  const body: RegistrationBody = { offerId: offer.id, ...input, consent: true };
  const started = await apiFetch<WaitlistStart>("/api/hub/waitlist/registrations", { method: "POST", body });
  const f = started.flutterwaveConfig;
  return {
    reference: started.reference,
    amountKobo: started.amountKobo,
    checkout: f
      ? {
          publicKey: f.publicKey,
          txRef: f.txRef,
          amount: f.amount,
          currency: f.currency,
          customerEmail: f.customerEmail,
          customerName: f.customerName,
        }
      : null,
    completed: started.completed ? { firstName: started.completed.firstName } : null,
    referral: started.referral ?? null,
  };
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

/**
 * The fee, from the API ("₦2,000"). The page draws it on the hero button, the
 * offer card, the pay button, the questions and the sticky bar, always beside
 * the owner's struck-through "was" price (join-content.ts). It never says the
 * offer's name, how long the plan lasts or when registration closes (the API
 * still sends those; the page does not read them).
 */
export function offerPrice(offer: WaitlistOffer): string {
  return formatNairaFromKobo(offer.priceKobo);
}

export type { WaitlistTier, WaitlistTiers };

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
