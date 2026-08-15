import type { CreatorTier } from "@/types/account";

/**
 * Courses are WAWU's curated catalogue but run on an external partner. There is
 * no in-app player and no per-course Naira price — see docs/01_SPEC.md. WAWU
 * only tracks the entitlement (a free-course slot) and hands off for playback.
 */
export const COURSE_HOST = "Alison";

export interface LearnCourse {
  id: string;
  title: string;
  category: string;
  /** Course length, in hours, as shown on Alison. */
  hours: number;
  certificate: boolean;
  overview: string;
  whatItCovers: string[];
}

export interface Playbook {
  id: string;
  title: string;
  pages: number;
  format: string;
  description: string;
  chapters: { title: string; pages: string }[];
  downloadCount: number;
  /** Powers the in-app "Read here" view — one entry per chapter. */
  readingSections: { heading: string; body: string }[];
}

export type LearnGuideKind = "country" | "article" | "template";

interface LearnGuideBase {
  id: string;
  kind: LearnGuideKind;
  title: string;
  /** e.g. "Updated July" */
  updated: string;
}

export interface CountryGuide extends LearnGuideBase {
  kind: "country";
  country: string;
  /** Row subtitle on the country-guide list, e.g. "ECOWAS · no duty on most produce". */
  subtitle: string;
  readMinutes: number;
  dutyLabel: string;
  dutyCaption: string;
  borderDaysLabel: string;
  borderDaysCaption: string;
  whyFirstHeading: string;
  whyFirstBody: string;
  whatYouNeed: string[];
  crossSell: { heading: string; body: string; href: string; label: string };
}

export interface ReferenceArticle extends LearnGuideBase {
  kind: "article";
  readMinutes: number;
  summary: string;
  sections: { heading: string; body: string }[];
}

export interface TemplatePack extends LearnGuideBase {
  kind: "template";
  fileCount: number;
  description: string;
}

export type LearnGuide = CountryGuide | ReferenceArticle | TemplatePack;

/**
 * Basic tier → 1 free course. Pro tier → up to 3, of your choice. This is a
 * subscription-tier PERK, not a purchase — there is no wallet, no price, and
 * spending a slot never touches Naira. Locked split (docs/01_SPEC.md).
 */
export interface LearnEntitlement {
  tier: CreatorTier;
  /** False for a plain user account — the perk belongs to the creator subscription. */
  isCreator: boolean;
  freeCoursesTotal: number;
  freeCoursesUsed: number;
  freeCoursesRemaining: number;
  /** Course ids already spent against this entitlement. */
  enrolledCourseIds: string[];
  /** 0–100 per enrolled course id, when known. */
  progressByCourseId: Record<string, number>;
  canDownloadPlaybook: boolean;
}

export type CourseEntitlementState =
  | { status: "enrolled"; progressPct: number | null }
  | { status: "available" }
  | { status: "exhausted" };
