/** A partner service on WAWU. Live = bookable/applyable now; coming = Pro-tier only. */
export type ServiceStatus = "live" | "coming";

export interface PartnerService {
  id: string;
  name: string;
  tagline: string;
  blurb: string;
  icon: string;
  status: ServiceStatus;
  /** e.g. "7–14 days", "2–3 days". */
  turnaround?: string;
  /** e.g. "From ₦25,000". */
  priceFrom?: string;
  /** e.g. "CAC" for the partner. */
  partner?: string;
  /** CTAs for live services. */
  cta?: { label: string; href: string };
  /** Coming-soon blurb details. */
  comingNote?: string;
}

export interface ServiceApplicationTimeline {
  stage: string;
  status: "done" | "current" | "upcoming";
  note: string;
}