import { formatNaira } from "@/lib/format";
import type { EarningsStream, EarningsSummary, EarningsSaleSource } from "@/types/earnings";

/**
 * Turns the real `streamBreakdown` from GET /content/mine/earnings into rows
 * the dashboards can render.
 *
 * Both dashboards used to chart a hardcoded array (₦123,300 / ₦31,050 /
 * ₦21,600 / ₦8,550) that had nothing to do with the creator's actual
 * earnings — the real total was fetched and displayed directly above figures
 * that did not sum to it, and the same invented numbers were written into a
 * downloadable "creator statement".
 *
 * WAWU Credits are a COUNT, never a naira value (CLAUDE.md), so the
 * community-credits row is deliberately never passed through formatNaira.
 */
const STREAM_LABELS: Record<EarningsStream, string> = {
  content: "Content sales",
  dm: "Paid messages",
  community_credits: "Community credits",
  tips: "Tips",
};

/** Display order, so the chart is stable even if the API reorders. */
const STREAM_ORDER: EarningsStream[] = ["content", "dm", "community_credits", "tips"];

export interface EarningsStreamRow {
  stream: EarningsStream;
  label: string;
  amount: number;
  /** Formatted for display — naira, except credits which render as a count. */
  display: string;
  /** Share of the naira streams, 0-100. Credits are excluded from the split. */
  pct: number;
}

export function earningsStreamRows(summary: EarningsSummary | null): EarningsStreamRow[] {
  if (!summary) return [];
  const byStream = new Map(summary.streamBreakdown.map((e) => [e.stream, e.amount]));

  // Credits are a count, not money, so they must not distort the naira split.
  const nairaTotal = STREAM_ORDER.filter((s) => s !== "community_credits").reduce(
    (sum, s) => sum + (byStream.get(s) ?? 0),
    0,
  );

  return STREAM_ORDER.map((stream) => {
    const amount = byStream.get(stream) ?? 0;
    const isCredits = stream === "community_credits";
    return {
      stream,
      label: STREAM_LABELS[stream],
      amount,
      display: isCredits ? `${amount} credits` : formatNaira(amount),
      pct: isCredits || nairaTotal === 0 ? 0 : Math.round((amount / nairaTotal) * 100),
    };
  });
}

const SALE_LABELS: Record<EarningsSaleSource, string> = {
  content: "Content unlock",
  tip: "Tip received",
  dm: "Paid message",
  community_credits: "Community credits",
  subscription: "Subscription",
};

export function saleSourceLabel(source: EarningsSaleSource): string {
  return SALE_LABELS[source] ?? "Earning";
}

/** Naira for every source except credits, which are a count. */
export function saleAmountDisplay(source: EarningsSaleSource, amount: number): string {
  return source === "community_credits" ? `${amount} credits` : formatNaira(amount);
}

/** "2 hours ago" style relative time for a recent-sale row. */
export function relativeTime(iso: string): string {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
