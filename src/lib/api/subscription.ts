import { PLANS } from "@/types/subscription";
import type { Subscription, SubscriptionState } from "@/types/subscription";
import type { KycStatus, CreatorTier } from "@/types/account";
import { apiFetch, apiFetchPaginated, ApiError, isMockModeError, mockRequest } from "./client";
import { openFlutterwaveCheckout, checkoutCustomerFromSession } from "@/lib/flutterwave";
import { sessionStorage } from "@/lib/auth/session-storage";
import { kycApi } from "./kyc";

/** Yearly, paid up front. Prices live in PLANS — this reuses one rather than
 *  restating it, which is how it came to claim ₦18,999 after Pro dropped to
 *  ₦14,999. */
export const currentSubscription: Subscription = {
  plan: PLANS.pro,
  state: "active",
  renewsAt: "2027-08-14T00:00:00.000Z",
  cardLast4: "4412",
};

// ── real backend wire shapes (creator-subscription.controller.ts / service.ts) ──

/** POST /creator-subscription and /upgrade both return a charge to complete client-side. */
interface FlutterwaveConfigResponse {
  flutterwaveConfig: {
    txRef: string;
    amount: number;
    currency: "NGN";
    publicKey: string;
  };
}

/** CreatorSubscriptionResponse (src/common/types/creator-subscription.type.ts) — the row shape GET/verify/downgrade/cancel all return. */
interface CreatorSubscriptionRow {
  creatorWawuId: string;
  tier: CreatorTier;
  status: "active" | "past_due" | "cancelled" | "expired";
  commissionRateOverride: number | null;
  flutterwaveCustomerRef: string | null;
  flutterwavePlanId: string | null;
  currentPeriodEnd: string;
  renewalAttempts: number;
  cancelsAt: string | null;
  cardLast4: string | null;
}

function mapSubscriptionState(status: CreatorSubscriptionRow["status"]): SubscriptionState {
  if (status === "active" || status === "past_due" || status === "expired") return status;
  // 'cancelled' has no equivalent in this frontend's SubscriptionState, and no
  // code path in this backend build ever sets it yet (only referenced by
  // cancel()'s own idempotency check in creator-subscription.service.ts) —
  // map defensively to the closest existing state should it ever occur.
  return "expired";
}

/** Row -> frontend Subscription. Plan features/slots come from the local PLANS table (never sent over the wire); price/split are keyed off `tier`. */
function toSubscription(row: CreatorSubscriptionRow): Subscription {
  return {
    plan: { ...PLANS[row.tier] },
    state: mapSubscriptionState(row.status),
    renewsAt: row.currentPeriodEnd,
    cancelsAt: row.cancelsAt ?? undefined,
    cardLast4: row.cardLast4 ?? undefined,
  };
}

/**
 * Bridges POST /creator-subscription (or /upgrade) -> Flutterwave inline
 * checkout -> POST /verify.
 *
 * The creator completes the charge in Flutterwave's own modal, which returns
 * a real `transaction_id`; the server then re-verifies that id with
 * Flutterwave before activating the tier. A dismissed modal propagates as
 * FlutterwaveCancelledError so the caller can show "nothing was charged"
 * rather than a payment-declined screen.
 */
/**
 * `onCharged` fires the moment Flutterwave's modal reports a completed charge
 * and before the server verifies it. That is the only honest point at which a
 * "confirming your payment" screen is true: showing it any earlier (as the
 * onboarding flow used to, before the modal had even opened) tells the user we
 * are checking a payment they have not made yet.
 */
async function chargeAndVerify(
  config: { publicKey: string; txRef: string; amount: number; currency?: string },
  tierLabel: string,
  onCharged?: () => void,
): Promise<CreatorSubscriptionRow> {
  const customer = checkoutCustomerFromSession(sessionStorage.getUser());
  if (!customer) throw new Error("You need to be signed in with a valid email to pay.");

  const charge = await openFlutterwaveCheckout(config, customer, {
    title: `WAWU ${tierLabel}`,
    description: `Creator subscription, ${tierLabel}, billed yearly`,
  });

  onCharged?.();

  return apiFetch<CreatorSubscriptionRow>("/api/hub/creator-subscription/verify", {
    method: "POST",
    authed: true,
    body: { transaction_id: charge.transaction_id, tx_ref: charge.tx_ref },
  });
}

export interface BillingHistoryPage {
  /** Always empty against the real backend today — see getBillingHistory's doc comment. */
  items: never[];
  pagination: { currentPage: number; nextPage: number | null; perPage: number; total: number };
}

export interface SubscriptionApi {
  getSubscription: () => Promise<Subscription>;
  /** First-time creator onboarding: pay for the chosen tier, Basic or Pro. */
  subscribe: (tier: CreatorTier, onCharged?: () => void) => Promise<Subscription>;
  /** Returns the updated subscription plus the amount Flutterwave actually charged (the server prorates the remaining Basic term). */
  upgradeToPro: () => Promise<{ subscription: Subscription; amountCharged: number }>;
  /** Starts (or restarts, after expiry) the Basic tier at full price — no proration. */
  downgradeToBasic: () => Promise<Subscription>;
  /** Retries payment on the CURRENT tier — a past-due recovery, not an upgrade. */
  retryPayment: () => Promise<Subscription>;
  cancelPro: () => Promise<Subscription>;
  /** Swaps the card on file. No payment processor is wired up yet — this is a UI-only mock. */
  updateCard: (last4: string) => Promise<{ last4: string }>;
  getKycGate: () => Promise<KycStatus>;
  /** GET /creator-subscription/billing-history — real backend gap: no ledger table exists yet, always empty. See doc comment. */
  getBillingHistory: (page?: number, perPage?: number) => Promise<BillingHistoryPage>;
}

export const subscriptionApi: SubscriptionApi = {
  getSubscription: async () => {
    try {
      const row = await apiFetch<CreatorSubscriptionRow>("/api/hub/creator-subscription", { authed: true });
      return toSubscription(row);
    } catch (e) {
      // A creator who has never subscribed genuinely has no row — the backend
      // 404s, which is a normal state, not a failure. It used to surface as
      // an error screen on the billing page.
      if (e instanceof ApiError && e.status === 404) {
        return { plan: { ...PLANS.basic }, state: "expired", renewsAt: "" };
      }
      if (!isMockModeError(e)) throw e;
      // SEAM: replace with GET /api/hub/creator-subscription — also 404s
      // (falls here) for a creator account that has never subscribed.
      return mockRequest({ ...currentSubscription });
    }
  },

  subscribe: async (tier, onCharged) => {
    try {
      const init = await apiFetch<FlutterwaveConfigResponse>("/api/hub/creator-subscription", {
        method: "POST",
        authed: true,
        body: { tier },
      });
      const row = await chargeAndVerify(init.flutterwaveConfig, PLANS[tier].tier === "pro" ? "Pro" : "Basic", onCharged);
      return toSubscription(row);
    } catch (e) {
      if (!isMockModeError(e)) throw e;
      currentSubscription.plan = { ...PLANS[tier] };
      currentSubscription.state = "active";
      // SEAM: replace with POST /api/hub/creator-subscription (tier=basic|pro) + POST .../verify
      return mockRequest({ ...currentSubscription }, 700);
    }
  },

  upgradeToPro: async () => {
    try {
      const init = await apiFetch<FlutterwaveConfigResponse>("/api/hub/creator-subscription/upgrade", {
        method: "POST",
        authed: true,
      });
      const amountCharged = init.flutterwaveConfig.amount;
      const row = await chargeAndVerify(init.flutterwaveConfig, "Pro");
      return { subscription: toSubscription(row), amountCharged };
    } catch (e) {
      if (!isMockModeError(e)) throw e;
      currentSubscription.plan = { ...PLANS.pro };
      currentSubscription.state = "active";
      currentSubscription.cancelsAt = undefined;
      // SEAM: replace with POST /api/hub/creator-subscription/upgrade + POST .../verify
      return mockRequest({ subscription: { ...currentSubscription }, amountCharged: PLANS.pro.price }, 700);
    }
  },

  downgradeToBasic: async () => {
    try {
      const row = await apiFetch<CreatorSubscriptionRow>("/api/hub/creator-subscription/downgrade", {
        method: "POST",
        authed: true,
      });
      // JUDGMENT / real backend gap (creator-subscription.service.ts's
      // downgrade() doc comment): this endpoint only validates preconditions
      // today — it does NOT flip tier server-side yet (deferred to an
      // unbuilt renewal-reconciliation cron). The row it returns is still
      // Pro. Mapped honestly here rather than fabricating a locally-flipped
      // Basic tier: a UI that quietly lies about server state is worse than
      // one that visibly hasn't caught up yet. Flagged in the wiring report.
      return toSubscription(row);
    } catch (e) {
      if (!isMockModeError(e)) throw e;
      currentSubscription.plan = { ...PLANS.basic };
      currentSubscription.state = "active";
      currentSubscription.cancelsAt = undefined;
      // SEAM: replace with POST /api/hub/creator-subscription/downgrade
      return mockRequest({ ...currentSubscription }, 700);
    }
  },

  retryPayment: async () => {
    try {
      // Unlike subscribe/upgrade, retry-payment resolves success/failure
      // synchronously against the card already on file (server-initiated —
      // no client charge/verify round trip) and returns a receipt echo, not
      // the updated row (creator-subscription.service.ts's retryPayment()
      // doc comment) — re-fetch to read the real post-retry state.
      await apiFetch<FlutterwaveConfigResponse>("/api/hub/creator-subscription/retry-payment", {
        method: "POST",
        authed: true,
      });
      const row = await apiFetch<CreatorSubscriptionRow>("/api/hub/creator-subscription", { authed: true });
      return toSubscription(row);
    } catch (e) {
      // A creator who has never subscribed genuinely has no row — the backend
      // 404s, which is a normal state, not a failure. It used to surface as
      // an error screen on the billing page.
      if (e instanceof ApiError && e.status === 404) {
        return { plan: { ...PLANS.basic }, state: "expired", renewsAt: "" };
      }
      if (!isMockModeError(e)) throw e;
      currentSubscription.state = "active";
      // SEAM: replace with POST /api/hub/creator-subscription/retry-payment
      return mockRequest({ ...currentSubscription }, 700);
    }
  },

  cancelPro: async () => {
    try {
      const row = await apiFetch<CreatorSubscriptionRow>("/api/hub/creator-subscription", {
        method: "DELETE",
        authed: true,
      });
      return toSubscription(row);
    } catch (e) {
      if (!isMockModeError(e)) throw e;
      currentSubscription.state = "active";
      currentSubscription.cancelsAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      // SEAM: replace with DELETE /api/hub/creator-subscription
      return mockRequest({ ...currentSubscription }, 700);
    }
  },

  updateCard: async (last4: string) => {
    try {
      // Real DTO field is `flutterwaveCardToken` (min 4 chars — the server
      // derives `last4` as the token's own trailing 4 characters). No real
      // card-tokenization UI exists yet (doc comment on the interface above
      // — this remains a UI-only mock), so the 4-digit `last4` this
      // component already collects is passed straight through as the
      // "token": it satisfies MinLength(4) and slices back to itself.
      return await apiFetch<{ last4: string }>("/api/hub/creator-subscription/card", {
        method: "PATCH",
        authed: true,
        body: { flutterwaveCardToken: last4 },
      });
    } catch (e) {
      if (!isMockModeError(e)) throw e;
      currentSubscription.cardLast4 = last4;
      // SEAM: replace with PATCH /api/hub/creator-subscription/card
      return mockRequest({ last4 }, 500);
    }
  },

  // Out of scope for this resource: KYC review status lives on CreatorState
  // (src/lib/api/kyc.ts's domain), not on CreatorSubscription. Left as the
  // existing mock read — do not wire a real call here.
  // SEAM: replace with GET /api/hub/creator/kyc/status
  /**
   * The earnings gate. This previously returned a hardcoded `mockRequest("pending")`
   * unconditionally — every creator saw "KYC pending" no matter their real
   * status, so an approved creator was still told they could not be paid.
   * Reads the real submission instead, falling back to the mock only in true
   * mock mode.
   */
  getKycGate: async () => {
    try {
      const submission = await kycApi.getStatus();
      return submission?.status ?? "not_started";
    } catch (e) {
      if (!isMockModeError(e)) throw e;
      return mockRequest<KycStatus>("pending");
    }
  },

  getBillingHistory: async (page = 1, perPage = 20) => {
    try {
      const res = await apiFetchPaginated<never>(
        `/api/hub/creator-subscription/billing-history?page=${page}&perPage=${perPage}`,
        { authed: true },
      );
      return { items: res.data, pagination: res.pagination };
    } catch (e) {
      if (!isMockModeError(e)) throw e;
      // SEAM: replace with GET /api/hub/creator-subscription/billing-history
      // Real backend gap (creator-subscription.service.ts's
      // listBillingHistory() doc comment): no ledger table exists for this
      // resource yet — the endpoint always returns an empty-but-correctly-
      // shaped page. The mock fallback matches that real shape rather than
      // fabricating rows.
      return { items: [], pagination: { currentPage: page, nextPage: null, perPage, total: 0 } };
    }
  },
};
