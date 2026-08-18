/** A partner service on WAWU. Live = bookable/applyable now; coming = Pro-tier only. */
export type ServiceStatus = "live" | "coming";

export interface PartnerService {
  id: string;
  /** Stable routing key ("pay", "pension"). Prefer this over id for links. */
  slug: string;
  name: string;
  tagline: string;
  blurb: string;
  icon: string;
  status: ServiceStatus;
  /** e.g. "7–14 days", "2–3 days". */
  turnaround?: string;
  /** e.g. "From ₦25,000" — build with formatNaira(), never a hardcoded ₦ string. */
  priceFrom?: string;
  /** e.g. "CAC" for the partner. */
  partner?: string;
  /** CTAs for live services. Comes from the backend row. */
  cta?: { label: string; href: string };
  ctaLabel?: string | null;
  ctaHref?: string | null;
  /** Coming-soon blurb details. */
  comingNote?: string;
  /**
   * Carried over from the previous platform, which showed each partner
   * service with who provides it and what you need before applying. Dropping
   * these turned real partner offerings into three lines of marketing.
   */
  eligibility?: string[];
  benefits?: string[];
  /** [label, description] pairs, e.g. ["Apply", "Submit a short request"]. */
  steps?: [string, string][];
}

export interface ServiceApplicationTimeline {
  stage: string;
  status: "done" | "current" | "upcoming";
  note: string;
}

/** A single application a user has in flight or resolved, tracked at /services/applications/:id. */
export type ApplicationStatus = "under_review" | "approved" | "rejected" | "pending";

export interface ApplicationTimelineStep {
  stage: string;
  status: "done" | "current" | "upcoming";
  /** Short display date, e.g. "15 Aug". Omitted for steps that haven't happened yet. */
  date?: string;
  note: string;
}

export interface ServiceApplication {
  id: string;
  kind: "cac" | "nepc" | "mentor";
  title: string;
  subtitle?: string;
  reference: string;
  appliedDate: string;
  status: ApplicationStatus;
  statusLabel: string;
  /** Integer Naira. Undefined for free flows (e.g. mentor requests). */
  amountPaid?: number;
  certificateExpectedBy?: string;
  timeline: ApplicationTimelineStep[];
  /** Present only when status is "rejected". */
  rejection?: { note: string; refunded: boolean };
}

/** A creator's existing CAC-registered business, pulled into the NEPC apply flow. */
export interface CacBusinessRecord {
  businessName: string;
  rcNumber: string;
}