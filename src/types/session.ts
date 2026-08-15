import type { AccountType, CreatorTier, KycStatus, VerificationLevel } from "./account";

/** The signed-in user, as the client may render it. No secrets, no full-asset URLs. */
export interface SessionUser {
  wawuId: string;
  name: string;
  handle?: string;
  email?: string;
  avatarUrl?: string;
  accountType: AccountType;
  verification: VerificationLevel;
  /** Present only for creator accounts. */
  creatorTier?: CreatorTier | null;
  /** Manual review gate — independent of subscription. */
  kycStatus?: KycStatus;
  /** Credits are a count, never a naira value. */
  credits?: number;
}

export type SessionStatus = "loading" | "authenticated" | "anonymous";