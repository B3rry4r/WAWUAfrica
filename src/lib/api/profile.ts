import type { CreatorProfile } from "@/types/profile";
import { apiFetch, isMockModeError } from "./client";
import {
  getMockProfileFollowing,
  isMockCommunityJoined,
  setMockCommunityJoined,
  setMockProfileFollowing,
  toggleMockCommunityJoin,
} from "./mocks/profile";

/**
 * Real GET /users/:wawuId/public-profile response shape
 * (user-profile.service.ts `getPublicProfile`) — a lean derived aggregate,
 * NOT the rich profile-page shape below. See getCreatorProfile's doc
 * comment for every field this backend does not (yet) provide.
 */
interface RealPublicCreatorProfile {
  wawuUserId: string;
  handle: string | null;
  bio: string | null;
  interests: string[];
  instagramHandle: string | null;
  whatsappHandle: string | null;
  xHandle: string | null;
  tiktokHandle: string | null;
  youtubeUrl: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  tier: "basic" | "pro";
  dmEnabled: boolean;
  dmPrice: number | null;
  evgScore: number;
  contentCount: number;
  followerCount: number;
  communityCount: number;
}

/** Matches the mock data's "2.4k" follower-count style. */
function formatFollowerCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return String(n);
}

/**
 * GET /api/hub/users/:wawuId/public-profile (user-profile.controller.ts,
 * WawuAuthGuard-protected). The real response is a lean aggregate — bio,
 * handle, socials, tier, and four COUNTS (content/follower/community). It is
 * NOT the rich profile-page shape CreatorProfile needs. Genuine, precise
 * backend gaps, mapped to safe/empty defaults rather than fabricated data:
 *
 *  - `name`: no display-name field exists on this endpoint at all — only
 *    `handle`. WAWU ID's firstName/lastName is only readable for the
 *    CALLER's own session (via /me claims), never for another user being
 *    viewed. Falls back to `handle` (or the raw wawuId if even that is unset).
 *  - `verification`: the WAWU ID verification ladder for another user isn't
 *    exposed by this or any other endpoint. Defaults to "basic".
 *  - `dmEnabled` / `dmPrice`: now REAL. These used to be hardcoded
 *    `false`/`0` because the public-profile aggregate did not select them and
 *    no other endpoint exposed another user's DM settings — so every creator
 *    who had genuinely priced their messages read as "Messages off" to every
 *    buyer, which made paid messaging unusable from the only side that pays
 *    for it. The backend now returns both. "Enabled with no price set" is
 *    still treated as CLOSED, never as a free message.
 *  - `location` / `memberSince` / `replyTime`: no such columns exist; left
 *    undefined (all three are optional on CreatorProfile).
 *  - `content` / `communities`: the endpoint returns COUNTS only
 *    (contentCount / communityCount) — never the actual item lists. Listing
 *    "this creator's content" / "this creator's communities" is Content/
 *    Community module work (a creator-scoped list filter neither module
 *    exposes today), out of this file's scope. Left as empty arrays.
 *  - `products`: correctly empty, not a gap — WAWUBasket/WAWUBeauty are
 *    external apps (CLAUDE.md); Hub API never carries their product data.
 */
export async function getCreatorProfile(wawuId: string): Promise<CreatorProfile> {
  const real = await apiFetch<RealPublicCreatorProfile>(`/api/hub/users/${wawuId}/public-profile`, {
    authed: true,
  });
  return {
    wawuId: real.wawuUserId,
    name: real.handle ?? real.wawuUserId,
    handle: real.handle ?? real.wawuUserId,
    bio: real.bio ?? "",
    verification: "basic",
    plan: real.tier,
    stats: {
      followers: formatFollowerCount(real.followerCount),
      piecesLabel: "Pieces",
      pieces: real.contentCount,
      evg: real.evgScore,
    },
    // A creator who switched messages on but never set a price is not open
    // for business — and must never be rendered as free.
    dmEnabled: real.dmEnabled && (real.dmPrice ?? 0) > 0,
    dmPrice: real.dmPrice ?? 0,
    categories: real.interests,
    socials: {
      instagram: real.instagramHandle ?? undefined,
      whatsapp: real.whatsappHandle ?? undefined,
      x: real.xHandle ?? undefined,
      tiktok: real.tiktokHandle ?? undefined,
      youtube: real.youtubeUrl ?? undefined,
      facebook: real.facebookUrl ?? undefined,
      linkedin: real.linkedinUrl ?? undefined,
      website: real.websiteUrl ?? undefined,
    },
    content: [],
    communities: [],
    products: [],
  };
}

/**
 * GET /api/hub/creators/:wawuId/follow — the caller's real follow state.
 * This used to read local mock state only, so the follow button was wrong on
 * any new device or after clearing storage.
 */
export async function isFollowing(wawuId: string): Promise<boolean> {
  try {
    const res = await apiFetch<{ following: boolean }>(`/api/hub/creators/${wawuId}/follow`, { authed: true });
    setMockProfileFollowing(wawuId, res.following);
    return res.following;
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with GET /api/hub/creators/:wawuId/follow
    return getMockProfileFollowing(wawuId);
  }
}

/**
 * POST/DELETE /api/hub/creators/:wawuId/follow are real
 * (follow-relationship.controller.ts, WawuAuthGuard-protected, `roles: any`).
 * Direction comes from the real follow-status read above.
 */
export async function toggleFollowProfile(wawuId: string): Promise<boolean> {
  const currentlyFollowing = await isFollowing(wawuId);
  await apiFetch(`/api/hub/creators/${wawuId}/follow`, {
    method: currentlyFollowing ? "DELETE" : "POST",
    authed: true,
  });
  const next = !currentlyFollowing;
  setMockProfileFollowing(wawuId, next);
  return next;
}

/**
 * GET /api/hub/communities/:id/membership — the caller's real membership.
 * A `pending` request on a private community is deliberately NOT "joined":
 * it has not been approved yet.
 */
export async function isCommunityJoined(wawuId: string, communityId: string): Promise<boolean> {
  try {
    const membership = await apiFetch<{ status: "joined" | "pending" } | null>(
      `/api/hub/communities/${communityId}/membership`,
      { authed: true },
    );
    return membership?.status === "joined";
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with GET /api/hub/communities/:id/membership
    return isMockCommunityJoined(wawuId, communityId);
  }
}

/** Real POST /communities/:id/join response (community.service.ts `join`). */
interface RealCommunityMembership {
  status: "joined" | "pending";
}

/**
 * POST /api/hub/communities/:id/join is real and idempotent — safe to call
 * even if already joined/pending. DELETE /communities/:id/join leaves, and is
 * likewise idempotent. A private community's
 * `status: "pending"` response is treated as "not joined" (accurate — the
 * membership request hasn't been approved).
 */
export async function toggleCommunityJoin(wawuId: string, communityId: string): Promise<boolean> {
  const currentlyJoined = await isCommunityJoined(wawuId, communityId);
  try {
    if (currentlyJoined) {
      // Leaving is real now (DELETE /communities/:id/join) — it used to be
      // mock-only, so leaving a community never actually left it.
      await apiFetch(`/api/hub/communities/${communityId}/join`, { method: "DELETE", authed: true });
      setMockCommunityJoined(wawuId, communityId, false);
      return false;
    }
    const membership = await apiFetch<RealCommunityMembership>(`/api/hub/communities/${communityId}/join`, {
      method: "POST",
      authed: true,
    });
    const joined = membership.status === "joined";
    setMockCommunityJoined(wawuId, communityId, joined);
    return joined;
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with POST/DELETE /api/hub/communities/:id/join
    return toggleMockCommunityJoin(wawuId, communityId);
  }
}

/**
 * GET /api/hub/creators/:wawuId/evg — the creator's real EVG score.
 * The dashboards and the home rail all rendered a hardcoded "1,240" while
 * this endpoint sat unused.
 */
export async function getEvgScore(wawuId: string): Promise<number | null> {
  try {
    const res = await apiFetch<{ creatorWawuId: string; score: number }>(
      `/api/hub/creators/${wawuId}/evg`,
      { authed: true },
    );
    return res.score;
  } catch (e) {
    if (!isMockModeError(e)) return null;
    // SEAM: replace with GET /api/hub/creators/:wawuId/evg
    return null;
  }
}
