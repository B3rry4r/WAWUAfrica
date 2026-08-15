import type { SessionUser } from "@/types/auth";
import type { Session } from "@/lib/api/mocks/session";
import type { CreatorTier, KycStatus } from "@/types/account";

/**
 * Single source of truth for the two creator gates. They are INDEPENDENT:
 *   - `subscriptionPaid` unlocks uploading and creator tools
 *   - `kyc === "approved"` unlocks receiving earnings
 *
 * `subscriptionPaid && kyc !== "approved"` (awaitingKyc) is a normal state,
 * not an edge case — most new creators live there for their first few days.
 * They can upload, publish and sell; they just cannot be paid out yet.
 *
 * Accepts either the authenticated SessionUser or the mock Session, since both
 * carry the same creator shape. Derive gates from here — never re-check
 * `creator.kyc` or `creator.subscriptionPaid` inline in a component.
 */
interface CreatorLike {
  tier: CreatorTier;
  subscriptionPaid: boolean;
  kyc: KycStatus;
  slotsUsed: number;
  slotsTotal: number;
  dmPrice: number;
  dmEnabled?: boolean;
}

type GateSource =
  | (Pick<SessionUser, "accountType"> & { creator: CreatorLike | null })
  | (Pick<Session, "accountType"> & { creator: CreatorLike | null })
  | null;

export function creatorGates(source: GateSource) {
  const c = source?.creator ?? null;
  return {
    isCreator: source?.accountType === "creator" && c !== null,
    /** Subscription unlocks uploading and creator tools. */
    canUpload: !!c?.subscriptionPaid,
    /** Manual KYC approval unlocks receiving earnings. */
    canEarn: c?.kyc === "approved",
    /** The common in-between state: paid, publishing, waiting on verification. */
    awaitingKyc: !!c?.subscriptionPaid && c?.kyc !== "approved",
    kycStatus: c?.kyc ?? ("not_started" as KycStatus),
    tier: c?.tier ?? null,
    dmEnabled: !!c?.dmEnabled,
    dmPrice: c?.dmPrice ?? 0,
    slotsUsed: c?.slotsUsed ?? 0,
    slotsTotal: c?.slotsTotal ?? 0,
    slotsRemaining: Math.max(0, (c?.slotsTotal ?? 0) - (c?.slotsUsed ?? 0)),
  };
}
