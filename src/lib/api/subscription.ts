import type { Subscription } from "@/types/subscription";
import type { KycStatus } from "@/types/account";
import { mockRequest } from "./client";

/** Basic ₦5,999/yr, Pro ₦18,999/yr. Yearly, paid up front. */
export const currentSubscription: Subscription = {
  plan: { tier: "pro", price: 18999, slots: 7, freeSlots: 2, split: 90, features: [] },
  state: "active",
  renewsAt: "2027-08-14T00:00:00.000Z",
};

export interface SubscriptionApi {
  getSubscription: () => Promise<Subscription>;
  upgradeToPro: () => Promise<Subscription>;
  cancelPro: () => Promise<Subscription>;
  getKycGate: () => Promise<KycStatus>;
}

export const subscriptionApi: SubscriptionApi = {
  // SEAM: replace with GET /api/hub/creator-subscription
  getSubscription: () => mockRequest({ ...currentSubscription }),

  upgradeToPro: async () => {
    currentSubscription.plan = {
      tier: "pro",
      price: 18999,
      slots: 7,
      freeSlots: 2,
      split: 90,
      features: [],
    };
    currentSubscription.state = "active";
    // SEAM: replace with POST /api/hub/creator-subscription (tier=pro)
    return mockRequest({ ...currentSubscription }, 700);
  },

  cancelPro: async () => {
    currentSubscription.state = "active";
    currentSubscription.cancelsAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    // SEAM: replace with DELETE /api/hub/creator-subscription
    return mockRequest({ ...currentSubscription }, 700);
  },

  // SEAM: replace with GET /api/hub/creator/kyc/status
  getKycGate: () => mockRequest("pending"),
};
