import type { PartnerService, ServiceApplicationTimeline } from "@/types/services";
import { delay } from "../client";

export const MOCK_SERVICES: PartnerService[] = [
  {
    id: "cac",
    name: "CAC registration",
    tagline: "Register your business in Nigeria",
    blurb:
      "WAWU works with a registered agent to file your CAC business registration for you. You upload your details, an agent reviews them by hand, and your certificate lands on WAWU.",
    icon: "Stamp",
    status: "live",
    turnaround: "7–14 days",
    priceFrom: "From ₦25,000",
    partner: "CAC",
    cta: { label: "Apply now", href: "/services/cac/apply" },
  },
  {
    id: "nepc",
    name: "NEPC export support",
    tagline: "Start exporting from Nigeria",
    blurb:
      "Guidance for creators who want to sell their work abroad. An agent walks you through documentation and connects you with the right NEPC desk.",
    icon: "Ship",
    status: "live",
    turnaround: "3–5 days to first reply",
    priceFrom: "Free to start",
    partner: "NEPC",
    cta: { label: "Start now", href: "/services/nepc/apply" },
  },
  {
    id: "mentors",
    name: "Mentors",
    tagline: "One-to-one sessions with seasoned creators",
    blurb:
      "Book a 45-minute call with a creator who has already done what you're trying to do. Each mentor sets their own rate.",
    icon: "Users",
    status: "live",
    turnaround: "Same-week booking",
    partner: "WAWU",
    cta: { label: "Browse mentors", href: "/services/mentors" },
  },
  {
    id: "health-insurance",
    name: "Health insurance",
    tagline: "Plans designed for creators",
    blurb:
      "Affordable health cover arranged through licensed insurers — built for people whose income comes in irregularly.",
    icon: "HeartPulse",
    status: "coming",
    comingNote: "Pro members get first access when this launches.",
  },
  {
    id: "pension",
    name: "Pension",
    tagline: "Retirement you can actually keep",
    blurb:
      "A pension plan that moves with you, even when your income doesn't show a fixed salary.",
    icon: "PiggyBank",
    status: "coming",
    comingNote: "Pro members get first access when this launches.",
  },
  {
    id: "banking",
    name: "Banking",
    tagline: "A business account that works with WAWU",
    blurb:
      "A simple business bank account that wires your WAWU earnings straight where you need them.",
    icon: "Landmark",
    status: "coming",
    comingNote: "Pro members get first access when this launches.",
  },
  {
    id: "grants-funding",
    name: "Grants and funding",
    tagline: "Matches for money that doesn't ask to be repaid",
    blurb:
      "We surface grants, competitions and funding calls that fit your work — and help you apply.",
    icon: "HandCoins",
    status: "coming",
    comingNote: "Pro members get first access when this launches.",
  },
];

export const MOCK_CAC_TIMELINE: ServiceApplicationTimeline[] = [
  { stage: "Application submitted", status: "current", note: "Your details are with the agent." },
  { stage: "Document review", status: "upcoming", note: "An agent checks your documents by hand." },
  { stage: "Name and details filed", status: "upcoming", note: "Filed with the Corporate Affairs Commission." },
  { stage: "Certificate issued", status: "upcoming", note: "Your CAC certificate lands on WAWU." },
];

// SEAM: replace with GET /api/hub/services
export async function getMockServices(): Promise<PartnerService[]> {
  await delay(280);
  return MOCK_SERVICES;
}

// SEAM: replace with GET /api/hub/services/:id
export async function getMockService(id: string): Promise<PartnerService | null> {
  await delay(250);
  return MOCK_SERVICES.find((s) => s.id === id) ?? null;
}

// SEAM: replace with GET /api/hub/services/cac/timeline
export async function getMockCacTimeline(): Promise<ServiceApplicationTimeline[]> {
  await delay(250);
  return MOCK_CAC_TIMELINE;
}

// SEAM: replace with POST /api/hub/services/:id/notify
export async function notifyMockComingSoon(id: string): Promise<boolean> {
  await delay(400);
  void id;
  return true;
}