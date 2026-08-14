import { request } from "./client";
import type { ContentItem, Purchase } from "@/types/content";
import type { Paginated } from "@/types/api";
import { MOCK_FEED } from "./mocks/content.mock";

const USE_MOCKS = !process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getFeed(page = 1): Promise<Paginated<ContentItem>> {
  if (USE_MOCKS) return { data: MOCK_FEED, page: 1, hasMore: false };
  return request<Paginated<ContentItem>>(`/api/hub/content?page=${page}`);
}

export async function getContent(id: string): Promise<ContentItem> {
  if (USE_MOCKS) {
    const found = MOCK_FEED.find((c) => c.id === id);
    if (!found) throw new Error(`No mock content for id ${id}`);
    return found;
  }
  return request<ContentItem>(`/api/hub/content/${id}`);
}

/** Returns the Flutterwave config the client hands to the inline checkout. */
export async function startUnlock(id: string) {
  return request<{ flutterwaveConfig: Record<string, unknown> }>(
    `/api/hub/content/${id}/unlock`,
    { method: "POST" }
  );
}

/** Server re-verifies with Flutterwave before granting access. */
export async function verifyUnlock(
  id: string,
  payload: { transaction_id: string; tx_ref: string }
) {
  return request<{ purchased: true; fullAssetUrl: string }>(
    `/api/hub/content/${id}/unlock/verify`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export async function getPurchases(): Promise<Paginated<Purchase>> {
  if (USE_MOCKS) return { data: [], page: 1, hasMore: false };
  return request<Paginated<Purchase>>(`/api/hub/content/purchases`);
}
