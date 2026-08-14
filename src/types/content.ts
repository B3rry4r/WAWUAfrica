export type ContentType = "video" | "course" | "audio" | "pdf" | "image" | "template";
export type DeliveryMode = "stream" | "download";
export type AccessType = "free" | "paid";

export const DELIVERY_MODE: Record<ContentType, DeliveryMode> = {
  video: "stream",
  course: "stream",
  audio: "download",
  pdf: "download",
  image: "download",
  template: "download",
};

export interface CreatorSummary {
  wawuId: string;
  name: string;
  avatarUrl: string | null;
  verified: boolean;
  tier: "basic" | "pro" | null;
}

export interface ContentItem {
  id: string;
  contentType: ContentType;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  creator: CreatorSummary;
  accessType: AccessType;
  /** Integer Naira. 0 when free. */
  price: number;
  /** Always safe to serve to anyone. */
  previewAssetUrl: string | null;
  /**
   * Only present when the content is free or the viewer has purchased it.
   * The server decides this — never infer access on the client.
   */
  fullAssetUrl: string | null;
  /** True when paid and not yet purchased by the viewer. */
  fullAssetLocked: boolean;
  createdAt: string;
}

export interface Purchase {
  id: string;
  contentId: string;
  type: "content" | "tip";
  amount: number;
  status: "pending" | "completed" | "failed";
  purchasedAt: string;
}
