import { formatNairaFromKobo } from "@/lib/format";

/**
 * Everything /join says, in one place (owner's redesign, 12 Oct 2026). The
 * words are the owner's example page, with the changes the owner ruled: no
 * date anywhere ("this October"), the conference cities are exactly Lagos,
 * Abuja, Port Harcourt and Enugu plus Online, "creative hubs" with no number,
 * and no unpaid route (everyone pays the pre-registration fee, which covers
 * their verification).
 *
 * The fee that is PAID is never written here: it comes from
 * `GET /waitlist/offers/current` and is drawn from what the API sent. The one
 * figure below, `WAS_PRICE_KOBO`, is the owner's marketing "was" price, the
 * number struck through beside the real fee. It is not a backend price and
 * nothing is charged from it.
 */

/** The owner's marketing figure, struck through beside the real fee ("slashed from ₦10,000"). */
export const WAS_PRICE_KOBO = 1_000_000;
export const WAS_PRICE = formatNairaFromKobo(WAS_PRICE_KOBO);

/** The hero picture the owner is sending. `null` until it arrives: the hero then draws its empty frame. */
export interface HeroImage {
  /** A file at the ROOT of public/ (production serves only root-level files). */
  src: string;
  alt: string;
  width: number;
  height: number;
}
export const HERO_IMAGE: HeroImage | null = null;

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

export const BENEFITS: readonly string[] = [
  "Conference access",
  "Early access to the WHO MADE THIS? platform",
  "Verified for a full year",
  "Founding member status",
  "WAWU Creative Studio AI tools",
  "Global payments",
  "Free training in Arts, Tech, Business and Finance",
  "Access to creative hubs",
];

export const TYPED_NAMES = ["AMAKA", "TUNDE", "ZAINAB", "CHIDI", "FATIMA", "EMEKA", "BOLA", "HALIMA", "YOU"] as const;

export const STEPS: ReadonlyArray<{ title: string; text: string }> = [
  { title: "Pre-register", text: "Two minutes. Your name, WhatsApp, craft and city." },
  { title: "This October", text: "The app goes live. Sign in with the same number. Your profile is already verified." },
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
