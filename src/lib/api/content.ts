import { apiFetch, apiFetchPaginated, isMockModeError } from "./client";
import { mockContent, mockContentById, mockPurchasedIds } from "./mocks/mockContent";
import type {
  ContentDetailResponse,
  ContentFeedResponse,
  ContentPiece,
  UnlockInitiateResponse,
  UnlockVerifyResponse,
} from "@/types/content";

/**
 * Wire shape of GET /api/hub/content, /content/:id, /content/mine (Hub
 * ContentPieceService#toResponse — verified against
 * WAWU-Hub-API/src/common/types/content-piece.type.ts and the Prisma
 * ContentPiece model). This is the RAW row plus the two derived fields —
 * it carries `creatorWawuId` only, never a nested creator profile. See
 * `mapContentPiece` below for the resulting frontend-contract gap.
 */
interface HubContentPieceResponse {
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
  creatorFirstUploadFree: boolean;
  status: "pending" | "live" | "rejected";
  views: number;
  ratingPct: number | null;
  commentCount: number;
  likes: number;
  createdAt: string;
  fullAssetLocked: boolean;
}

/**
 * Maps the Hub's flat ContentPiece row onto the frontend's `ContentPiece`
 * shape, which additionally expects a nested `creator` profile, a `saved`
 * flag, and course-lesson data.
 *
 * KNOWN BACKEND GAP: GET /content (all scopes) and GET /content/:id never
 * embed a creator profile — only `creatorWawuId` (a bare id) comes back.
 * There is no batch profile-lookup endpoint wired into this domain either.
 * Until the Hub API joins UserProfile onto this response (or ships a
 * batch-profile endpoint the frontend can call alongside), every real
 * `ContentPiece.creator` this function returns is seeded from the id alone
 * — never a fabricated name. `getContent` (single-piece detail) upgrades
 * this placeholder to the real handle via a follow-up public-profile call
 * once mapping is done; list/feed callers (getFeed, getFeaturedContent)
 * still show the bare id today, same gap, no per-item fetch added for a
 * list. Same for `saved` (that lives on the separate SavedItem
 * resource, `GET /users/me/saved` — not exposed on this response) and
 * `courseLessons`/`lessonCount` (CourseLesson is a related-but-separate
 * resource; the list/detail queries here never `include` it).
 */
function mapContentPiece(raw: HubContentPieceResponse): ContentPiece {
  return {
    id: raw.id,
    slug: raw.slug,
    contentType: raw.contentType,
    title: raw.title,
    description: raw.description,
    category: raw.category,
    accessType: raw.accessType,
    price: raw.price,
    creator: {
      // GAP: no creator-profile embed on this response — see doc comment above.
      wawuId: raw.creatorWawuId,
      fullName: raw.creatorWawuId,
      handle: raw.creatorWawuId,
      verificationLevel: "basic",
    },
    durationLabel: raw.durationLabel ?? undefined,
    pageCount: raw.pageCount ?? undefined,
    views: raw.views,
    ratingPct: raw.ratingPct ?? undefined,
    commentCount: raw.commentCount,
    likes: raw.likes,
    saved: false, // GAP: SavedItem is a separate resource, not embedded here.
    createdAt: raw.createdAt,
    previewAssetUrl: raw.previewAssetUrl,
    fullAssetUrl: raw.fullAssetUrl ?? undefined,
    fullAssetLocked: raw.fullAssetLocked,
    // Best-effort derivation: unlocked + not-free implies a completed
    // purchase (or creator ownership — resolveUnlockedSet treats both the
    // same server-side). Not returned explicitly by the backend.
    purchased: !raw.fullAssetLocked && raw.accessType === "paid",
  };
}

/**
 * Security contract (docs/02_TECHNICAL_CONTEXT.md §2.1, §3.2): a locked piece
 * must never carry `fullAssetUrl` client-side. The GET /content/:id response
 * omits it and sets `fullAssetLocked: true`. This layer strips it again
 * defensively so no locked content can ever hand a full URL to a component.
 */
function guardLocked(content: ContentPiece): ContentPiece {
  if (content.fullAssetLocked) {
    const { fullAssetUrl: _stripped, ...safe } = content;
    return safe;
  }
  return content;
}

/**
 * mapContentPiece seeds creator.fullName/handle with the bare wawuId (see
 * its doc comment — list endpoints never embed a creator profile). getContent()
 * fixes this for a single piece via getCreatorSummary(); list views need the
 * same fix applied to every distinct creator in the page, batched (one
 * lookup per unique creator, not per item) so a feed with repeat creators
 * doesn't re-fetch the same profile. A single creator's lookup failing
 * (e.g. a genuinely deleted account) only leaves that one card unenriched —
 * it doesn't fake a name, and it doesn't fail the whole list for everyone
 * else's real data.
 */
export async function enrichCreatorIdentities(items: ContentPiece[]): Promise<ContentPiece[]> {
  const uniqueIds = Array.from(new Set(items.map((i) => i.creator.wawuId)));
  const summaries = new Map<string, { isPro: boolean; handle: string | null }>();
  await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        summaries.set(id, await getCreatorSummary(id));
      } catch {
        /* leave this one creator unenriched — see doc comment */
      }
    }),
  );
  return items.map((item) => {
    const summary = summaries.get(item.creator.wawuId);
    if (!summary?.handle) return item;
    return { ...item, creator: { ...item.creator, fullName: summary.handle, handle: summary.handle, isPro: summary.isPro } };
  });
}

export async function getFeed(): Promise<ContentFeedResponse> {
  try {
    const res = await apiFetchPaginated<HubContentPieceResponse>("/api/hub/content?scope=feed", { authed: true });
    const items = await enrichCreatorIdentities(res.data.map(mapContentPiece).map(guardLocked));
    return { items };
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with GET /api/hub/content?scope=feed
    return { items: mockContent.map((c) => guardLocked(mockContentById(c.id)!.content)) };
  }
}

/**
 * Featured creators for the marketing landing ("Creators to watch").
 *
 * KNOWN BACKEND GAP: ListContentQueryDto only accepts `scope: 'feed' | 'mine'`
 * — there is no `'featured'` scope on the real contract (the old SEAM comment
 * guessing `scope=featured` was wrong). There is also no curation/ranking
 * field on ContentPiece to select "featured" pieces server-side. This calls
 * the real feed and takes the first few items as a stand-in for curation.
 *
 * Genuinely public: GET /api/hub/content/public/featured (a real,
 * unauthenticated Hub API route — see PublicContentController) so the
 * landing page shows real creators to every anonymous visitor instead of
 * either locking the section behind a login or faking it. It reuses the
 * same list()/resolveUnlockedSet() the authed feed uses, just called with
 * no requester, so every piece correctly comes back locked (never
 * unlocked) — nothing here that isn't already public-safe. Real failures
 * still propagate; the caller (LandingContent) renders a visible error.
 */
export async function getFeaturedContent(): Promise<ContentPiece[]> {
  const res = await apiFetchPaginated<HubContentPieceResponse>("/api/hub/content/public/featured");
  return enrichCreatorIdentities(res.data.map(mapContentPiece).map(guardLocked));
}

/**
 * Real GET /users/:wawuId/public-profile response carries the creator's
 * tier and handle — see profile.ts's RealPublicCreatorProfile for the full
 * shape. `tier` drives creatorSplitRate() (CLAUDE.md: 85/15 standard, 90/10
 * Pro — never invent a rate). `handle` is the only real, non-fabricated
 * display identity this endpoint exposes for another user (there is no
 * display-name field — see getCreatorProfile in profile.ts for the same
 * documented gap); it replaces the raw internal `creatorWawuId` that
 * mapContentPiece falls back to when this call can't be made. This is
 * money-bearing (it decides whether 85% or 90% is displayed as the
 * creator's cut), so only genuine mock mode (no backend configured)
 * degrades to the safe default — a real failure propagates and fails the
 * whole content-detail load rather than risk silently showing the wrong
 * split.
 */
async function getCreatorSummary(creatorWawuId: string): Promise<{ isPro: boolean; handle: string | null }> {
  try {
    // Genuinely public (PublicUserProfileController) — not the guarded
    // /users/:wawuId/public-profile route, so this also works for
    // getFeaturedContent()'s anonymous landing-page callers, who have no
    // session token to send at all.
    const profile = await apiFetch<{ tier: "basic" | "pro" | "pro_max"; handle: string | null }>(
      `/api/hub/users/public/${creatorWawuId}`,
    );
    return { isPro: profile.tier === "pro", handle: profile.handle };
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: GET /api/hub/users/:wawuId/public-profile
    return { isPro: false, handle: null };
  }
}

export async function getContent(id: string): Promise<ContentDetailResponse> {
  try {
    const res = await apiFetch<HubContentPieceResponse>(`/api/hub/content/${id}`, { authed: true });
    const content = guardLocked(mapContentPiece(res));
    const summary = await getCreatorSummary(res.creatorWawuId);
    content.creator.isPro = summary.isPro;
    // GAP (see mapContentPiece doc comment): the content response never
    // embeds a creator profile, so mapContentPiece seeds fullName/handle
    // with the bare wawuId. Overwrite with the real handle from the
    // public-profile endpoint the moment it's available — never leave the
    // raw internal id as the visible identity when a real field exists.
    if (summary.handle) {
      content.creator.fullName = summary.handle;
      content.creator.handle = summary.handle;
    }
    return { content };
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with GET /api/hub/content/:id
    const mock = mockContentById(id);
    if (!mock) throw new Error("Content not found");
    // SEAM: replace with GET /api/hub/content/:id
    return { content: guardLocked(mock.content) };
  }
}

/**
 * POST /api/hub/content/:id/unlock — returns a Flutterwave config; the client
 * then opens Flutterwave inline checkout. The full asset URL is never part of
 * this response. Real response has no `customerEmail`/`customerName` (see
 * `FlutterwaveConfig` in src/types/content.ts — both optional there for
 * exactly this reason; nothing in the UI currently reads them).
 */
export async function initiateUnlock(id: string): Promise<UnlockInitiateResponse> {
  try {
    return await apiFetch<UnlockInitiateResponse>(`/api/hub/content/${id}/unlock`, {
      method: "POST",
      authed: true,
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with POST /api/hub/content/:id/unlock
    return {
      flutterwaveConfig: {
        publicKey: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY ?? "FLWPUBK-MOCK",
        txRef: `unlock-${id}-${Date.now()}`,
        amount: mockContentById(id)?.content.price ?? 0,
        currency: "NGN",
        customerEmail: "mock@wawu.ng",
      },
    };
  }
}

/**
 * POST /api/hub/content/:id/unlock/verify — the ONLY thing that flips content
 * to unlocked. The server re-verifies with Flutterwave before returning a
 * signed fullAssetUrl. Never unlock from a client-side callback alone.
 *
 * Real response is the flat `{purchased: true, fullAssetUrl}` — verifyUnlock
 * either returns that or throws (400/404), it never returns
 * `{purchased: false}`. The old `UnlockVerifyResponse` type wrapped this in
 * an extra `{data: ...}` layer that doesn't exist on the wire (apiFetch
 * already unwraps the Hub envelope) — fixed in src/types/content.ts, with
 * the one call site (content/[id]/page.tsx) updated to match.
 */
export async function verifyUnlock(
  id: string,
  payload: { transaction_id: string; tx_ref: string },
): Promise<UnlockVerifyResponse> {
  try {
    return await apiFetch<UnlockVerifyResponse>(`/api/hub/content/${id}/unlock/verify`, {
      method: "POST",
      authed: true,
      body: payload,
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with POST /api/hub/content/:id/unlock/verify
    mockPurchasedIds.add(id);
    const content = mockContentById(id)?.content;
    return {
      purchased: true,
      fullAssetUrl: content?.fullAssetUrl ?? `https://cdn.wawu.example/full/${id}`,
    };
  }
}

// ── Save / rate / comments ─────────────────────────────────────────────────
// These three were local-only in the UI: the save toggle, the star rating and
// new comments all mutated React state and vanished on reload, because no
// client function existed to call the endpoints the backend already exposes.

/** POST/DELETE /api/hub/content/:id/save. Returns the resulting saved state. */
export async function setContentSaved(id: string, saved: boolean): Promise<boolean> {
  try {
    await apiFetch(`/api/hub/content/${id}/save`, {
      method: saved ? "POST" : "DELETE",
      authed: true,
    });
    return saved;
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with POST/DELETE /api/hub/content/:id/save
    return saved;
  }
}

/** POST /api/hub/content/:id/rate — 1-5 stars. */
export async function rateContent(id: string, rating: number): Promise<void> {
  try {
    await apiFetch(`/api/hub/content/${id}/rate`, {
      method: "POST",
      authed: true,
      body: { rating },
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with POST /api/hub/content/:id/rate
  }
}

/** Wire shape of Comment (prisma model is the wire shape). */
export interface ContentComment {
  id: string;
  contentId: string;
  authorWawuId: string;
  text: string;
  replyToId: string | null;
  likes: number;
  createdAt: string;
}

/** GET /api/hub/content/:id/comments */
export async function getComments(id: string): Promise<ContentComment[]> {
  return apiFetch<ContentComment[]>(`/api/hub/content/${id}/comments`, { authed: true });
}

/** POST /api/hub/content/:id/comments */
export async function postComment(
  id: string,
  text: string,
  replyToId?: string,
): Promise<ContentComment> {
  return apiFetch<ContentComment>(`/api/hub/content/${id}/comments`, {
    method: "POST",
    authed: true,
    body: replyToId ? { text, replyToId } : { text },
  });
}
