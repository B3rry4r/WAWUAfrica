/** Creator is an account type, not an earned trust tier. */
export type AccountType = "user" | "creator";

/** Paid yearly. Unlocks uploading and creator tools. */
export type CreatorTier = "basic" | "pro";

/** Manual review. Unlocks receiving earnings — independent of subscription. */
export type KycStatus = "not_started" | "pending" | "approved" | "rejected";

/** Profile credibility ladder. Separate from creator KYC and from paid tier. */
export type VerificationLevel =
  | "basic"
  | "verified_user"
  | "verified_business"
  | "certified_professional"
  | "trusted_partner";
