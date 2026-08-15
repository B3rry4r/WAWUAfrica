import type { AccountType, CreatorTier, KycStatus } from "@/types/account";

export interface Session {
  accountType: AccountType;
  name: string;
  handle: string;
  creator: {
    tier: CreatorTier;
    subscriptionPaid: boolean;
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
    subscriptionPaid: true,
    kyc: "pending",
    slotsUsed: 4,
    slotsTotal: 7,
    dmPrice: 300,
  },
};

export function setAccountType(type: AccountType): void {
  currentSession.accountType = type;
}

export function setCreatorTier(tier: CreatorTier): void {
  if (!currentSession.creator) return;
  currentSession.creator.tier = tier;
  currentSession.creator.slotsTotal = tier === "pro" ? 7 : 3;
}

export function setKycStatus(status: KycStatus): void {
  if (!currentSession.creator) return;
  currentSession.creator.kyc = status;
}

export function setSubscriptionPaid(paid: boolean): void {
  if (!currentSession.creator) return;
  currentSession.creator.subscriptionPaid = paid;
}
