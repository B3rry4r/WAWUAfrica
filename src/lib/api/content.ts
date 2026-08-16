import { apiFetch, apiFetchPaginated } from "./client";
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
 * `ContentPiece.creator` is a placeholder built from the id alone — never a
 * fabricated name. Same for `saved` (that lives on the separate SavedItem
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

export async function getFeed(): Promise<ContentFeedResponse> {
  try {
    const res = await apiFetchPaginated<HubContentPieceResponse>("/api/hub/content?scope=feed", { authed: true });
    return { items: res.data.map(mapContentPiece).map(guardLocked) };
  } catch {
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
 * Separately: this function is called from the PUBLIC marketing landing page
 * (before sign-in), but GET /content is behind `WawuAuthGuard` for every
 * scope — an anonymous visitor has no token, so this call 401s and the mock
 * fallback below is what actually renders on that page today. A public,
 * unauthenticated content-listing endpoint doesn't exist yet.
 */
export async function getFeaturedContent(): Promise<ContentPiece[]> {
  try {
    const res = await apiFetchPaginated<HubContentPieceResponse>("/api/hub/content?scope=feed&perPage=3", {
      authed: true,
    });
    return res.data.map(mapContentPiece).map(guardLocked);
  } catch {
    // SEAM: replace with GET /api/hub/content?scope=feed (no dedicated featured scope exists)
    return mockContent.filter((c) => ["cac-in-7-days", "ankara-pattern-drafting", "dry-season-poultry"].includes(c.id));
  }
}

export async function getContent(id: string): Promise<ContentDetailResponse> {
  try {
    const res = await apiFetch<HubContentPieceResponse>(`/api/hub/content/${id}`, { authed: true });
    return { content: guardLocked(mapContentPiece(res)) };
  } catch {
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
  } catch {
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
  } catch {
    // SEAM: replace with POST /api/hub/content/:id/unlock/verify
    mockPurchasedIds.add(id);
    const content = mockContentById(id)?.content;
    return {
      purchased: true,
      fullAssetUrl: content?.fullAssetUrl ?? `https://cdn.wawu.example/full/${id}`,
    };
  }
}
