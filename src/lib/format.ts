import type { CreatorTier } from "@/types/account";

/** All money is an integer number of Naira. Never floats, never string-concatenated. */
export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString("en-NG")}`;
}

/**
 * An amount the API sends in integer kobo (the `...Kobo` fields), as naira.
 * Whole-naira amounts read as "₦2,000"; an amount with kobo keeps both
 * decimals ("₦2,000.50"), so nothing is ever rounded on the way to a screen.
 */
export function formatNairaFromKobo(kobo: number): string {
  if (kobo % 100 === 0) return formatNaira(kobo / 100);
  return `₦${(kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

const LONG_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * A calendar date the API sends as YYYY-MM-DD, as "26 October 2026". Read off
 * the text itself, never through Date and a locale, so the server render and
 * the browser always print the same words. Anything that is not a plain date
 * comes back as null, and the caller leaves the line out.
 */
export function formatLongDate(isoDate: string | null | undefined): string | null {
  const m = isoDate ? /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate) : null;
  if (!m) return null;
  const month = LONG_MONTHS[Number(m[2]) - 1];
  const day = Number(m[3]);
  if (!month || day < 1 || day > 31) return null;
  return `${day} ${month} ${m[1]}`;
}
