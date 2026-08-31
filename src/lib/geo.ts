/**
 * Countries and their first-level subdivisions.
 *
 * ── WHY THIS EXISTS ────────────────────────────────────────────────────────
 * Sign-up carried its own list of three countries — Nigeria with 7 of its 37
 * states, Kenya with 2 of its 47 counties, and Ghana with an EMPTY array, so
 * choosing Ghana opened a dropdown containing nothing and the form could not
 * be completed. KYC carried a second, different list of 23 countries with no
 * subdivisions at all, and the shop checkout a third of Nigerian states only.
 * Three lists, none agreeing, one of them a dead end.
 *
 * ── THE RULE THAT MATTERS ──────────────────────────────────────────────────
 * A country with no subdivision list here is NOT a bug and must NOT render an
 * empty dropdown. `subdivisionsFor()` returns an empty array and the caller is
 * expected to fall back to a free-text input — see `SUBDIVISION_LABEL` for
 * what to call it. Somebody in a country we have not enumerated must still be
 * able to finish signing up.
 *
 * The backend stores `country` and `state` as free-text strings, so this list
 * is a convenience for the person filling the form, never a validation gate.
 * Adding a country here cannot break a stored record.
 */

/** Nigeria's 36 states plus the Federal Capital Territory. */
const NIGERIA = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue",
  "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu",
  "Federal Capital Territory", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun",
  "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe",
  "Zamfara",
];

/** Ghana's 16 regions. Previously an empty array, which was a dead end. */
const GHANA = [
  "Ahafo", "Ashanti", "Bono", "Bono East", "Central", "Eastern",
  "Greater Accra", "North East", "Northern", "Oti", "Savannah", "Upper East",
  "Upper West", "Volta", "Western", "Western North",
];

/** Kenya's 47 counties. */
const KENYA = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo-Marakwet", "Embu", "Garissa",
  "Homa Bay", "Isiolo", "Kajiado", "Kakamega", "Kericho", "Kiambu", "Kilifi",
  "Kirinyaga", "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia", "Lamu",
  "Machakos", "Makueni", "Mandera", "Marsabit", "Meru", "Migori", "Mombasa",
  "Murang'a", "Nairobi", "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua",
  "Nyeri", "Samburu", "Siaya", "Taita-Taveta", "Tana River", "Tharaka-Nithi",
  "Trans Nzoia", "Turkana", "Uasin Gishu", "Vihiga", "Wajir", "West Pokot",
];

/** South Africa's 9 provinces. */
const SOUTH_AFRICA = [
  "Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo",
  "Mpumalanga", "North West", "Northern Cape", "Western Cape",
];

/**
 * The countries a person may choose.
 *
 * Nigeria first because it is where most of this product's users are, then
 * the rest alphabetically. "Other" is last and deliberate: a list of
 * countries is always incomplete, and somebody outside it must still be able
 * to finish signing up.
 */
export const COUNTRIES: readonly string[] = [
  "Nigeria",
  "Benin", "Botswana", "Cameroon", "Côte d'Ivoire", "Egypt", "Ethiopia",
  "Gambia", "Ghana", "Guinea", "Kenya", "Liberia", "Malawi", "Mali",
  "Morocco", "Mozambique", "Namibia", "Niger", "Rwanda", "Senegal",
  "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan",
  "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe",
  "Canada", "France", "Germany", "Ireland", "Netherlands",
  "United Arab Emirates", "United Kingdom", "United States",
  "Other",
];

/** Only the countries whose subdivisions are actually enumerated. */
const SUBDIVISIONS: Record<string, string[]> = {
  Nigeria: NIGERIA,
  Ghana: GHANA,
  Kenya: KENYA,
  "South Africa": SOUTH_AFRICA,
};

/**
 * What the country calls its first-level subdivision.
 *
 * Asking a Kenyan for their "state" or a Ghanaian for their "province" reads
 * as a form written by somebody who has not thought about them. The default is
 * the neutral "State or region", which is true everywhere.
 */
export const SUBDIVISION_LABEL: Record<string, string> = {
  Nigeria: "State",
  Ghana: "Region",
  Kenya: "County",
  "South Africa": "Province",
};

export function subdivisionLabelFor(country: string): string {
  return SUBDIVISION_LABEL[country] ?? "State or region";
}

/**
 * The subdivisions of a country, or an empty array when we have not
 * enumerated them.
 *
 * An empty array means "let them type it", NOT "show an empty dropdown".
 */
export function subdivisionsFor(country: string): string[] {
  return SUBDIVISIONS[country] ?? [];
}

/** Whether this country has a list to choose from at all. */
export function hasSubdivisions(country: string): boolean {
  return subdivisionsFor(country).length > 0;
}
