import type { CreatorProfile, ProfileContentItem } from "@/types/profile";
import { CONTENT_TYPE_META, type ContentType } from "@/types/content";
import { apiFetch, apiFetchPaginated, isMockModeError } from "./client";
import {
  getMockProfileFollowing,
  isMockCommunityJoined,
  setMockCommunityJoined,
  setMockProfileFollowing,
  toggleMockCommunityJoin,
} from "./mocks/profile";

/**
 * Wire shape of GET /api/hub/users/:wawuId/content (same ContentPieceResponse
 * every other content endpoint returns — status is always "live" here, this
 * endpoint never lists a pending/rejected/removed piece). See getCreatorContent.
 */
interface RealProfileContentRow {
  id: string;
  contentType: ContentType;
  title: string;
  price: number;
  previewAssetUrl: string;
  fullAssetUrl: string | null;
  fullAssetLocked: boolean;
  durationLabel: string | null;
  pageCount: number | null;
}

/**
 * GET /api/hub/users/:wawuId/content — a creator's own published shelf, as
 * seen from their profile page. This backend gap is why the Content tab used
 * to hardcode `content: []` regardless of what a creator had live: the only
 * profile aggregate that existed (`public-profile`) returned a COUNT, never
 * the items.
 *
 * `fullAssetLocked` comes straight from the server's own per-requester gate
 * (free, or the caller purchased it) — never recomputed here. That is the
 * whole of "paid stays locked until paid for": nothing on this screen
 * decides it, it only renders what the backend already decided.
 */
async function getCreatorContent(wawuId: string): Promise<ProfileContentItem[]> {
  try {
    const { data } = await apiFetchPaginated<RealProfileContentRow>(
      `/api/hub/users/${wawuId}/content?perPage=50`,
      { authed: true, cache: "no-store" },
    );
    return data.map((row) => ({
      id: row.id,
      title: row.title,
      kindLabel: [
        CONTENT_TYPE_META[row.contentType]?.label ?? row.contentType,
        row.durationLabel ?? (row.pageCount ? `${row.pageCount} pages` : null),
      ]
        .filter(Boolean)
        .join(" · "),
      price: row.price,
      locked: row.fullAssetLocked,
      previewAssetUrl: row.previewAssetUrl,
    }));
  } catch (e) {
    // A creator's other tabs (About, Community), DM and Follow all work off
    // `public-profile` alone. Degrading to an empty Content tab on a genuine
    // network hiccup here is a smaller failure than losing the whole page —
    // unlike the mock-fallback rule elsewhere in this file, this is not
    // masking a real error as fake success, it is one panel staying empty.
    if (!isMockModeError(e)) {
      // eslint-disable-next-line no-console
      console.error("Failed to load creator content", e);
    }
    return [];
  }
}

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
  avatarUrl: string | null;
  coverUrl: string | null;
  tier: "basic" | "pro" | "pro_max";
  dmEnabled: boolean;
  dmPrice: number | null;
  dmResponseHours?: number;
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
 *  - `content`: now REAL, from GET /users/:wawuId/content
 *    (getCreatorContent) — fetched alongside this call rather than after it,
 *    so opening a profile costs one round trip, not two. Used to be
 *    hardcoded `[]`: `public-profile` returns only `contentCount`, never the
 *    items, so the Content tab read "Nothing published yet" for every
 *    creator regardless of what they had live.
 *  - `communities`: the endpoint returns a COUNT only (communityCount) —
 *    never the actual item list. Listing "this creator's communities" is
 *    Community module work (a creator-scoped list filter that module doesn't
 *    expose today), out of this file's scope. Left as an empty array.
 *  - `products`: correctly empty, not a gap — WAWUBasket/WAWUBeauty are
 *    external apps (CLAUDE.md); Hub API never carries their product data.
 */
export async function getCreatorProfile(wawuId: string): Promise<CreatorProfile> {
  let real: RealPublicCreatorProfile;
  let content: CreatorProfile["content"];
  try {
    [real, content] = await Promise.all([
      apiFetch<RealPublicCreatorProfile>(`/api/hub/users/${wawuId}/public-profile`, {
        authed: true,
      }),
      getCreatorContent(wawuId),
    ]);
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with GET /api/hub/users/:wawuId/public-profile
    // Without this a fixture build could not open ANY visited profile, which
    // is the half of build brief C2's one-template rule that actually sells.
    const { mockCreatorProfile } = await import("./mocks/creator-profile");
    return mockCreatorProfile(wawuId);
  }
  return {
    wawuId: real.wawuUserId,
    name: real.handle ?? "WAWU creator",
    // Empty, not the raw id: ProfileHeader only renders "@{handle}" when
    // handle is truthy, so a handleless creator's row is skipped entirely
    // instead of showing "@55d03d5d6-77c2-4761-9297-8c0aaf845426" under the
    // "WAWU creator" fallback name two lines up — same bug, one line lower.
    handle: real.handle ?? "",
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
    // 24 matches the server's default for a creator who has never changed it.
    dmResponseHours: real.dmResponseHours ?? 24,
    categories: real.interests,
    avatarUrl: real.avatarUrl ?? null,
    coverUrl: real.coverUrl ?? null,
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
    content,
    communities: [],
    products: [],
  };
}

/**
 * GET /api/hub/creators/:wawuId/follow — the caller's real follow state.
 * This used to read local mock state only, so the follow button was wrong on
 * any new device or after clearing storage.
 *
 * In-flight calls for the same creator are coalesced: FollowButton now asks
 * for itself on mount, and a grid of creators mounts a button per row, so
 * without this every row fired its own GET on a page that already fetched
 * the list once.
 */
const followingInFlight = new Map<string, Promise<boolean>>();

export async function isFollowing(wawuId: string): Promise<boolean> {
  const pending = followingInFlight.get(wawuId);
  if (pending) return pending;
  const run = (async () => {
    try {
      const res = await apiFetch<{ following: boolean }>(`/api/hub/creators/${wawuId}/follow`, { authed: true });
      setMockProfileFollowing(wawuId, res.following);
      return res.following;
    } catch (e) {
      if (!isMockModeError(e)) throw e;
      // SEAM: replace with GET /api/hub/creators/:wawuId/follow
      return getMockProfileFollowing(wawuId);
    }
  })().finally(() => followingInFlight.delete(wawuId));
  followingInFlight.set(wawuId, run);
  return run;
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
