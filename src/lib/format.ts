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
 * WAWU Credits are the deliberate exception at 90/10 and were always
 * tier-independent. They are computed server-side and must not be folded in here.
 */
export const CREATOR_SPLIT_RATE = 0.85;

export function creatorSplitRate(): number {
  return CREATOR_SPLIT_RATE;
}

/** The same split as a whole percentage, for "you keep N%" copy. */
export function creatorSplitPercent(): number {
  return Math.round(CREATOR_SPLIT_RATE * 100);
}
