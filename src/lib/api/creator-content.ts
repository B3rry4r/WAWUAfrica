/**
 * Creator-side content library: what a creator has uploaded and its review
 * status. The consumer-side reading API lives in ./content.ts — these are
 * deliberately separate surfaces.
 */
import type { ContentItem, ContentStatus } from "@/types/content";
import { CONTENT_TYPE_META } from "@/types/content";
import { formatNaira } from "@/lib/format";
import { apiFetch, apiFetchPaginated, isMockModeError, ApiError, mockRequest } from "./client";
import { sessionStorage } from "@/lib/auth/session-storage";

export const libraryItems: ContentItem[] = [
  {
    id: "c1",
    type: "course",
    title: "CAC in 7 days",
    meta: `Course · ${formatNaira(2500)} · 34 sold`,
    price: 2500,
    status: "live",
    earned: 76500,
    activity: "34 sold",
  },
  {
    id: "c2",
    type: "video",
    title: "Pricing for market stalls",
    meta: `Video · ${formatNaira(0)} · 1,204 views`,
    price: 0,
    status: "live",
    isFirstUpload: true,
    activity: "1,204 views",
  },
  {
    id: "c3",
    type: "pdf",
    title: "The trader's playbook",
    meta: `PDF · ${formatNaira(1500)} · submitted today`,
    price: 1500,
    status: "review",
  },
  {
    id: "c4",
    type: "pdf",
    title: "Market survey 2024",
    meta: "PDF",
    price: 0,
    status: "rejected",
    rejectionReason:
      "Charts were taken from another publisher. Replace them or credit the source.",
  },
];

/**
 * Wire shape of GET /api/hub/content/mine and GET /api/hub/content/:id, and
 * the response to POST /api/hub/content (ContentPieceService — verified
 * against the Prisma ContentPiece model). A flat row — no aggregated
 * sales/earnings and no rejection-reason column (schema is frozen with
 * neither).
 */
interface HubContentPieceResponse {
  id: string;
  contentType: ContentItem["type"];
  title: string;
  description: string;
  category: string;
  price: number;
  previewAssetUrl: string;
  fullAssetUrl: string | null;
  creatorFirstUploadFree: boolean;
  status: "pending" | "live" | "rejected";
  views: number;
}

/**
 * Maps the Hub's flat ContentPiece row onto the frontend's `ContentItem`.
 *
 * KNOWN BACKEND GAPS:
 * - `earned` (lifetime earnings) and a real "N sold" count need a Purchase
 *   aggregation per content id — that lives on the CreatorEarnings resource,
 *   not on ContentPiece. Not available here; left undefined rather than
 *   guessed. `activity` falls back to the one count this endpoint actually
 *   has (`views`), which is real for every content type, not just free ones.
 * - `rejectionReason`: the frozen ContentPiece schema has no rejection-reason
 *   column at all — a rejected piece's "why" isn't stored anywhere this
 *   resource can read. Left undefined, not fabricated.
 */
function mapToContentItem(raw: HubContentPieceResponse): ContentItem {
  const status: ContentStatus = raw.status === "pending" ? "review" : raw.status;
  const typeLabel = CONTENT_TYPE_META[raw.contentType].label;
  // "Free" is gone from the platform's language — state the price instead.
  const priceLabel = formatNaira(raw.price);
  const meta =
    status === "rejected"
      ? typeLabel
      : status === "review"
        ? `${typeLabel} · ${priceLabel} · submitted for review`
        : `${typeLabel} · ${priceLabel} · ${raw.views.toLocaleString()} views`;

  return {
    id: raw.id,
    type: raw.contentType,
    title: raw.title,
    meta,
    price: raw.price,
    status,
    activity: status === "live" ? `${raw.views.toLocaleString()} views` : undefined,
    isFirstUpload: raw.creatorFirstUploadFree,
    description: raw.description,
    category: raw.category,
    previewAssetUrl: raw.previewAssetUrl,
    fullAssetUrl: raw.fullAssetUrl ?? undefined,
  };
}

export interface ContentApi {
  getLibrary: () => Promise<ContentItem[]>;
  getLibraryItem: (id: string) => Promise<ContentItem | undefined>;
  publish: (item: Omit<ContentItem, "id" | "status">) => Promise<ContentItem>;
}

export const contentApi: ContentApi = {
  getLibrary: async () => {
    try {
      const res = await apiFetchPaginated<HubContentPieceResponse>("/api/hub/content/mine", { authed: true });
      return res.data.map(mapToContentItem);
    } catch (e) {
      if (!isMockModeError(e)) throw e;
      // SEAM: replace with GET /api/hub/content/mine
      return mockRequest([...libraryItems]);
    }
  },

  getLibraryItem: async (id) => {
    try {
      const res = await apiFetch<HubContentPieceResponse>(`/api/hub/content/${id}`, { authed: true });
      return mapToContentItem(res);
    } catch (e) {
      if (!isMockModeError(e)) throw e;
      const item = libraryItems.find((i) => i.id === id);
      // SEAM: replace with GET /api/hub/content/:id
      return mockRequest(item ? { ...item } : undefined, 150);
    }
  },

  publish: async (item) => {
    // Real gate: the session WAWU ID / the Hub actually issued, not the
    // frozen dev mock (src/lib/api/mocks/session.ts). A plain user reaching
    // this function at all would mean the page-level gate (creatorGates on
    // the real session) already failed to block them upstream, so this is a
    // second, independent check against the real signed-in user.
    const creator = sessionStorage.getUser()?.creator ?? null;
    if (!creator) {
      throw new ApiError("Only creator accounts can publish.", 403);
    }

    // These are optimistic client-side pre-checks; the real POST is the
    // source of truth and returns its own 400/409. They previously read the
    // STATIC mock `libraryItems` (3 fixtures), so a Basic creator with
    // slotsTotal=3 was always rejected with 409 before the request was ever
    // made — publishing was impossible. Read the creator's real library, and
    // if that read fails, skip the pre-check rather than block on stale data.
    let existing: ContentItem[] | null = null;
    try {
      existing = await contentApi.getLibrary();
    } catch {
      existing = null;
    }

    if (existing) {
      const firstUpload = !existing.some((i) => i.status === "live");
      if (firstUpload && item.price > 0) {
        throw new ApiError("Your first upload has to go out at ₦0. Publish this one at no charge, then price everything after it.", 400);
      }

      const inUse = existing.filter((i) => i.status !== "rejected").length;
      if (inUse >= creator.slotsTotal) {
        throw new ApiError("All upload slots are in use. Take a piece down, or move up to Pro for more room.", 409);
      }
    }

    let created: ContentItem;
    try {
      const res = await apiFetch<HubContentPieceResponse>("/api/hub/content", {
        method: "POST",
        authed: true,
        body: {
          contentType: item.type,
          title: item.title,
          description: item.description ?? "",
          category: item.category ?? "",
          accessType: item.price > 0 ? "paid" : "free",
          price: item.price,
          // Real uploaded object URLs, produced by POST /uploads/presign +
          // a direct PUT to storage (see src/lib/api/uploads.ts). The wizard
          // blocks publishing until a file has genuinely finished uploading,
          // so these are never empty on the real path.
          previewAsset: item.previewAssetUrl ?? "",
          fullAsset: item.fullAssetUrl ?? "",
        },
      });
      created = mapToContentItem(res);
    } catch (e) {
      if (!isMockModeError(e)) throw e;
      // SEAM: replace with POST /api/hub/content
      created = await mockRequest({ ...item, id: `c${Date.now()}`, status: "review" as ContentStatus }, 800);
    }

    libraryItems.unshift(created);
    return created;
  },
};
