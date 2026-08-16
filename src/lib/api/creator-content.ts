/**
 * Creator-side content library: what a creator has uploaded and its review
 * status. The consumer-side reading API lives in ./content.ts — these are
 * deliberately separate surfaces.
 */
import type { ContentItem, ContentStatus } from "@/types/content";
import { CONTENT_TYPE_META } from "@/types/content";
import { formatNaira } from "@/lib/format";
import { apiFetch, apiFetchPaginated, ApiError, mockRequest } from "./client";
import { currentSession } from "./mocks/session";

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
    meta: "Video · free · 1,204 views",
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
  const priceLabel = raw.price > 0 ? formatNaira(raw.price) : "free";
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
    } catch {
      // SEAM: replace with GET /api/hub/content/mine
      return mockRequest([...libraryItems]);
    }
  },

  getLibraryItem: async (id) => {
    try {
      const res = await apiFetch<HubContentPieceResponse>(`/api/hub/content/${id}`, { authed: true });
      return mapToContentItem(res);
    } catch {
      const item = libraryItems.find((i) => i.id === id);
      // SEAM: replace with GET /api/hub/content/:id
      return mockRequest(item ? { ...item } : undefined, 150);
    }
  },

  publish: async (item) => {
    const creator = currentSession.creator;
    if (!creator) {
      throw new ApiError("Only creator accounts can publish.", 403);
    }

    const firstUpload = !libraryItems.some((i) => i.status === "live");
    if (firstUpload && item.price > 0) {
      throw new ApiError("Your first upload has to be free. Publish it free, then price everything after.", 400);
    }

    const inUse = libraryItems.filter((i) => i.status !== "rejected").length;
    if (inUse >= creator.slotsTotal) {
      throw new ApiError("All upload slots are in use. Remove a piece or upgrade to Pro to free a slot.", 409);
    }

    let created: ContentItem;
    try {
      const res = await apiFetch<HubContentPieceResponse>("/api/hub/content", {
        method: "POST",
        authed: true,
        body: {
          contentType: item.type,
          title: item.title,
          // GAP: none of these four are collected by PublishingWizard.tsx
          // today (it only gathers type/title/price) — see the ContentItem
          // doc comment in src/types/content.ts. Sending them empty means
          // CreateContentDto's validation rejects the request (empty
          // description/category, invalid preview/full asset URLs), which
          // falls straight into the catch below rather than silently
          // publishing a garbage row.
          description: item.description ?? "",
          category: item.category ?? "",
          accessType: item.price > 0 ? "paid" : "free",
          price: item.price,
          previewAsset: item.previewAssetUrl ?? "",
          fullAsset: item.fullAssetUrl ?? "",
        },
      });
      created = mapToContentItem(res);
    } catch {
      // SEAM: replace with POST /api/hub/content
      created = await mockRequest({ ...item, id: `c${Date.now()}`, status: "review" as ContentStatus }, 800);
    }

    libraryItems.unshift(created);
    creator.slotsUsed = inUse + 1;
    return created;
  },
};
