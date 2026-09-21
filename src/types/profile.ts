import type { CreatorTier } from "./account";
import type { VerificationState } from "./verification";

/**
 * No "shop" tab. Buying happened in WAWUBasket and WAWUBeauty, which are no
 * longer surfaced anywhere in this app, so a tab whose only content was
 * links into them has nothing left to show.
 */
export type ProfileTab = "overview" | "content" | "services" | "events";

/**
 * The tab bar is DERIVED, not fixed.
 *
 * C2 lists Overview, Content, Products, Events, Services. Two of those do not
 * survive contact with what an account can actually be (product owner,
 * 21 Sep 2026: "a user don't offer products... services are professional
 * accounts"):
 *
 *  - PRODUCTS is gone. A person does not sell products on WAWU. The backend
 *    `Product` model has no owner at all - no sellerId, no creator relation -
 *    because it is WAWU's own curated shop catalogue (`wawuVerified`,
 *    `wawuPick`, both admin-set), and there is no creator product upload
 *    anywhere in the app. The tab could only ever have listed somebody
 *    else's stock.
 *  - SERVICES belongs to PROFESSIONAL accounts. A creator who has never
 *    applied to be listed has no services, and a tab that is permanently
 *    empty is a dead end, not a feature.
 *
 * So the bar shows Overview plus whatever this account actually has:
 * Content for a creator who has published, Services for an approved
 * professional, Events for a host. A buyer's profile is Overview alone, and
 * that is correct rather than broken.
 */
export const PROFILE_TAB_LABEL: Record<ProfileTab, string> = {
  overview: "Overview",
  content: "Content",
  services: "Services",
  events: "Events",
};

/** Which tabs this profile has anything to put in. Overview is always first. */
export function profileTabsFor(has: {
  content: boolean;
  services: boolean;
  events: boolean;
}): ProfileTab[] {
  const out: ProfileTab[] = ["overview"];
  if (has.content) out.push("content");
  if (has.services) out.push("services");
  if (has.events) out.push("events");
  return out;
}

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
/**
 * One role on somebody's profile.
 *
 * `startedOn` and `endedOn` are MONTHS ("2023-03"), never full dates: the
 * backend's column is a real date pinned to the first of the month, and the
 * wire format is deliberately narrower so no client has to decide what a day
 * component was supposed to mean.
 *
 * `current` is served, not re-derived here. It is `endedOn === null` on the
 * server, and a second implementation in the client is a second thing that
 * can disagree.
 */
export interface ProfileExperience {
  id: string;
  title: string;
  company: string;
  location: string | null;
  /** "YYYY-MM". */
  startedOn: string;
  /** "YYYY-MM", or null when this is the role they hold now. */
  endedOn: string | null;
  current: boolean;
  description: string | null;
}

export interface ProfileView {
  wawuId: string;
  name: string;
  handle: string;
  bio: string;
  verification: VerificationState;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  /** "Chief Steward, WAWU" in the reference. The creator's own headline. */
  roleLine?: string;
  location?: string;
  memberSince?: string;
  /** Their own site. The store link sits beside it, never instead of it. */
  website?: string;
  /** The organisation they are part of, beside the location in the header. */
  company?: string;
  /**
   * Their roles, newest first with the current one at the top. Ordered by the
   * server; a client that re-sorts will eventually sort differently from the
   * next client.
   */
  experience: ProfileExperience[];
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
  /** The two paid ticks. Not creator KYC, which is the earning gate. */
  verification: VerificationState;
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
  company?: string;
  experience: ProfileExperience[];
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