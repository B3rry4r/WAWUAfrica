/**
 * TGIF: the 365-day scripture and prayer devotional on the home screen.
 *
 * WHY THIS ONE DOES NOT GO THROUGH `apiFetch`. Every other module here talks
 * to the hub, because every other module reads something that changes: a
 * balance, a feed, somebody's profile. This reads a book. All 365 days were
 * written once, shipped with the app, and will read the same in five years as
 * they do today, so there is no server that would know more about them than
 * the bundle does. Putting them behind an endpoint would add a network round
 * trip, a failure mode, and a deploy, to return a constant.
 *
 * It still lives in `src/lib/api/` and screens still call it rather than
 * fetching for themselves, because that rule is about where data access lives,
 * not about who is on the other end of it. If the devotional ever becomes
 * something an admin edits, only this file changes.
 *
 * The year is split into twelve files, one per CALENDAR month, so opening the
 * tab pulls about 25KB rather than the 300KB the whole year weighs. The month
 * is cached after the first read, so moving between days inside it is instant.
 */

export interface TgifEntry {
  /** Day of the month this entry belongs to. */
  d: number;
  /** The verse, exactly as the translation punctuates it. */
  quote: string;
  /** Its reference, e.g. "Romans 8:1 (NIV)". */
  ref: string;
  reality: string;
  remember: string;
  prayer: string;
  takeaway: string;
  /** The 30-day series this day sits in, e.g. "SONS, NOT SLAVES". */
  series: string;
  seriesTheme: string;
  /** Only 31 December has one: the closing note for the year. */
  outro?: string[];
}

interface TgifMonth {
  month: number;
  days: TgifEntry[];
}

const cache = new Map<number, Promise<TgifMonth>>();

function loadMonth(month: number): Promise<TgifMonth> {
  const hit = cache.get(month);
  if (hit) return hit;
  const pending = fetch(`/tgif/${String(month).padStart(2, "0")}.json`).then((res) => {
    if (!res.ok) throw new Error(`Could not load the devotional for month ${month}.`);
    return res.json() as Promise<TgifMonth>;
  });
  // A failed month must not be cached, or the retry button retries nothing.
  pending.catch(() => cache.delete(month));
  cache.set(month, pending);
  return pending;
}

/**
 * The entry for a given date.
 *
 * 29 February reads 28 February's entry. The alternative is to count days from
 * 1 January, which would slide every date after February by one in a leap year
 * and put the Christmas entry on Christmas Eve. The devotional is keyed to the
 * date, so the date is what has to stay fixed.
 */
export async function getTgifEntry(date: Date): Promise<TgifEntry> {
  const month = date.getMonth() + 1;
  const { days } = await loadMonth(month);
  // Only the leap day falls back. Clamping any date to the length of its
  // month would turn a missing 31st into a silent second helping of the
  // 30th, which is the kind of wrong nobody reports because it looks fine.
  const isLeapDay = month === 2 && date.getDate() === 29;
  const dayOfMonth = isLeapDay ? 28 : date.getDate();
  const entry = days.find((e) => e.d === dayOfMonth);
  if (!entry) throw new Error("That day is not in the devotional.");
  return entry;
}

/**
 * Puts the reader's name where the writer left a slot for it.
 *
 * The document is written in the second person and marks every one of its 368
 * personal addresses with `{Name}`. With no name to use, the sentence has to
 * still read as English: "{Name}, your sins are gone" becomes "Your sins are
 * gone", not "friend, your sins are gone", which is worse than not trying.
 */
export function personalise(text: string, firstName: string | null): string {
  if (firstName) return text.replaceAll("{Name}", firstName);
  return text
    .replaceAll(/\{Name\}, ([a-z])/g, (_, c: string) => c.toUpperCase())
    .replaceAll("{Name}", "you");
}

/** The part of a full name a person is actually called by. */
export function firstNameOf(fullName: string | undefined | null): string | null {
  const first = (fullName ?? "").trim().split(/\s+/)[0];
  return first || null;
}
