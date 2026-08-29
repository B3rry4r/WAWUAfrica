/** Creator is an account type, not an earned trust tier. */
export type AccountType = "user" | "creator";

/** Paid yearly. Unlocks uploading and creator tools. */
/**
 * Three plans. `pro_max` matches the Prisma enum value exactly — the wire
 * carries the enum, and prettifying it here would mean mapping in both
 * directions forever.
 */
export type CreatorTier = "basic" | "pro" | "pro_max";

/** Manual review. Unlocks receiving earnings — independent of subscription. */
export type KycStatus = "not_started" | "pending" | "approved" | "rejected";

/** Profile credibility ladder. Separate from creator KYC and from paid tier. */
export type VerificationLevel =
  | "basic"
  | "verified_user"
  | "verified_business"
  | "certified_professional"
  | "trusted_partner";
