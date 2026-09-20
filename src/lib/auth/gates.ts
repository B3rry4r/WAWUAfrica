import type { AccountType, CreatorTier, KycStatus } from "@/types/account";

/**
 * Hard cap on how many items (products, content or services) one account may
 * list. Flat for every creator: there are no tiers and no paid allowances any
 * more, so nothing about this number is derived from what somebody paid.
 *
 * The server enforces it. This is the same number so the UI can count down
 * honestly instead of letting somebody fill a wizard and be refused at the
 * end.
 */
export const MAX_ITEMS_PER_ACCOUNT = 5;

// REMOVED: NO_CHARGE_UPLOAD_ALLOWANCE.
//
// This was `PLANS[tier].freeSlots` (1 on Basic, 2 on Pro), and carrying the
// standard-tier figure forward looked like the conservative choice. It was the
// wrong one: brief B2 does not leave the number unspecified, it removes the
// concept. "No free content. Every listing carries a price. The platform is
// strictly for sales and consultation. Do not build or retain any free-upload
// path." An allowance of 1 is a retained free-upload path.
//
// So there is no ₦0 allowance and no first-upload-is-free rule. Every listing
// is priced, and the only cap is MAX_ITEMS_PER_ACCOUNT above.

/**
 * Single source of truth for the creator gates.
 *
 * There is ONE gate now: `kyc === "approved"` unlocks receiving earnings.
 * Uploading is NOT gated. Registration, profile creation and listing are
 * free, so a creator account can publish from the moment it exists; revenue
 * comes from discrete paid actions (verification, featuring, advertising,
 * community chat tokens) rather than a subscription.
 *
 * `isCreator && kyc !== "approved"` (awaitingKyc) is a normal state, not an
 * edge case — most new creators live there for their first few days. They can
 * upload, publish and sell; they just cannot be paid out yet.
 *
 * Accepts either the authenticated SessionUser or the mock Session, since both
 * carry the same creator shape. Derive gates from here — never re-check
 * `creator.kyc` inline in a component.
 */
interface CreatorLike {
  tier: CreatorTier;
  kyc: KycStatus;
  slotsUsed: number;
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
     * at sign-in, and never revisited: somebody who became a creator
     * afterwards — or on another device — carried a session that said "user"
     * forever. Their live CreatorState loaded fine, `c` was non-null, and this
     * gate STILL said "not a creator", so the app kept offering "Become a
     * creator" to people who already were one.
     *
     * The server's CreatorState row is the authority on whether an account is
     * a creator; the session's accountType is a stale cache of a guess made at
     * sign-in. Feed this the LIVE creator state (useCreatorState) wherever a
     * screen forks on creator-vs-user.
     */
    isCreator: c !== null,
    /**
     * Uploading is open to every creator account. No payment check.
     *
     * This used to be `!!c?.subscriptionPaid`. Subscriptions were removed from
     * the product: listing is free, so the only thing that decides whether
     * somebody can upload is whether they are a creator at all. Kept as a
     * named gate rather than deleted so call sites keep reading one source of
     * truth instead of re-deriving it.
     */
    canUpload: c !== null,
    /** Manual KYC approval unlocks receiving earnings. The one real gate. */
    canEarn: c?.kyc === "approved",
    /** The common in-between state: publishing, waiting on verification. */
    awaitingKyc: c !== null && c.kyc !== "approved",
    kycStatus: c?.kyc ?? ("not_started" as KycStatus),
    tier: c?.tier ?? null,
    dmEnabled: !!c?.dmEnabled,
    dmPrice: c?.dmPrice ?? 0,
    // 24 is the server's own default for a row that predates the setting —
    // matched here so the UI never shows a window the backend would not use.
    dmResponseHours: c?.dmResponseHours ?? 24,
    slotsUsed: c?.slotsUsed ?? 0,
    /** Flat for everyone. Never derived from a plan. */
    slotsTotal: MAX_ITEMS_PER_ACCOUNT,
    slotsRemaining: Math.max(0, MAX_ITEMS_PER_ACCOUNT - (c?.slotsUsed ?? 0)),
  };
}
