import type { CreatorTier } from "@/types/account";

/** All money is an integer number of Naira. Never floats, never string-concatenated. */
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

/**
 * WAWU Credits are prepaid message units — a COUNT, never a currency value and
 * never cashable. Do not add a naira conversion here.
 */
export function formatCredits(count: number): string {
  return `${count.toLocaleString("en-NG")} ${count === 1 ? "credit" : "credits"}`;
}

/**
 * Creator revenue split: the creator keeps 85%, WAWU keeps 15%.
 *
 * ONE rate. It used to be 85% standard and 90% on a Pro plan, read off
 * `PLANS[tier].split`. Subscriptions are gone, and so is the tier that sold
 * the better rate: the backend dropped `CreatorState.tier` entirely, so there
 * is no longer any value the API can return that would mean 90%.
 *
 * Leaving the branch in would have been actively unsafe, not merely untidy.
 * Every screen here says 85% while the branch still paid 90% to any row that
 * came back as `pro`, so one stale value anywhere would have made the number
 * on the screen disagree with the money. One function, one rate, no drift.
 *
 * 85/15 is not a new rate invented here: it is the documented standard rate
 * that every creator without a paid plan was already on, and the live API
 * reports no successful payment has ever been taken, so nobody was on 90/10.
 *
 * WAWU Credits USED TO BE the one exception, at 90/10. They are not any
 * more: the product owner moved them to 85/15 on 21 Sep 2026 ("Credits
 * follow 85 15"), so this is now the only split in the product, on every
 * stream, for every account.
 *
 * Credits are still computed server-side and must not be folded in here. The
 * backend divides integer kobo by an exact 17/20 against each purchase lot's
 * real cost basis; multiplying a client-side figure by 0.85 would produce a
 * number that disagrees with the ledger in the last kobo.
 */
export const CREATOR_SPLIT_RATE = 0.85;

export function creatorSplitRate(): number {
  return CREATOR_SPLIT_RATE;
}

/** The same split as a whole percentage, for "you keep N%" copy. */
export function creatorSplitPercent(): number {
  return Math.round(CREATOR_SPLIT_RATE * 100);
}
