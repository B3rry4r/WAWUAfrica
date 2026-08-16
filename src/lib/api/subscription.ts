import { PLANS } from "@/types/subscription";
import type { Subscription, SubscriptionState } from "@/types/subscription";
import type { KycStatus, CreatorTier } from "@/types/account";
import { apiFetch, apiFetchPaginated, isMockModeError, mockRequest } from "./client";

/** Basic ₦5,999/yr, Pro ₦18,999/yr. Yearly, paid up front. */
export const currentSubscription: Subscription = {
  plan: { tier: "pro", price: 18999, slots: 7, freeSlots: 2, split: 90, features: [] },
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
 * Bridges POST /creator-subscription (or /upgrade) -> POST /verify.
 *
 * JUDGMENT / real gap: a genuine production flow needs Flutterwave's inline
 * checkout SDK between init and verify (the creator enters/confirms a card
 * in a popup, which yields a real `transaction_id`) — that SDK integration
 * has not been built into SubscriptionManagement.tsx yet, so there is no
 * real transaction_id available client-side today. This generates a
 * synthetic one and calls verify immediately, exactly mirroring the
 * already-established initiateUnlock -> verifyUnlock precedent in
 * content.ts. This only resolves as a genuine "successful" charge because
 * MockFlutterwaveAdapter (server-side, dev/test) treats any transaction_id
 * other than its reserved failure sentinel as successful — against
 * RealFlutterwaveAdapter in production this would not represent an actual
 * charge. Flagged in the wiring report; the inline-SDK integration is a
 * follow-up dependency, not something this file alone can complete.
 */
async function verifySubscriptionCharge(txRef: string): Promise<CreatorSubscriptionRow> {
  return apiFetch<CreatorSubscriptionRow>("/api/hub/creator-subscription/verify", {
    method: "POST",
    authed: true,
    body: { transaction_id: `txn-${Date.now()}`, tx_ref: txRef },
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
  subscribe: (tier: CreatorTier) => Promise<Subscription>;
  upgradeToPro: () => Promise<Subscription>;
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
      if (!isMockModeError(e)) throw e;
      // SEAM: replace with GET /api/hub/creator-subscription — also 404s
      // (falls here) for a creator account that has never subscribed.
      return mockRequest({ ...currentSubscription });
    }
  },

  subscribe: async (tier) => {
    try {
      const init = await apiFetch<FlutterwaveConfigResponse>("/api/hub/creator-subscription", {
        method: "POST",
        authed: true,
        body: { tier },
      });
      const row = await verifySubscriptionCharge(init.flutterwaveConfig.txRef);
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
      const row = await verifySubscriptionCharge(init.flutterwaveConfig.txRef);
      return toSubscription(row);
    } catch (e) {
      if (!isMockModeError(e)) throw e;
      currentSubscription.plan = { ...PLANS.pro };
      currentSubscription.state = "active";
      currentSubscription.cancelsAt = undefined;
      // SEAM: replace with POST /api/hub/creator-subscription/upgrade + POST .../verify
      return mockRequest({ ...currentSubscription }, 700);
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
  getKycGate: () => mockRequest("pending"),

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
