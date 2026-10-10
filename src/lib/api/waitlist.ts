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
type RegistrationBody = components["schemas"]["CreateWaitlistRegistrationDto"];

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
 */
export async function startRegistration(
  offer: WaitlistOffer,
  input: Pick<RegistrationBody, "fullName" | "phone" | "email" | "state" | "makes">,
): Promise<{ reference: string; checkout: FlutterwaveChargeConfig }> {
  const body: RegistrationBody = { offerId: offer.id, ...input, consent: true };
  const started = await apiFetch<WaitlistStart>("/api/hub/waitlist/registrations", { method: "POST", body });
  const f = started.flutterwaveConfig;
  return {
    reference: started.reference,
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

/** GET /waitlist/registrations/:reference: the status and first name only, never a phone or email. */
export async function getRegistrationStatus(
  reference: string,
): Promise<{ paid: boolean; failed: boolean; firstName: string }> {
  const r = await apiFetch<WaitlistStatus>(`/api/hub/waitlist/registrations/${encodeURIComponent(reference)}`);
  return { paid: r.status === "paid", failed: r.status === "failed", firstName: r.firstName };
}

/**
 * The fee, from the API ("₦2,000"). It is drawn on the pay button and nowhere
 * else: the page has no offer card, and it says nothing about the offer's
 * name, what the fee includes, how long the plan lasts or when registration
 * closes (the API still sends those; the page does not read them).
 */
export function offerPrice(offer: WaitlistOffer): string {
  return formatNairaFromKobo(offer.priceKobo);
}

/** A field the server refused, so the page can say so under that field. */
export type RefusedField = "fullName" | "phone" | "email" | "consent";

export type Refusal =
  | { kind: "no_open_offer" | "offer_closed" | "already_registered" | "not_found" }
  | { kind: "field"; field: RefusedField; message: string }
  | { kind: "rate_limited" | "payments_unavailable" | "invalid" | "unreachable" | "unknown"; message: string };

const FIELD_OF_CODE: Record<string, RefusedField> = {
  name_invalid: "fullName",
  phone_invalid: "phone",
  email_invalid: "email",
  consent_required: "consent",
};

/** Turns whatever a call threw into the one thing the page should do about it. */
export function refusalOf(e: unknown): Refusal {
  if (isNetworkError(e)) {
    return { kind: "unreachable", message: "We couldn't reach WAWU. Check your connection and try again. You have not been charged." };
  }
  if (e instanceof ApiError) {
    const code = e.code ?? "";
    if (code === "no_open_offer" || code === "offer_closed" || code === "already_registered" || code === "not_found") {
      return { kind: code };
    }
    const field = FIELD_OF_CODE[code];
    if (field) return { kind: "field", field, message: e.serverMessage ?? "Check this and try again." };
    if (code === "payments_unavailable") {
      return { kind: "payments_unavailable", message: "Payments are not available right now. You have not been charged. Please try again later." };
    }
    if (e.status === 429) {
      return { kind: "rate_limited", message: "Too many attempts from this connection. Wait a minute and try again. You have not been charged." };
    }
    if (e.status === 400) return { kind: "invalid", message: e.serverMessage ?? "Check your details and try again." };
    if (e.status >= 500) {
      return { kind: "unreachable", message: "Something went wrong on our side. You have not been charged. Try again in a moment." };
    }
  }
  return { kind: "unknown", message: "Something went wrong. You have not been charged. Try again in a moment." };
}
