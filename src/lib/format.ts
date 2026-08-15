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
 * Creator revenue split rate: 85% standard, 90% for Pro-tier creators.
 * Per docs/01_SPEC.md — never invent another rate.
 */
export function creatorSplitRate(isPro?: boolean): number {
  return isPro ? 0.9 : 0.85;
}
