import { apiFetch } from "./client";
import { mockPurchases } from "./mocks/mockPurchases";
import type { PurchasesResponse } from "@/types/purchase";

export async function getPurchases(): Promise<PurchasesResponse> {
  try {
    return await apiFetch<PurchasesResponse>("/api/hub/content/purchases", { authed: true });
  } catch {
    // SEAM: replace with GET /api/hub/content/purchases
    return mockPurchases;
  }
}