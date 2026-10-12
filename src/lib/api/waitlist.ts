import { apiFetch, ApiError, isNetworkError } from "@/lib/api/client";
import { formatNairaFromKobo } from "@/lib/format";
import type { FlutterwaveChargeConfig } from "@/lib/flutterwave";
import type { components, operations } from "@/types/api.generated";

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
};

export type WaitlistOffer = operations["WaitlistPublicController_currentOffer"]["responses"][200]["content"]["application/json"];
export type WaitlistStart = operations["WaitlistPublicController_register"]["responses"][200]["content"]["application/json"];
export type WaitlistStatus = operations["WaitlistPublicController_status"]["responses"][200]["content"]["application/json"];

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
  input: Pick<RegistrationBody, "fullName" | "phone" | "email" | "craft" | "city" | "updatesOptIn">,
): Promise<{ reference: string; amountKobo: number; checkout: FlutterwaveChargeConfig }> {
  const body: RegistrationBody = { offerId: offer.id, ...input, consent: true };
  const started = await apiFetch<WaitlistStart>("/api/hub/waitlist/registrations", { method: "POST", body });
  const f = started.flutterwaveConfig;
  return {
    reference: started.reference,
    amountKobo: started.amountKobo,
    checkout: {
      publicKey: f.publicKey,
      txRef: f.txRef,
      amount: f.amount,
      currency: f.currency,
      customerEmail: f.customerEmail,
      customerName: f.customerName,
    },
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
  | "consent_required";

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
        default: {
          const unmapped: never = code;
          void unmapped;
        }
      }
    }
    if (e.status === 429) {
      return { kind: "rate_limited", message: "Busy right now. Wait a few seconds and try again. You have not been charged." };
    }
    if (e.status === 400) return { kind: "invalid", message: e.serverMessage ?? "Check your details and try again." };
    if (e.status >= 500) {
      return { kind: "unreachable", message: "Something went wrong on our side. You have not been charged. Try again in a moment." };
    }
  }
  return { kind: "unknown", message: "Something went wrong. You have not been charged. Try again in a moment." };
}
