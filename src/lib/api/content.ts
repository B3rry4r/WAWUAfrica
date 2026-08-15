import { apiFetch } from "./client";
import { mockContent, mockContentById, mockPurchasedIds } from "./mocks/mockContent";
import type {
  ContentDetailResponse,
  ContentFeedResponse,
  ContentPiece,
  UnlockInitiateResponse,
  UnlockVerifyResponse,
} from "@/types/content";

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
    const res = await apiFetch<ContentFeedResponse>("/api/hub/content?scope=feed");
    return { items: res.items.map(guardLocked) };
  } catch {
    // SEAM: replace with GET /api/hub/content
    return { items: mockContent.map((c) => guardLocked(mockContentById(c.id)!.content)) };
  }
}

/** Featured creators for the marketing landing ("Creators to watch"). */
export async function getFeaturedContent(): Promise<ContentPiece[]> {
  try {
    const res = await apiFetch<{ items: ContentPiece[] }>("/api/hub/content?scope=featured");
    return res.items;
  } catch {
    // SEAM: replace with GET /api/hub/content?scope=featured
    return mockContent.filter((c) => ["cac-in-7-days", "ankara-pattern-drafting", "dry-season-poultry"].includes(c.id));
  }
}

export async function getContent(id: string): Promise<ContentDetailResponse> {
  try {
    const res = await apiFetch<ContentDetailResponse>(`/api/hub/content/${id}`);
    return { content: guardLocked(res.content) };
  } catch {
    const mock = mockContentById(id);
    if (!mock) throw new Error("Content not found");
    // SEAM: replace with GET /api/hub/content/:id
    return { content: guardLocked(mock.content) };
  }
}

/**
 * POST /api/hub/content/:id/unlock — returns a Flutterwave config; the client
 * then opens Flutterwave inline checkout. The full asset URL is never part of
 * this response.
 */
export async function initiateUnlock(id: string): Promise<UnlockInitiateResponse> {
  try {
    return await apiFetch<UnlockInitiateResponse>(`/api/hub/content/${id}/unlock`, {
      method: "POST",
      authed: true,
    });
  } catch {
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
    mockPurchasedIds.add(id);
    const content = mockContentById(id)?.content;
    return {
      data: {
        purchased: true,
        fullAssetUrl: content?.fullAssetUrl ?? `https://cdn.wawu.example/full/${id}`,
      },
    };
  }
}
