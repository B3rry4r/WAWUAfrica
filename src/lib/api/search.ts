import { apiFetch } from "./client";
import { mockSearchCommunities, mockSearchResults } from "./mocks/mockSearch";
import type { SearchResponse, SearchResults, SearchCreatorResult, SearchCommunityResult } from "@/types/search";
import type { ContentPiece, CreatorProfile as ContentCreatorProfile } from "@/types/content";

/**
 * Real shapes returned by SearchResponseService (WAWU-Hub-API
 * src/search-response/*), read directly rather than trusted from the old
 * SEAM comments — the real controller mounts `/search`, `/search/suggestions`,
 * `/search/closest` under the global `api/hub` prefix. There is NO
 * `/search/recent`, `/search/popular`, `/search/suggested-creators`, or
 * `/search/suggested-communities` route — those were guesses. Every one of
 * those folds into the single GET /search/suggestions aggregate below.
 */

/** Backend ContentPieceResponse — a raw ContentPiece row plus derived lock state. No nested creator object. */
interface WireContentPiece {
  id: string;
  slug: string;
  creatorWawuId: string;
  contentType: ContentPiece["contentType"];
  title: string;
  description: string;
  category: string;
  tags: string[];
  accessType: ContentPiece["accessType"];
  price: number;
  durationLabel: string | null;
  pageCount: number | null;
  previewAssetUrl: string;
  fullAssetUrl: string | null;
  status: string;
  views: number;
  ratingPct: number | null;
  commentCount: number;
  likes: number;
  createdAt: string;
  fullAssetLocked: boolean;
}

/** Backend CreatorProfile (src/common/types/user-profile.type.ts) — a UserProfile+CreatorState+EvgScore aggregate. */
interface WireCreatorProfile {
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

/** Backend CommunityResponse — always [] today, Community search isn't wired server-side yet (see toSearchResults below). */
interface WireCommunity {
  id: string;
  name: string;
  memberCount: number;
}

interface WireSearchResults {
  content: WireContentPiece[];
  creators: WireCreatorProfile[];
  communities: WireCommunity[];
}

interface WireSearchSuggestions {
  recentSearches: string[];
  popularSearches: string[];
  suggestedCreators: WireCreatorProfile[];
}

interface WireClosestResult {
  items: WireContentPiece[];
}

/**
 * GAP: ContentPieceResponse (backend) carries only `creatorWawuId`, never a
 * nested creator object — there is no join/enrichment anywhere in
 * ContentPieceService or SearchResponseService. This affects every
 * content-returning endpoint, not just search. Until the backend enriches
 * (or the frontend adds a per-creator profile fetch), `creator` is built
 * from the id alone — fullName/handle fall back to the wawuId,
 * verificationLevel defaults to the lowest rung ("basic") as a safe
 * under-claim rather than a fabricated one.
 */
function placeholderCreator(creatorWawuId: string): ContentCreatorProfile {
  return {
    wawuId: creatorWawuId,
    fullName: creatorWawuId,
    handle: creatorWawuId,
    verificationLevel: "basic",
  };
}

/**
 * Security contract (docs/02_TECHNICAL_CONTEXT.md §2.1, §3.2 — same rule
 * content.ts's own guardLocked enforces): a locked piece must never carry
 * `fullAssetUrl` client-side. The backend already redacts it when locked
 * (SearchResponseService.toContentResponses mirrors ContentPieceService's
 * own derivation), this strips it again defensively.
 */
function toContentPiece(item: WireContentPiece): ContentPiece {
  const piece: ContentPiece = {
    id: item.id,
    slug: item.slug,
    contentType: item.contentType,
    title: item.title,
    description: item.description,
    category: item.category,
    accessType: item.accessType,
    price: item.price,
    creator: placeholderCreator(item.creatorWawuId),
    durationLabel: item.durationLabel ?? undefined,
    pageCount: item.pageCount ?? undefined,
    views: item.views,
    ratingPct: item.ratingPct ?? undefined,
    commentCount: item.commentCount,
    likes: item.likes,
    // GAP: search results don't carry per-requester saved state (SavedItem
    // isn't joined here) — defaults to false rather than fabricating a guess.
    saved: false,
    createdAt: item.createdAt,
    previewAssetUrl: item.previewAssetUrl,
    fullAssetUrl: item.fullAssetUrl ?? undefined,
    fullAssetLocked: item.fullAssetLocked,
  };
  if (piece.fullAssetLocked) {
    const { fullAssetUrl: _stripped, ...safe } = piece;
    return safe;
  }
  return piece;
}

/**
 * GAP: CreatorProfile (backend) has no `fullName`, `location`, or
 * `verificationLevel` field — UserProfile's own Prisma model only stores
 * `handle` (schema.prisma has no fullName/location column at all), and
 * verificationLevel is WAWU ID's tier ladder (schema.prisma's own comment on
 * VerificationSubmission: this backend "is NOT this table's concern to keep
 * in sync"), never mirrored into this Hub API's response. `tier` here is the
 * *subscription* tier (basic/pro), a different axis from verificationLevel —
 * never conflate the two.
 */
function toSearchCreatorResult(item: WireCreatorProfile): SearchCreatorResult {
  return {
    wawuId: item.wawuUserId,
    fullName: item.handle ?? item.wawuUserId,
    headline: item.bio ?? "",
    verificationLevel: "basic",
    pieceCount: item.contentCount,
  };
}

/** Community model has no `visibility` column at all yet — defaults to "open" (moot today: see toSearchResults below). */
function toSearchCommunityResult(item: WireCommunity): SearchCommunityResult {
  return { id: item.id, name: item.name, memberCount: item.memberCount, visibility: "open" };
}

function toSearchResults(wire: WireSearchResults): SearchResults {
  return {
    content: wire.content.map(toContentPiece),
    creators: wire.creators.map(toSearchCreatorResult),
    // NOTE (known, separately-tracked backend gap — not fixable here):
    // search-response.service.ts hardcodes `communities: []` unconditionally.
    // Community exists as a Prisma model now, but the search service hasn't
    // been updated to query it. wire.communities is therefore always [].
    communities: wire.communities.map(toSearchCommunityResult),
  };
}

export async function getRecentSearches(): Promise<string[]> {
  const res = await apiFetch<WireSearchSuggestions>("/api/hub/search/suggestions", { authed: true });
  // Always [] today — no per-user search-history table exists yet
  // (search-response.service.ts's own documented gap), authenticated or not.
  return res.recentSearches;
}

export async function searchAll(query: string): Promise<SearchResponse> {
  const results = await apiFetch<WireSearchResults>(`/api/hub/search?q=${encodeURIComponent(query)}`, { authed: true });
  // GET /search returns SearchResults directly (no {query, results} envelope
  // beyond the Hub's standard {statusCode,message,data} wrapper, which
  // apiFetch already strips) — `query` is echoed back client-side since we
  // already know it, matching this file's existing SearchResponse contract.
  return { query, results: toSearchResults(results) };
}

/** Fuzzy "closest matches" shown on a no-results screen. */
export async function getClosestResults(query: string): Promise<ContentPiece[]> {
  const res = await apiFetch<WireClosestResult>(`/api/hub/search/closest?q=${encodeURIComponent(query)}`, {
    authed: true,
  });
  return res.items.map(toContentPiece);
}

export async function getPopularSearches(): Promise<string[]> {
  const res = await apiFetch<WireSearchSuggestions>("/api/hub/search/suggestions", { authed: true });
  return res.popularSearches;
}

export async function getSuggestedCreators() {
  const res = await apiFetch<WireSearchSuggestions>("/api/hub/search/suggestions", { authed: true });
  return res.suggestedCreators.map(toSearchCreatorResult);
}

/**
 * GAP (genuine, not a wiring miss): SearchSuggestions has no
 * `suggestedCommunities` field at all — search-response.service.ts's
 * `suggestions()` returns exactly {recentSearches, popularSearches,
 * suggestedCreators}. There is no backend endpoint for suggested
 * communities to call yet (consistent with Community search generally not
 * being wired — see toSearchResults's note above). No call site in this
 * codebase currently uses this export (grepped) — left mock-only rather
 * than pointed at a path that would always 404.
 */
export async function getSuggestedCommunities() {
  return mockSearchCommunities;
}

export { mockSearchResults };
