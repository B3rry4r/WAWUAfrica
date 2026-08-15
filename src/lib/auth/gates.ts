import type { SessionUser } from "@/types/auth";

/**
 * Single source of truth for the two creator gates. See CreatorState in
 * @/types/auth for why they are independent.
 *
 * Never re-derive these inline — if a screen needs a new gate, add it here.
 */
export function creatorGates(user: SessionUser | null) {
  const c = user?.creator ?? null;
  return {
    isCreator: user?.accountType === "creator" && c !== null,
    /** Subscription unlocks uploading and creator tools. */
    canUpload: !!c?.subscriptionPaid,
    /** Manual KYC approval unlocks receiving earnings. */
    canEarn: c?.kyc === "approved",
    /** The common in-between state: paid, publishing, waiting on verification. */
    awaitingKyc: !!c?.subscriptionPaid && c?.kyc !== "approved",
    kycStatus: c?.kyc ?? "not_started",
    tier: c?.tier ?? null,
    dmEnabled: !!c?.dmEnabled,
    dmPrice: c?.dmPrice ?? 0,
    slotsUsed: c?.slotsUsed ?? 0,
    slotsTotal: c?.slotsTotal ?? 0,
    slotsRemaining: Math.max(0, (c?.slotsTotal ?? 0) - (c?.slotsUsed ?? 0)),
  };
}
