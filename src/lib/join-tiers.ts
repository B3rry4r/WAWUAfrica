/**
 * The three plans /join sells (JOIN-TIERS-WEB, R-125, owner 2 and 3 Nov 2026).
 * Pure helpers, no runtime imports, so the page and its test read the same rules.
 *
 * Every figure and name comes from the Hub's public `GET /waitlist/tiers`
 * (the app's live plan settings). The words below are the app's own tier-card
 * words (mobile `tierItems()` in src/features/verify/purchaseModel.ts; R-89,
 * R-108, R-112), so a plan reads the same on the page and in the app. Nothing
 * here is a price.
 */

/** One plan as `GET /waitlist/tiers` sends it. */
export interface WaitlistTier {
  id: string;
  name: string;
  /** What the plan costs on /join, in whole kobo: the app's live price. */
  priceKobo: number;
  /** How long it lasts, in days. */
  days: number;
  /** Products it lets a person publish. */
  products: number;
  /** Bonus points the plan adds. */
  bonusPoints: number;
  eventPass: { id: string; name: string; benefits?: string[] | null } | null;
  /** `numbered` is Founding's numbered badge. */
  badge: { id: string; numbered: boolean } | null;
  /** Extra points on points packs bought on this plan, in percent. */
  packBonusPercent: number;
  firstVoiceIntroIncluded?: boolean;
  /** The Hub's "Best" plan: the one the page starts on. */
  best: boolean;
}

export interface WaitlistTiers {
  currency: "NGN";
  tiers: WaitlistTier[];
  bestTier: string | null;
}

/** "12 months" for a year's worth of days, else the days (the app's `lastsText`). */
export function lengthOf(days: number): string {
  const months = Math.round(days / 30.4375);
  if (months >= 2 && Math.abs(months * 30.4375 - days) < 6) return `${months} months`;
  return days === 1 ? "1 day" : `${days} days`;
}

/** "4 products", "1 product". */
export function productsOf(count: number): string {
  return `${count} ${count === 1 ? "product" : "products"}`;
}

/** "600 points", "1,240 points", "1 point". */
export function pointsOf(count: number): string {
  const whole = Math.max(0, Math.floor(Number.isFinite(count) ? count : 0));
  return `${String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ",")} ${whole === 1 ? "point" : "points"}`;
}

/** The small line under a plan's price: "a year" for 365 days, "a month" for 30, else "for <length>". */
export function periodOf(days: number): string {
  if (days >= 360 && days <= 370) return "a year";
  if (days >= 28 && days <= 31) return "a month";
  return `for ${lengthOf(days)}`;
}

const firstWord = (name: string): string => name.trim().split(/\s+/)[0] ?? name;

/**
 * What a plan gives, one line each, in the order the app's tier card draws
 * them: length, products, points, event pass, then (when the plan carries
 * them) the numbered badge and the bonus on points packs. A part the Hub does
 * not give is not listed.
 */
export function tierItems(tier: WaitlistTier): string[] {
  return [
    lengthOf(tier.days),
    productsOf(tier.products),
    tier.bonusPoints > 0 ? pointsOf(tier.bonusPoints) : null,
    tier.eventPass?.name ?? null,
    tier.badge?.numbered ? `Numbered ${firstWord(tier.name)} badge` : null,
    tier.packBonusPercent > 0 ? `${tier.packBonusPercent}% bonus on points packs` : null,
  ].filter((item): item is string => Boolean(item));
}

/** The plan the page starts on: the Hub's "Best" one, else the first. */
export function startingTier(all: WaitlistTiers): WaitlistTier | null {
  return all.tiers.find((t) => t.id === all.bestTier) ?? all.tiers.find((t) => t.best) ?? all.tiers[0] ?? null;
}

/** The cheapest plan's price in kobo (the "from" figure), or null when there are none. */
export function fromKobo(tiers: readonly WaitlistTier[]): number | null {
  return tiers.length === 0 ? null : Math.min(...tiers.map((t) => t.priceKobo));
}
