/**
 * Everything /join says that is not a plan (owner's redesign, 12 Oct 2026; the plans
 * are JOIN-TIERS, R-125, 2 and 3 Nov 2026). The words are the owner's example page, with
 * the changes the owner ruled: no date anywhere ("this October"), the conference cities
 * are exactly Lagos, Abuja, Port Harcourt and Enugu plus Online, and "creative hubs"
 * with no number.
 *
 * No price is written here. The three plans, their prices and what each gives come from
 * `GET /waitlist/tiers` (src/lib/api/waitlist.ts, src/lib/join-tiers.ts), the app's live
 * figures. There is no "was" price: the old struck-through figure is gone, and a price is
 * struck through only when a referral code applies to the plan picked.
 */

/** The hero picture: the owner's conference poster (12 Oct 2026), a 1200 by 1500 WebP copy of the original, 4:5 like its frame. */
export interface HeroImage {
  /** A file at the ROOT of public/ (production serves only root-level files), listed in scripts/check-site-mode.mjs. */
  src: string;
  alt: string;
  width: number;
  height: number;
}
export const HERO_IMAGE: HeroImage | null = {
  src: "/who-made-this-conference.webp",
  alt: "The WAWU conference poster. Who made this? Put your Name on it. Lagos, Abuja, Enugu and Port Harcourt, for builders, creators, founders, innovators and culture makers.",
  width: 1200,
  height: 1500,
};

/** The conference locations, in the owner's order. "Online" is the fifth. */
export const CONFERENCE_CITIES = ["Lagos", "Abuja", "Port Harcourt", "Enugu"] as const;
export const ONLINE = "Online";
export const CITY_CHOICES: readonly string[] = [...CONFERENCE_CITIES, ONLINE];

/** What the person makes or does: the same thirteen words the backend accepts. */
export const CRAFT_CHOICES: readonly string[] = [
  "Music",
  "Fashion",
  "Film and video",
  "Photography",
  "Art",
  "Design",
  "Food",
  "Digital art",
  "Tech and software",
  "Writing and media",
  "Professional services",
  "Founder or business",
  "Other",
];

export const TYPED_NAMES = ["AMAKA", "TUNDE", "ZAINAB", "CHIDI", "FATIMA", "EMEKA", "BOLA", "HALIMA", "YOU"] as const;

export const STEPS: ReadonlyArray<{ title: string; text: string }> = [
  { title: "Pre-register", text: "Two minutes. Your name, WhatsApp, craft and city." },
  { title: "This October", text: "The app goes live. Sign in with the same email or phone number. Your plan is waiting." },
  { title: "Make it", text: "Build your profile, upload your work, use the Creative Studio and get paid." },
  { title: "Take the stage", text: "Show up in your city. Put your name on it, in front of everyone." },
];

export const WHO = ["Creators", "Founders", "Artists", "Innovators", "Builders", "Culture makers"] as const;

/** Sponsorship and support, on WhatsApp. */
export const WHATSAPP_NUMBER = "2347050722222";
export const WHATSAPP_DISPLAY = "+234 705 072 2222";
export const SPONSOR_MESSAGE = "Hi WAWU, I would like to sponsor the PUT YOUR NAME ON IT conference.";

export const SHARE_TEXT =
  "PUT YOUR NAME ON IT. I just pre-registered for the conference and WHO MADE THIS?, the platform for creators and professionals. Join me:";

/** The id of the section that holds the form: every call to action points at it. */
export const FORM_ID = "reserve";
