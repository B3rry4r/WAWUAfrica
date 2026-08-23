import type { AccountType, CreatorTier, KycStatus } from "@/types/account";

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
  dmResponseHours?: number;
}

/**
 * Accepts the authenticated SessionUser, the mock Session, or a plain
 * `{ creator }` bag — all three carry the same creator shape.
 *
 * `accountType` is tolerated so existing call sites keep compiling, but it is
 * DELIBERATELY never read. See isCreator below.
 */
type GateSource = { accountType?: AccountType | null; creator: CreatorLike | null } | null;

export function creatorGates(source: GateSource) {
  const c = source?.creator ?? null;
  return {
    /**
     * Creator state exists ⇒ this IS a creator account. Full stop.
     *
     * This used to read `source?.accountType === "creator" && c !== null`.
     * DO NOT PUT THAT BACK. `accountType` is written into localStorage once,
     * at sign-in, and never revisited: somebody who subscribed afterwards — or
     * on another device — carried a session that said "user" forever. Their
     * live CreatorState loaded fine, `c` was non-null, and this gate STILL
     * said "not a creator", so the app kept offering "Become a creator" to
     * people who had already paid for it.
     *
     * The server's CreatorState row is the authority on whether an account is
     * a creator; the session's accountType is a stale cache of a guess made at
     * sign-in. Feed this the LIVE creator state (useCreatorState) wherever a
     * screen forks on creator-vs-user.
     */
    isCreator: c !== null,
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
    // 24 is the server's own default for a row that predates the setting —
    // matched here so the UI never shows a window the backend would not use.
    dmResponseHours: c?.dmResponseHours ?? 24,
    slotsUsed: c?.slotsUsed ?? 0,
    slotsTotal: c?.slotsTotal ?? 0,
    slotsRemaining: Math.max(0, (c?.slotsTotal ?? 0) - (c?.slotsUsed ?? 0)),
  };
}
