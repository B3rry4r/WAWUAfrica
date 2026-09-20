/**
 * Mirrors the real backend's GET /content/mine/earnings response exactly
 * (see /workspace/projects/WAWU-Hub-API/src/common/types/creator-earnings.type.ts
 * — CreatorEarningsResponse). CreatorEarnings has no ledger of its own; this
 * is a flat aggregate computed at request time, not a running balance.
 *
 * `refunded`/`creditsBalance`/`period` from the old mock-era shape do not
 * exist on the real response and have been dropped — nothing in the app
 * read them (grepped before removing).
 */
export type EarningsStream = "content" | "tips" | "dm" | "community_credits";
/**
 * `subscription` was a member here, mirroring the backend enum. Creator
 * subscriptions were removed from the product and no receipt for one was ever
 * taken, so no row can carry it. Both lookups that read this union fall back
 * ("Earning" / a generic icon) if the wire ever sends an unknown source.
 */
export type EarningsSaleSource = "content" | "tip" | "dm" | "community_credits";

export interface EarningsStreamBreakdownEntry {
  stream: EarningsStream;
  /**
   * Naira for every stream EXCEPT `community_credits`, which is a raw
   * credit COUNT (CLAUDE.md: "WAWU Credits render as a COUNT... never a
   * naira value, never cashable. Ever."). Never format this field with
   * formatNaira() when stream === "community_credits".
   */
  amount: number;
}

export interface EarningsRecentSale {
  id: string;
  source: EarningsSaleSource;
  /** Naira, except source === "community_credits" — see EarningsStreamBreakdownEntry.amount. */
  amount: number;
  /** ISO 8601 timestamp. */
  occurredAt: string;
}

export interface EarningsSummary {
  /** naira — payable + held */
  total: number;
  /** naira — earned and payable (KYC approved). */
  payable: number;
  /** naira — earned but held while KYC is pending or unverified. */
  held: number;
  recentSales: EarningsRecentSale[];
  streamBreakdown: EarningsStreamBreakdownEntry[];
}
