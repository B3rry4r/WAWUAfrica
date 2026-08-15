import type { VerificationLevel } from "./account";

/**
 * Content model, mirroring docs/02_TECHNICAL_CONTEXT.md §2.1.
 * `fullAssetUrl` is server-side gated and must NEVER reach the client for
 * locked content — see the API layer in src/lib/api/content.ts.
 */
export type ContentType = "video" | "course" | "audio" | "pdf" | "image" | "template";

export type DeliveryMode = "stream" | "download";

export type AccessType = "free" | "paid";

export type ContentState = "free" | "locked" | "unlocked";

export interface CreatorProfile {
  wawuId: string;
  fullName: string;
  handle: string;
  headline?: string;
  location?: string;
  verificationLevel: VerificationLevel;
  isPro?: boolean;
}

export interface ContentPiece {
  id: string;
  slug: string;
  contentType: ContentType;
  title: string;
  description: string;
  category: string;
  accessType: AccessType;
  price: number;
  creator: CreatorProfile;
  durationLabel?: string;
  pageCount?: number;
  lessonCount?: number;
  views: number;
  ratingPct?: number;
  commentCount: number;
  likes: number;
  saved: boolean;
  createdAt: string;
  /** Always safe to serve — truncated PDF, 30–60s clip, episode-gated preview. */
  previewAssetUrl: string;
  /**
   * Gated. Present ONLY when the requester is entitled to the full asset
   * (free piece or completed purchase). Never present for locked content —
   * enforce in the API layer, not just in components.
   */
  fullAssetUrl?: string;
  /** Derived — tells the client to render lock/unlock UI without a real URL. */
  fullAssetLocked: boolean;
  courseLessons?: CourseLesson[];
  /** Whether the current user has a completed purchase for this piece. */
  purchased?: boolean;
}

export interface CourseLesson {
  id: string;
  index: number;
  title: string;
  durationLabel: string;
  free: boolean;
}

export interface ContentFilterOption {
  id: string;
  label: string;
}

export interface ContentFeedResponse {
  items: ContentPiece[];
}

export interface ContentDetailResponse {
  content: ContentPiece;
}

/**
 * Server response to POST /api/hub/content/:id/unlock.
 * `fullAssetUrl` is a short-lived signed URL — treat as ephemeral, never cache.
 */
export interface UnlockInitiateResponse {
  flutterwaveConfig: FlutterwaveConfig;
}

export interface UnlockVerifyResponse {
  data: { purchased: true; fullAssetUrl: string } | { purchased: false };
}

export interface FlutterwaveConfig {
  publicKey: string;
  txRef: string;
  amount: number;
  currency: "NGN";
  customerEmail: string;
  customerName?: string;
}