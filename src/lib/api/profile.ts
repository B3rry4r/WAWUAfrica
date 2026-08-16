import type { CreatorProfile } from "@/types/profile";
import { apiFetch } from "./client";
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
  websiteUrl: string | null;
  tier: "basic" | "pro";
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
 *  - `dmEnabled` / `dmPrice`: no DM-pricing column/endpoint exists yet.
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
    dmEnabled: false,
    dmPrice: 0,
    categories: real.interests,
    socials: {
      instagram: real.instagramHandle ?? undefined,
      website: real.websiteUrl ?? undefined,
    },
    content: [],
    communities: [],
    products: [],
  };
}

/**
 * GAP: the real FollowRelationship contract (follow-relationship.controller.ts)
 * only exposes POST/DELETE /creators/:wawuId/follow — there is no GET to
 * check whether the current user already follows a given creator. Until one
 * exists, this stays local/mock-only. It's kept in sync by
 * toggleFollowProfile's real writes (see setMockProfileFollowing).
 */
export async function isFollowing(wawuId: string): Promise<boolean> {
  return getMockProfileFollowing(wawuId);
}

/**
 * POST/DELETE /api/hub/creators/:wawuId/follow are real
 * (follow-relationship.controller.ts, WawuAuthGuard-protected, `roles: any`).
 * Direction is decided from local mock state since there's no real "am I
 * following" read to consult (see isFollowing's gap note) — the write
 * itself hits the real backend whenever one is configured.
 */
export async function toggleFollowProfile(wawuId: string): Promise<boolean> {
  const currentlyFollowing = await getMockProfileFollowing(wawuId);
  await apiFetch(`/api/hub/creators/${wawuId}/follow`, {
    method: currentlyFollowing ? "DELETE" : "POST",
    authed: true,
  });
  const next = !currentlyFollowing;
  setMockProfileFollowing(wawuId, next);
  return next;
}

/**
 * GAP: the real Community contract (community.controller.ts) has no "am I a
 * member" read either — GET /communities and GET /communities/:id return
 * community data, never the caller's own membership status. Mock-only,
 * kept in sync by toggleCommunityJoin's real join writes.
 */
export async function isCommunityJoined(wawuId: string, communityId: string): Promise<boolean> {
  return isMockCommunityJoined(wawuId, communityId);
}

/** Real POST /communities/:id/join response (community.service.ts `join`). */
interface RealCommunityMembership {
  status: "joined" | "pending";
}

/**
 * POST /api/hub/communities/:id/join is real (community.controller.ts,
 * WawuAuthGuard-protected) and idempotent — safe to call even if already
 * joined/pending. GAP: there is no leave/unjoin endpoint anywhere in the
 * real Community contract (no DELETE on this controller, confirmed by
 * reading it) — leaving a community has no backend support yet, so that
 * direction stays mock-only until one exists. A private community's
 * `status: "pending"` response is treated as "not joined" (accurate — the
 * membership request hasn't been approved).
 */
export async function toggleCommunityJoin(wawuId: string, communityId: string): Promise<boolean> {
  if (isMockCommunityJoined(wawuId, communityId)) {
    // SEAM: replace with DELETE /api/hub/communities/:id/join once it exists
    return toggleMockCommunityJoin(wawuId, communityId);
  }
  const membership = await apiFetch<RealCommunityMembership>(`/api/hub/communities/${communityId}/join`, {
    method: "POST",
    authed: true,
  });
  const joined = membership.status === "joined";
  setMockCommunityJoined(wawuId, communityId, joined);
  return joined;
}
