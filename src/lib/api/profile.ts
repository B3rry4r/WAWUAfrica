import type { CreatorProfile, ProfileContentItem, ProfileView } from "@/types/profile";
import { CONTENT_TYPE_META, type ContentType } from "@/types/content";
import { ApiError, apiFetch, apiFetchPaginated, isMockModeError } from "./client";
import { getCreators } from "./explore";
import { toVerificationState } from "./verification";
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
async function getCreatorContent(
  wawuId: string,
  /**
   * `true` when nobody is signed in: a shared store link (build brief C3)
   * opens somebody's shop with no session at all.
   *
   * The authed route 401s an anonymous caller, so the store used to render
   * identity and cross-sell over an EMPTY SHELF - a page whose whole job is
   * to sell somebody's work could not show any of it. The public route
   * returns the same rows with no requester, which means every paid piece
   * comes back locked and no `fullAssetUrl` is served. Free work is
   * unlocked to everybody either way, which is what free means.
   */
  anonymous = false,
): Promise<ProfileContentItem[]> {
  const path = anonymous
    ? `/api/hub/content/public/creator/${wawuId}/content?perPage=50`
    : `/api/hub/users/${wawuId}/content?perPage=50`;
  try {
    const { data } = await apiFetchPaginated<RealProfileContentRow>(path, {
      authed: !anonymous,
      cache: "no-store",
    });
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
  /** Two-tick contract. Read through toVerificationState, never raw. */
  verification?: unknown;
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
 *  - `verification`: the two ticks. REAL now, when the backend sends them —
 *    the public-profile aggregate is the one read that can answer this for
 *    somebody else. An instance that has not shipped the columns yet sends
 *    nothing, and nothing renders no tick (never a tick we cannot back).
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
export async function getCreatorProfile(ref: string): Promise<CreatorProfile> {
  const id = storeRef(ref);
  let real: RealPublicCreatorProfile;
  let content: CreatorProfile["content"];
  try {
    [real, content] = await Promise.all([
      apiFetch<RealPublicCreatorProfile>(`/api/hub/users/${id}/public-profile`, {
        authed: true,
      }),
      getCreatorContent(id),
    ]);
  } catch (e) {
    if (isMockModeError(e)) {
      // SEAM: replace with GET /api/hub/users/:wawuId/public-profile
      // Without this a fixture build could not open ANY visited profile, which
      // is the half of build brief C2's one-template rule that actually sells.
      const { mockCreatorProfile } = await import("./mocks/creator-profile");
      const resolved = await resolveStoreRef(id);
      return mockCreatorProfile(resolved?.wawuId ?? id);
    }
    // `ref` may be a HANDLE, and this endpoint takes an id. One directory
    // lookup turns it into one, then the read is retried exactly once. See
    // resolveStoreRef for why that lookup is a directory scan.
    if (!(e instanceof ApiError && e.status === 404)) throw e;
    const resolved = await resolveStoreRef(id);
    if (!resolved || resolved.wawuId === id) throw e;
    const [retry, retryContent] = await Promise.all([
      apiFetch<RealPublicCreatorProfile>(`/api/hub/users/${resolved.wawuId}/public-profile`, {
        authed: true,
      }),
      getCreatorContent(resolved.wawuId),
    ]);
    return { ...toCreatorProfile(retry, retryContent), name: resolved.name || retry.handle || "WAWU creator" };
  }
  return toCreatorProfile(real, content);
}

/**
 * The public aggregate, mapped onto the profile shape the screen renders.
 * Shared by the signed-in read above and the public store read below so the
 * two cannot drift into describing the same creator differently.
 */
function toCreatorProfile(
  real: RealPublicCreatorProfile,
  content: CreatorProfile["content"],
): CreatorProfile {
  return {
    wawuId: real.wawuUserId,
    name: real.handle ?? "WAWU creator",
    // Empty, not the raw id: ProfileHeader only renders "@{handle}" when
    // handle is truthy, so a handleless creator's row is skipped entirely
    // instead of showing "@55d03d5d6-77c2-4761-9297-8c0aaf845426" under the
    // "WAWU creator" fallback name two lines up — same bug, one line lower.
    handle: real.handle ?? "",
    bio: real.bio ?? "",
    verification: toVerificationState(real.verification),
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

/* --------------------- the shareable store link (C3) --------------------- */

/**
 * Strips the decoration off whatever arrived in the URL, so `@adaeze`,
 * `adaeze` and `%40adaeze` are one reference and not three.
 */
function storeRef(ref: string): string {
  let value = ref.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    // A half-encoded segment ("%zz") is not worth failing a page load over.
  }
  return value.trim().replace(/^@/, "");
}

/**
 * Turn a store-link reference into a real wawuId.
 *
 * Build brief C3 gives every user a link "in the form wawu/their-name", so
 * the thing in the URL is a HANDLE, not the internal id. No endpoint on the
 * contract resolves one: `/users/:wawuId/public-profile`,
 * `/users/public/:wawuId` and `/users/:wawuId/content` all take an id, and
 * the only search that accepts a handle is `/admin/creators` (admin-only,
 * and this is the most anonymous page in the app).
 *
 * KNOWN BACKEND GAP, stated rather than papered over: until the Hub exposes
 * a handle lookup (GET /api/hub/users/public/by-handle/:handle, or simply
 * accepting a handle where it takes an id), this resolves the handle against
 * the public creator directory, GET /api/hub/creators, which is genuinely
 * unauthenticated and does return each creator's handle. Its ceiling is
 * `perPage` (50 on the contract), so a link for somebody outside the first
 * page of the directory will not resolve here. That is a real limit and it
 * is the reason the gap above is worth closing server-side.
 *
 * Returns null only when nothing matched. The caller decides whether an
 * unmatched reference is a 404 or an id to try as-is.
 */
export async function resolveStoreRef(
  ref: string,
): Promise<{ wawuId: string; name: string; handle: string } | null> {
  const value = storeRef(ref).toLowerCase();
  if (!value) return null;
  let rows: Awaited<ReturnType<typeof getCreators>>;
  try {
    rows = await getCreators();
  } catch {
    // The directory is not load-bearing for an id: the caller falls back to
    // using the reference as one. A handle simply will not resolve.
    return null;
  }
  const match =
    rows.find((r) => (r.handle ?? "").toLowerCase() === value) ??
    rows.find((r) => r.wawuId.toLowerCase() === value);
  if (!match) return null;
  return { wawuId: match.wawuId, name: match.name, handle: match.handle ?? "" };
}

/**
 * The store behind a shared `wawu/<handle>` link, read with NO session.
 *
 * Deliberately a different read from getCreatorProfile: that one calls
 * `/users/:wawuId/public-profile`, which is WawuAuthGuard-protected, so a
 * logged-out visitor gets a 401 and (before the public-path guard in
 * client.ts) was hard-navigated to /sign-in. This calls
 * `/api/hub/users/public/:wawuId` (PublicUserProfileController), which is
 * genuinely unauthenticated and returns the same aggregate. Same mapper,
 * same screen, no token.
 *
 * ONE HONEST GAP. There is no public per-creator CONTENT endpoint:
 * `/users/:wawuId/content` is the guarded one and `/content/public/featured`
 * is platform-wide, not creator-scoped. getCreatorContent sends the request
 * without a token and degrades to an empty shelf if the server refuses, so a
 * real deployment may show this creator's storefront with no items on it
 * until that endpoint exists. Nothing is invented to fill the gap.
 */
export async function getStoreProfile(ref: string): Promise<CreatorProfile> {
  const value = storeRef(ref);
  if (!value) throw new ApiError("No store was asked for", 404);

  /*
    Two public reads, fired together because neither needs the other's
    answer. The aggregate is the store. The directory row is what supplies a
    DISPLAY NAME, which the aggregate genuinely has no field for (see
    getCreatorProfile's list of gaps) — without it a shared link opens on
    "chidi-creates" rather than on Chidi Umeh, which is a poor way to meet
    somebody. It also carries the wawuId, which is the fallback for a backend
    whose public read does not accept a handle. The live one does; that is
    not on the contract, so it is not relied on.
  */
  const [attempt, resolved] = await Promise.all([
    readPublicStore(value).then(
      (profile) => ({ profile, error: null as unknown }),
      (error: unknown) => ({ profile: null, error }),
    ),
    resolveStoreRef(value),
  ]);
  const named = (p: CreatorProfile): CreatorProfile =>
    resolved?.name ? { ...p, name: resolved.name } : p;

  if (attempt.profile) return named(attempt.profile);

  const error = attempt.error;
  const unresolved = isMockModeError(error) || (error instanceof ApiError && error.status === 404);
  if (!unresolved) throw error;
  if (!resolved) throw isMockModeError(error) ? new ApiError("No such store", 404) : error;
  if (isMockModeError(error)) {
    // SEAM: replace with GET /api/hub/users/public/:wawuId
    const { mockCreatorProfile } = await import("./mocks/creator-profile");
    return mockCreatorProfile(resolved.wawuId);
  }
  return named(await readPublicStore(resolved.wawuId));
}

async function readPublicStore(id: string): Promise<CreatorProfile> {
  const [real, content] = await Promise.all([
    apiFetch<RealPublicCreatorProfile>(`/api/hub/users/public/${encodeURIComponent(id)}`),
    // Anonymous: this is the SHARED LINK path, where there is no session at
    // all. The authed shelf read 401s here, which is why the store used to
    // show identity and cross-sell over an empty shelf.
    getCreatorContent(id, true),
  ]);
  return toCreatorProfile(real, content);
}

/**
 * The read shape, normalised into what ProfileScreen draws.
 *
 * Lives here rather than in a route file because BOTH entry points need it:
 * the signed-in /profile/:id page and the public store at /wawu/:handle.
 * Build brief C2 forbids a second profile template, and two copies of the
 * normaliser is how a second template gets built by accident.
 */
export function toProfileView(p: CreatorProfile): ProfileView {
  return {
    wawuId: p.wawuId,
    name: p.name,
    handle: p.handle,
    bio: p.bio,
    verification: p.verification,
    avatarUrl: p.avatarUrl,
    coverUrl: p.coverUrl,
    location: p.location,
    memberSince: p.memberSince,
    website: p.socials.website,
    // The public aggregate has no separate headline field; `categories[0]` is
    // what the directory shows under a name, so it is the role line here too
    // rather than a second invented one.
    roleLine: p.categories[0],
    specializations: p.categories,
    socials: p.socials,
    stats: {
      pieces: p.stats.pieces,
      piecesLabel: p.stats.piecesLabel,
      followers: p.stats.followers,
      evg: p.stats.evg,
    },
    dm: { enabled: p.dmEnabled, price: p.dmPrice, responseHours: p.dmResponseHours },
    content: p.content,
    communities: p.communities,
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
