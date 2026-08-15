import type { VerificationLevel } from "@/types/account";

export interface Mentor {
  id: string;
  name: string;
  handle: string;
  field: string;
  /** Filter-chip category, e.g. "Agriculture", "Export", "Finance". */
  category: string;
  tagline: string;
  bio: string;
  /**
   * What this mentor can help with. Surfaced as chips on the browse card, the
   * "Ask them about" section on the profile, and as the multi-select in the
   * request sheet.
   */
  topics: string[];
  verification: VerificationLevel;
  /** Free-form schedule text, e.g. "Tuesday and Thursday evenings". */
  availability: string;
  /** All mentor sessions are free — mentors volunteer their time. No `rate` field. */
  openForRequests: boolean;
  /** Set only when `openForRequests` is false, e.g. "September". */
  fullUntil?: string;
  yearsExperience: number;
  sessions: number;
  languages: string[];
}

export interface MentorRequest {
  id: string;
  mentorId: string;
  topics: string[];
  note: string;
  /** Chosen day/time label, e.g. "Tue 19, evening". */
  slot: string;
  status: "sent";
  sentAt: string;
}
