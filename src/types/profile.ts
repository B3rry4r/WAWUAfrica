import type { CreatorTier, VerificationLevel } from "./account";

export type ProfileTab = "content" | "community" | "shop" | "about";

export interface ProfileStats {
  followers: string;
  piecesLabel: string;
  pieces: number;
  evg: number;
}

/** A single content row on the Content tab. */
export interface ProfileContentItem {
  id: string;
  title: string;
  /** e.g. "Course · 6 lessons", "Video · 12 min". */
  kindLabel: string;
  /** Integer Naira; 0 = free. */
  price: number;
  locked: boolean;
  /** Own-view moderation state. */
  status?: "pending" | "approved";
  /** Own-view meta, e.g. "34 sold", "1,204 views". */
  ownerMeta?: string;
}

export interface CreatorCommunity {
  id: string;
  name: string;
  memberCount: number;
  kind: "open" | "private";
  joined: boolean;
}

export interface StoreProduct {
  id: string;
  name: string;
  /** Integer Naira. */
  price: number;
  platform: "basket" | "beauty";
}

export interface CreatorProfile {
  wawuId: string;
  name: string;
  handle: string;
  bio: string;
  /** WAWU ID verification ladder — not creator KYC, not the paid tier. */
  verification: VerificationLevel;
  plan: CreatorTier;
  stats: ProfileStats;
  dmEnabled: boolean;
  /** Integer Naira. Only shown when dmEnabled. */
  dmPrice: number;
  location?: string;
  memberSince?: string;
  replyTime?: string;
  categories: string[];
  socials: { instagram?: string; website?: string };
  content: ProfileContentItem[];
  communities: CreatorCommunity[];
  products: StoreProduct[];
}