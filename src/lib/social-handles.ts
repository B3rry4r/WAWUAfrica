/**
 * Turning a stored social value into what the edit form should show.
 *
 * Three of these fields are stored as bare handles and one (YouTube) as a full
 * URL, because that is what the API keeps. Dropping a stored URL straight into
 * a field labelled "youtube.com/@" would read as
 * "youtube.com/@https://youtube.com/@name", so the prefix and the value have
 * to be decided together.
 */

/** The canonical address each handle-style field hangs off. */
export const SOCIAL_PREFIX = {
  instagram: "instagram.com/",
  x: "x.com/",
  tiktok: "tiktok.com/@",
  youtube: "youtube.com/@",
} as const;

export type SocialField = keyof typeof SOCIAL_PREFIX;

/**
 * What to put in the box, and whether to show the prefix at all.
 *
 * A canonical value collapses to its handle and keeps the prefix. Anything
 * else - a legacy youtube.com/channel/UC… address, a vanity domain, a link
 * somebody pasted from another country's subdomain - is shown in full with NO
 * prefix, because the prefix would be a lie about where that link goes.
 */
export function socialFieldValue(
  stored: string | undefined,
  field: SocialField,
): { value: string; prefix?: string } {
  const raw = (stored ?? "").trim();
  if (!raw) return { value: "", prefix: SOCIAL_PREFIX[field] };

  const canonical = `https://${SOCIAL_PREFIX[field]}`;
  if (raw.startsWith(canonical)) {
    return { value: raw.slice(canonical.length), prefix: SOCIAL_PREFIX[field] };
  }
  // Some other link: show it whole, unprefixed.
  if (/^https?:\/\//i.test(raw)) return { value: raw };

  // A bare handle, with or without the "@" somebody typed out of habit.
  return { value: raw.replace(/^@+/, ""), prefix: SOCIAL_PREFIX[field] };
}
