import type { CreatorTier, VerificationLevel } from "./account";

/**
 * No "shop" tab. Buying happened in WAWUBasket and WAWUBeauty, which are no
 * longer surfaced anywhere in this app, so a tab whose only content was
 * links into them has nothing left to show.
 */
export type ProfileTab = "overview" | "content" | "products" | "events" | "services";

/** The tab bar, in the order build brief C2 sets. */
export const PROFILE_TABS: { id: ProfileTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "content", label: "Content" },
  { id: "products", label: "Products" },
  { id: "events", label: "Events" },
  { id: "services", label: "Services" },
];

/**
 * ONE profile, whoever is looking at it.
 *
 * Build brief C2: "Owner vs visitor: the same page. The only difference is
 * that the owner sees an Edit control. Do not build two templates - a forked
 * profile screen will drift, and verification-harness's `forks` gate will
 * fail it."
 *
 * There WERE two templates. /profile was a settings menu (a column of
 * ListRows: dashboard, earnings, wallet, KYC, purchases, saved, settings)
 * with a small identity block on top, and /profile/[wawuId] was the
 * storefront. The owner could not see their own profile as anybody else saw
 * it, which is the one view that matters when it is a shop window.
 *
 * So both routes normalise into this and render the same screen. The fields
 * are the union of what the two reads can supply; anything one of them
 * cannot answer is optional and is left out rather than defaulted, because a
 * zero on a profile is a claim ("0 followers") and an absent number is not.
 */
export interface ProfileView {
  wawuId: string;
  name: string;
  handle: string;
  bio: string;
  verification: VerificationLevel;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  /** "Chief Steward, WAWU" in the reference. The creator's own headline. */
  roleLine?: string;
  location?: string;
  memberSince?: string;
  /** Their own site. When absent, the store link takes this slot (C2). */
  website?: string;
  /** C1 specialization ids, or the older free-text interests. */
  specializations: string[];
  socials: CreatorProfile["socials"];
  stats: {
    pieces?: number;
    piecesLabel?: string;
    followers?: string;
    evg?: number;
  };
  /** Paid messaging, for a visitor. Absent on the owner's own view. */
  dm?: { enabled: boolean; price: number; responseHours: number };
  content: ProfileContentItem[];
  communities: CreatorCommunity[];
}

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
  /** The cover to draw on the tile. Without one it falls back to hatching. */
  previewAssetUrl?: string | null;
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
  /** The room's picture. Null/absent keeps the striped placeholder tile. */
  imageUrl?: string | null;
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
  /**
   * Hours this creator has to reply before the buyer is refunded. A term of
   * the sale, not a platform constant — it is no longer a fixed 24, so the
   * buyer has to be shown the one they are actually paying against.
   */
  dmResponseHours: number;
  /**
   * Profile picture and the wide header image. Both optional: an account with
   * neither falls back to the generated initial and a plain header, which is
   * what every account did before there was any way to upload one.
   */
  avatarUrl?: string | null;
  coverUrl?: string | null;
  location?: string;
  memberSince?: string;
  replyTime?: string;
  categories: string[];
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
  content: ProfileContentItem[];
  communities: CreatorCommunity[];
  products: StoreProduct[];
}