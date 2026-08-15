import type { Session } from "@/lib/api/mocks/session";

/**
 * Single source of truth for the two creator gates. They are INDEPENDENT:
 *   - `subscriptionPaid` unlocks uploading and creator tools
 *   - `kyc === "approved"` unlocks receiving earnings
 *
 * `subscriptionPaid && kyc !== "approved"` (awaitingKyc) is a normal state,
 * not an edge case — most new creators live there for their first few days.
 *
 * Derive gates from here. Do not re-check `session.creator.kyc` inline.
 */
export function creatorGates(session: Session) {
  const c = session.creator;
  return {
    isCreator: session.accountType === "creator" && c !== null,
    canUpload: !!c?.subscriptionPaid,
    canEarn: c?.kyc === "approved",
    awaitingKyc: !!c?.subscriptionPaid && c?.kyc !== "approved",
    kycStatus: c?.kyc ?? "not_started",
    tier: c?.tier ?? null,
    dmPrice: c?.dmPrice ?? 0,
    slotsUsed: c?.slotsUsed ?? 0,
    slotsTotal: c?.slotsTotal ?? 0,
    slotsRemaining: Math.max(0, (c?.slotsTotal ?? 0) - (c?.slotsUsed ?? 0)),
  };
}
