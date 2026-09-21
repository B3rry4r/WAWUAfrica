/** Creator is an account type, not an earned trust tier. */
export type AccountType = "user" | "creator";

/**
 * A backend field, not a product surface.
 *
 * Subscriptions were removed: nothing here is for sale, no screen renders a
 * plan name or a tier badge, no allowance is derived from it, and the revenue
 * split no longer keys off it either — `creatorSplitRate()` takes no argument
 * and returns a flat 85/15 for everyone (build brief B1). WAWU Credits are
 * 90/10 for every creator and always were tier-independent, so they are not
 * the exception this once described.
 *
 * It survives only because the API still returns the field. `pro_max` matches
 * the Prisma enum value exactly — the wire carries the enum, and prettifying
 * it here would mean mapping in both directions forever.
 */
export type CreatorTier = "basic" | "pro" | "pro_max";

/** Manual review. Unlocks receiving earnings. The only creator gate. */
export type KycStatus = "not_started" | "pending" | "approved" | "rejected";

/** Profile credibility ladder. Separate from creator KYC. */
export type VerificationLevel =
  | "basic"
  | "verified_user"
  | "verified_business"
  | "certified_professional"
  | "trusted_partner";
