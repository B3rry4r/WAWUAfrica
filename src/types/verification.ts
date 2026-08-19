import type { AccountType, CreatorTier, VerificationLevel } from "./account";

/** Display labels for each rung of the verification ladder. */
export const VERIFY_TIER_LABELS: Record<VerificationLevel, string> = {
  basic: "Basic",
  verified_user: "Verified user",
  verified_business: "Verified business",
  certified_professional: "Certified professional",
  trusted_partner: "Trusted partner",
};

/** A level's state on the ladder. */
export type VerificationLadderStatus = "done" | "yours" | "next" | "locked";

export interface VerificationLevelEntry {
  tier: VerificationLevel;
  status: VerificationLadderStatus;
  copy: string;
}

/** Lifecycle of one level submission (frame 6). */
export type VerificationSubmissionStatus = "in_review" | "approved" | "rejected";

export interface VerificationSubmission {
  tier: VerificationLevel;
  status: VerificationSubmissionStatus;
  submittedAt?: string;
  reviewedAt?: string;
  reason?: string;
}

export interface OwnProfileStats {
  published: number;
  /**
   * No real endpoint returns a lifetime sales count (GET /api/hub/content/mine/earnings
   * only exposes naira totals + a capped recent-sales feed, never a count).
   * Undefined means "not available", not "zero" — render only when present.
   */
  sales?: number;
  /**
   * No real endpoint returns a follower count for the caller's own profile
   * (that field lives on the separate public-creator-profile aggregate, keyed
   * by another user's wawuId, not "me"). Undefined means "not available".
   */
  followers?: string;
}

/** The signed-in user's own profile, read from session + profile records. */
export interface OwnProfile {
  wawuId: string;
  name: string;
  handle: string;
  email: string;
  bio: string;
  accountType: AccountType;
  verification: VerificationLevel;
  plan: CreatorTier;
  stats: OwnProfileStats;
  interests: string[];
  /**
   * Where a creator can be reached. Handles are stored bare (no "@"); the
   * link fields take a full URL.
   */
  socials: {
    instagram?: string;
    whatsapp?: string;
    x?: string;
    tiktok?: string;
    youtube?: string;
    facebook?: string;
    linkedin?: string;
    website?: string;
  };
  /** User only — count, never a naira value. */
  credits: number;
  /** Creator only. */
  earningsThisMonth?: number;
  toReply?: number;
  contentSlots?: { published: number; total: number };
}

export interface OwnProfileDraft {
  name: string;
  handle: string;
  bio: string;
  interests: string[];
  /**
   * Where a creator can be reached. Handles are stored bare (no "@"); the
   * link fields take a full URL.
   */
  socials: {
    instagram?: string;
    whatsapp?: string;
    x?: string;
    tiktok?: string;
    youtube?: string;
    facebook?: string;
    linkedin?: string;
    website?: string;
  };
}