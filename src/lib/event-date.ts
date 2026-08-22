import type { WawuEvent } from "@/types/events";

/**
 * Date/time presentation for Events.
 *
 * The backend sends the authoritative instant as ISO 8601 and never renders a
 * local time itself; `timeLabel` and `timezone` are host-supplied DISPLAY
 * strings ("10:00 AM", "WAT"). So the host's own words win wherever they exist,
 * and everything else is derived here.
 *
 * Month and weekday names are spelled out rather than taken from
 * `toLocaleDateString`, deliberately: the container's ICU build and the
 * reader's browser do not always agree on a locale's output, and these strings
 * are rendered on both sides of hydration. Fixed tables cannot drift.
 */

const MONTHS_SHORT = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export interface EventDateParts {
  /** "AUG" — the block's top line. */
  month: string;
  /** "27" — the block's big number. */
  day: string;
  /** "Wednesday". */
  weekday: string;
  /** "27 August 2026". */
  full: string;
}

export function eventDateParts(iso: string): EventDateParts {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { month: "", day: "", weekday: "", full: "" };
  return {
    month: MONTHS_SHORT[d.getMonth()],
    day: String(d.getDate()),
    weekday: WEEKDAYS[d.getDay()],
    full: `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`,
  };
}

/** "6:00 PM" from an instant, when the host gave no `timeLabel` of their own. */
function clockLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const hours24 = d.getHours();
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${hours12}:${minutes} ${hours24 < 12 ? "AM" : "PM"}`;
}

/** "6:00 PM WAT" — the host's own words where they gave any, otherwise derived. */
export function eventTimeLine(event: Pick<WawuEvent, "startsAt" | "timeLabel" | "timezone">): string {
  const time = event.timeLabel?.trim() || clockLabel(event.startsAt);
  const zone = event.timezone?.trim();
  return zone ? `${time} ${zone}` : time;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Within the next seven days. The old app carried this as a `thisWeek` flag on
 * the row; the real contract has no such field, so it is derived from the
 * instant that IS on the contract rather than left off the card.
 */
export function isThisWeek(event: Pick<WawuEvent, "startsAt">): boolean {
  const start = new Date(event.startsAt).getTime();
  if (Number.isNaN(start)) return false;
  const now = Date.now();
  return start >= now && start - now <= 7 * DAY_MS;
}

/** `endsAt ?? startsAt` against now — a two-day summit is still upcoming on its second morning. */
export function hasEnded(event: Pick<WawuEvent, "startsAt" | "endsAt">): boolean {
  const end = new Date(event.endsAt ?? event.startsAt).getTime();
  if (Number.isNaN(end)) return false;
  return end < Date.now();
}

/**
 * ISO 8601 ⇄ the value an `<input type="datetime-local">` reads and writes.
 *
 * The input speaks wall-clock time with no zone, so both directions go through
 * the LOCAL components of a Date — using `toISOString().slice(0,16)` here (the
 * obvious-looking one-liner) would silently shift a Lagos evening event by an
 * hour every time the form was opened.
 */
export function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Returns "" for an unparseable value so the caller can treat it as "not filled in". */
export function fromLocalInputValue(value: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString();
}
