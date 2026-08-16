import type { EarningsRecentSale, EarningsSummary } from "@/types/earnings";
import { apiFetch } from "./client";

/**
 * Mirrors a real GET /api/hub/content/mine/earnings response (verified live
 * against a seeded basic-tier creator — see git history / task report).
 * Kept as the mock fallback and as the direct read used by
 * CreatorDashboard.tsx / EarningsDashboard.tsx (both only touch
 * `.payable`/`.held`, which are stable across the real-shape rewrite).
 */
export const currentEarnings: EarningsSummary = {
  total: 184500,
  payable: 171750,
  held: 12750,
  recentSales: [
    { id: "e1", source: "dm", amount: 300, occurredAt: "2026-08-15T09:00:00.000Z" },
    { id: "e2", source: "dm", amount: 300, occurredAt: "2026-08-14T09:00:00.000Z" },
    { id: "e3", source: "content", amount: 1020, occurredAt: "2026-08-13T09:00:00.000Z" },
  ],
  streamBreakdown: [
    { stream: "content", amount: 123300 },
    { stream: "dm", amount: 31050 },
    // Raw credit COUNT, never naira — CLAUDE.md non-negotiable, never format with formatNaira().
    { stream: "community_credits", amount: 48 },
    { stream: "tips", amount: 8550 },
  ],
};

export interface EarningsApi {
  getSummary: () => Promise<EarningsSummary>;
  getEntries: () => Promise<EarningsRecentSale[]>;
}

export const earningsApi: EarningsApi = {
  getSummary: async () => {
    try {
      // CreatorEarnings has no ledger of its own — this is a flat aggregate
      // computed at request time, not a running balance (see backend
      // service doc comment). Creator-only: WawuAuthGuard + CreatorAccountGuard.
      return await apiFetch<EarningsSummary>("/api/hub/content/mine/earnings", { authed: true });
    } catch {
      // SEAM: replace with GET /api/hub/content/mine/earnings
      return { ...currentEarnings };
    }
  },
  getEntries: async () => {
    try {
      // recentSales is embedded in the summary response — there is no
      // separate list endpoint on the real backend.
      const summary = await apiFetch<EarningsSummary>("/api/hub/content/mine/earnings", { authed: true });
      return summary.recentSales;
    } catch {
      // SEAM: replace with GET /api/hub/content/mine/earnings
      return [...currentEarnings.recentSales];
    }
  },
};
