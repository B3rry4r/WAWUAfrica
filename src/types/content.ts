import type { VerificationState } from "./verification";

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
  avatarUrl?: string | null;
  headline?: string;
  location?: string;
  verification: VerificationState;
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

/**
 * Real shape of POST /content/:id/unlock/verify's success response (flat —
 * apiFetch already unwraps the Hub's `{statusCode,message,data}` envelope,
 * so there is no second `data` layer on top of this). The service either
 * returns this or throws (400/404) — it never returns `{purchased:false}`.
 */
export interface UnlockVerifyResponse {
  purchased: true;
  fullAssetUrl: string | null;
}

export interface FlutterwaveConfig {
  publicKey: string;
  txRef: string;
  amount: number;
  currency: "NGN";
  /** Not returned by the real backend's unlock/tip-init responses — optional for that reason. Nothing in the UI reads it today. */
  customerEmail?: string;
  customerName?: string;
}

/* ---------------------------------------------------------------------------
 * Creator-side content model (upload library, publishing wizard).
 * Consumer-side reading model is ContentPiece above. Both are in use:
 * ContentPiece is what a buyer sees, ContentItem is what a creator manages.
 * ------------------------------------------------------------------------- */

export const CONTENT_TYPES: ContentType[] = [
  "video",
  "course",
  "audio",
  "pdf",
  "image",
  "template",
];

export interface ContentTypeMeta {
  label: string;
  group: "stream" | "download";
  blurb: string;
}

export const CONTENT_TYPE_META: Record<ContentType, ContentTypeMeta> = {
  video: { label: "Video", group: "stream", blurb: "One lesson or a talk" },
  course: { label: "Course", group: "stream", blurb: "Several lessons in order" },
  audio: { label: "Audio", group: "download", blurb: "Music, stems, podcast" },
  pdf: { label: "PDF or book", group: "download", blurb: "Guides, workbooks" },
  image: { label: "Image or art", group: "download", blurb: "Prints, design pieces" },
  template: { label: "Template", group: "download", blurb: "Invoices, sheets, forms" },
};

/**
 * The types a creator can pick when publishing.
 *
 * `template` is deliberately absent: you asked for the templates feature to be
 * hidden. This does NOT remove the type — docs/01_SPEC.md:105 locks six
 * content types including Template, and CLAUDE.md says the spec wins over an
 * instruction that contradicts it, so the type stays in the union, existing
 * template pieces keep rendering, and the DB shape is untouched. Only the
 * publish picker stops offering it. Delete `template` from the filter below to
 * put it back.
 *
 * FLAG: this is a real divergence from the locked spec. It needs to be written
 * into docs/01_SPEC.md, or reversed.
 */
export const PUBLISHABLE_CONTENT_TYPES: ContentType[] = (
  Object.keys(CONTENT_TYPE_META) as ContentType[]
).filter((t) => t !== "template");

export type ContentStatus = "live" | "review" | "rejected";

export interface ContentItem {
  id: string;
  type: ContentType;
  title: string;
  /** File description shown under the title, e.g. "PDF · 34 pages · ₦1,500". */
  meta: string;
  /** Naira price; 0 means free. */
  price: number;
  status: ContentStatus;
  /** Lifetime earnings (paid content only). */
  earned?: number;
  /** Sales/views count. */
  activity?: string;
  /** True for the first, free upload. */
  isFirstUpload?: boolean;
  /** Rejection reason shown to the creator. */
  rejectionReason?: string;
  /**
   * GAP: required by the real POST /content contract (CreateContentDto:
   * description, category, previewAsset, fullAsset) but nothing in
   * PublishingWizard.tsx collects them today — it only gathers
   * type/title/price. Optional here so publish() can pass them through the
   * day an upload step actually supplies them; until then, real publish
   * calls 400 on validation and fall back to the local mock library (see
   * src/lib/api/creator-content.ts).
   */
  description?: string;
  category?: string;
  /**
   * C1 taxonomy specialization ids, e.g. `photography.portrait-photographer`.
   * Capped at three by the picker and by CreateContentDto server-side, so a
   * client that ignores the cap still gets rejected. `category` above is the
   * deprecated flat list these replace, and both go on the wire: rows
   * published before the specializations column existed carry only a
   * category, so the backend still requires one.
   */
  specializations?: string[];
  previewAssetUrl?: string;
  fullAssetUrl?: string;
}
