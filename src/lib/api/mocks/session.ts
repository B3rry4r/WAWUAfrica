import type { AccountType, CreatorTier, KycStatus } from "@/types/account";
import { MAX_ITEMS_PER_ACCOUNT } from "@/lib/auth/gates";

export interface Session {
  accountType: AccountType;
  name: string;
  handle: string;
  creator: {
    tier: CreatorTier;
    kyc: KycStatus;
    slotsUsed: number;
    slotsTotal: number;
    dmPrice: number;
  } | null;
}

/**
 * Single mutable session store. There is no auth backend yet; the mock is the
 * source of truth. Components read through the API layer, never this directly.
 */
export const currentSession: Session = {
  accountType: "creator",
  name: "Chidi Okafor",
  handle: "chidi.sells",
  creator: {
    tier: "pro",
    kyc: "pending",
    slotsUsed: 4,
    slotsTotal: MAX_ITEMS_PER_ACCOUNT,
    dmPrice: 300,
  },
};

/**
 * DEV ONLY — remove when the real session endpoint is live.
 *
 * These switches exist so every gate combination (user/creator, kyc
 * pending/approved/rejected) is reachable without a backend. They mutate the
 * mock store directly and must never ship.
 *
 * There used to be a setSubscriptionPaid switch here. Subscriptions are gone:
 * uploading is not gated by payment, so there is no such state to simulate.
 */
export function setAccountType(type: AccountType): void {
  currentSession.accountType = type;
}

export function setKycStatus(status: KycStatus): void {
  if (!currentSession.creator) return;
  currentSession.creator.kyc = status;
}
