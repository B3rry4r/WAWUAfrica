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
  /**
   * The caller's own badge application for THIS rung, when one exists —
   * GET /api/hub/verification/ladder returns it per entry. Present means
   * "you have applied": the row must say so instead of offering an
   * unqualified "Start", which is what made a pending application look like
   * nothing had happened. Undefined means no application has been made.
   *
   * Badge applications only. This has nothing to do with creator KYC — that
   * is a separate system with its own table and endpoint (src/lib/api/kyc.ts),
   * surfaced through creatorGates().kycStatus.
   */
  submission?: VerificationSubmission;
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