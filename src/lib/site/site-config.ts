/**
 * The brand site's facts in one place (BRAND-SITE, owner 2 Nov 2026).
 *
 * No imports: scripts/check-site-mode.mjs loads this file as it stands (Node
 * strips the types) to prove every link the site draws lands on an open page.
 */

export const SITE_URL = "https://wawuafrica.com";
export const COMPANY = "WAWU Technology Ltd";
export const CONTACT_EMAIL = "support@wawuafrica.com";
export const WHATSAPP_DISPLAY = "+234 705 072 2222";
export const WHATSAPP_URL = "https://wa.me/2347050722222";

/** Where every Who Made This link and button on this site goes (R-141, owner, 12 Nov 2026). */
export const WMT_HREF = "https://usewmt.com";

/** Where every VOICES link and button on this site goes: the live VOICES web app. */
export const VOICES_HREF = "https://usevoices.com";

export interface SiteLink {
  label: string;
  href: string;
}

/** The pages of the brand site, in the order the sitemap lists them. */
export const SITE_PAGES: readonly SiteLink[] = [
  { label: "Home", href: "/" },
  { label: "VOICES", href: "/voices" },
  { label: "About", href: "/about" },
  { label: "Partners", href: "/partners" },
  { label: "Press", href: "/press" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

/** The header's links (the Who Made This button beside them is the one link to that app). Press and Careers live in the footer. */
export const HEADER_NAV: readonly SiteLink[] = [
  { label: "VOICES", href: "/voices" },
  { label: "About", href: "/about" },
  { label: "Partners", href: "/partners" },
  { label: "Contact", href: "/contact" },
];

export const FOOTER_APPS: readonly SiteLink[] = [
  { label: "Join Who Made This", href: WMT_HREF },
  { label: "Join VOICES", href: VOICES_HREF },
  { label: "About VOICES", href: "/voices" },
];

export const FOOTER_COMPANY: readonly SiteLink[] = [
  { label: "About", href: "/about" },
  { label: "Partners", href: "/partners" },
  { label: "Careers", href: "/careers" },
  { label: "Press", href: "/press" },
  { label: "Contact", href: "/contact" },
];

/** The existing legal pages: the nine documents under /legal and the master terms. */
export const FOOTER_LEGAL: readonly SiteLink[] = [
  { label: "Privacy", href: "/legal/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "All legal documents", href: "/legal" },
];

export const CONFERENCE_CITIES: readonly string[] = ["Lagos", "Abuja", "Port Harcourt"];
