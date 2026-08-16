import { apiFetchPaginated } from "./client";
import { getContent } from "./content";
import type { Purchase, PurchasesResponse } from "@/types/purchase";

/**
 * Wire shape of GET /api/hub/content/purchases (ContentPieceService#listPurchases
 * — verified against the Prisma Purchase model and
 * WAWU-Hub-API/src/common/types/purchase.type.ts). A raw, unjoined Purchase
 * row: no content title/type, no creator display name.
 */
interface HubPurchaseResponse {
  id: string;
  contentId: string | null;
  type: "content" | "tip";
  buyerWawuId: string;
  creatorWawuId: string;
  amount: number;
  commissionRate: number;
  flutterwaveTxRef: string;
  flutterwaveTxId: string | null;
  status: "pending" | "completed" | "failed";
  note: string | null;
  purchasedAt: string;
}

/**
 * KNOWN BACKEND GAP: GET /content/purchases returns raw Purchase rows only —
 * it never joins content title/contentType, and (same gap as content.ts's
 * `mapContentPiece`) no endpoint in this domain returns a creator's display
 * name. This enriches each row with a real GET /content/:id call (content.ts,
 * also mine) to recover title/contentType. `creatorName` still falls back to
 * the bare `creatorWawuId` because nothing anywhere in ContentPiece/Purchase
 * returns a profile name — flagging rather than fabricating one.
 */
async function mapPurchase(raw: HubPurchaseResponse): Promise<Purchase> {
  const fallback: Purchase = {
    id: raw.id,
    contentId: raw.contentId ?? "",
    // Unknown without a successful content lookup below — no "unknown" member
    // exists on ContentType, so this is a placeholder, not a real value.
    contentType: "video",
    title: "Purchased content",
    creatorName: raw.creatorWawuId,
    price: raw.amount,
    purchasedAt: raw.purchasedAt,
  };
  if (!raw.contentId) return fallback;
  // No catch here: a real failure enriching this row (e.g. the content was
  // deleted, or a transient error) must fail the whole purchases read rather
  // than silently substituting a fabricated title/type for real data.
  const { content } = await getContent(raw.contentId);
  return {
    ...fallback,
    contentType: content.contentType,
    title: content.title,
    creatorName: content.creator.fullName, // still a placeholder — see content.ts's own creator-embed gap
  };
}

export async function getPurchases(): Promise<PurchasesResponse> {
  const res = await apiFetchPaginated<HubPurchaseResponse>("/api/hub/content/purchases", { authed: true });
  const items = await Promise.all(
    res.data.filter((p) => p.type === "content").map(mapPurchase),
  );
  return { items };
}
