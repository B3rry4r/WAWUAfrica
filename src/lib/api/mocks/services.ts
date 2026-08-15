import type {
  CacBusinessRecord,
  PartnerService,
  ServiceApplication,
  ServiceApplicationTimeline,
} from "@/types/services";
import { formatNaira } from "@/lib/format";
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
    priceFrom: `From ${formatNaira(25000)}`,
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

/** The applicant's own CAC-registered business — NEPC pulls this in automatically. */
export const MOCK_CAC_BUSINESS_RECORD: CacBusinessRecord = {
  businessName: "Okeke Farms Enugu",
  rcNumber: "RC 7742119",
};

/** Per-application tracking records, shown at /services/applications/:id. */
export const MOCK_APPLICATIONS: ServiceApplication[] = [
  {
    id: "wa-cac-40912",
    kind: "cac",
    title: "CAC registration",
    subtitle: MOCK_CAC_BUSINESS_RECORD.businessName,
    reference: "WA-CAC-40912",
    appliedDate: "15 August 2026",
    status: "under_review",
    statusLabel: "Under review",
    amountPaid: 25000,
    certificateExpectedBy: "23 August 2026",
    timeline: [
      { stage: "Submitted", status: "done", date: "15 Aug", note: "Your details and payment are with the agent." },
      { stage: "Under review", status: "current", date: "16–20 Aug", note: "An agent checks your names and documents by hand." },
      { stage: "Certificate ready", status: "upcoming", note: "Your CAC certificate lands on WAWU." },
    ],
  },
  {
    id: "wa-nepc-20441",
    kind: "nepc",
    title: "NEPC export certificate",
    subtitle: MOCK_CAC_BUSINESS_RECORD.businessName,
    reference: "WA-NEPC-20441",
    appliedDate: "2 August 2026",
    status: "approved",
    statusLabel: "Certificate ready",
    timeline: [
      { stage: "Submitted", status: "done", date: "2 Aug", note: "Your export details were with the agent." },
      { stage: "Under review", status: "done", date: "4 Aug", note: "Reviewed by the export desk." },
      { stage: "Certificate ready", status: "done", date: "9 Aug", note: "Download it from your services list." },
    ],
  },
  {
    id: "wa-mentor-8823",
    kind: "mentor",
    title: "Session request",
    subtitle: "Obinna Eze · Export paperwork",
    reference: "WA-MTR-8823",
    appliedDate: "13 August 2026",
    status: "pending",
    statusLabel: "Awaiting reply",
    timeline: [
      { stage: "Request sent", status: "done", date: "13 Aug", note: "Obinna usually replies within two days." },
      { stage: "Mentor responds", status: "current", note: "You'll get a notification either way." },
    ],
  },
  {
    id: "wa-cac-30021",
    kind: "cac",
    title: "CAC registration",
    subtitle: "Earlier attempt",
    reference: "WA-CAC-30021",
    appliedDate: "22 July 2026",
    status: "rejected",
    statusLabel: "Rejected — refunded",
    amountPaid: 25000,
    timeline: [
      { stage: "Submitted", status: "done", date: "22 Jul", note: "Your details and payment were with the agent." },
      { stage: "Under review", status: "done", date: "24 Jul", note: "All three names were already registered." },
      { stage: "Rejected", status: "done", date: "26 Jul", note: "You were not charged for the outcome — refunded in full." },
    ],
    rejection: {
      note: "All three names you gave were already registered with CAC.",
      refunded: true,
    },
  },
];

// SEAM: replace with GET /api/hub/services/applications/:id
export async function getMockApplication(id: string): Promise<ServiceApplication | null> {
  await delay(280);
  return MOCK_APPLICATIONS.find((a) => a.id === id) ?? null;
}

// SEAM: replace with GET /api/hub/services/applications?exclude=:id
export async function getMockOtherApplications(excludeId: string): Promise<ServiceApplication[]> {
  await delay(220);
  return MOCK_APPLICATIONS.filter((a) => a.id !== excludeId);
}

// SEAM: replace with GET /api/hub/services/cac/business
export async function getMockCacBusinessRecord(): Promise<CacBusinessRecord | null> {
  await delay(200);
  return MOCK_CAC_BUSINESS_RECORD;
}

export type ServicePaymentResult = "success" | "payment_failed";

export interface CacApplicationPayload {
  registrationType: "business_name" | "limited_company";
  names: [string, string, string];
  nature: string;
}

export interface CacPaymentResponse {
  result: ServicePaymentResult;
  applicationId: string;
  reference: string;
  amountPaid: number;
  certificateExpectedBy: string;
}

/**
 * Simulates the CAC review + pay round trip in one call, same shape as
 * sendMockTip / sendMockPaidDm. Always succeeds so the happy path is
 * demoable; the UI still renders a failure/retry state if this ever rejects.
 */
// SEAM: replace with POST /api/hub/services/cac/apply (name choices, nature of business + payment)
export async function payMockCacApplication(payload: CacApplicationPayload): Promise<CacPaymentResponse> {
  await delay(900);
  void payload;
  const application = MOCK_APPLICATIONS.find((a) => a.id === "wa-cac-40912")!;
  return {
    result: "success",
    applicationId: application.id,
    reference: application.reference,
    amountPaid: application.amountPaid ?? 25000,
    certificateExpectedBy: application.certificateExpectedBy ?? "",
  };
}

export interface NepcApplicationPayload {
  rcNumber: string;
  exportCategory: string;
  mainProduct: string;
  targetMarkets: string[];
  yearlyVolume: string;
}

export interface NepcSubmitResponse {
  applicationId: string;
  reference: string;
}

// SEAM: replace with POST /api/hub/services/nepc/apply
export async function submitMockNepcApplication(payload: NepcApplicationPayload): Promise<NepcSubmitResponse> {
  await delay(700);
  void payload;
  const application = MOCK_APPLICATIONS.find((a) => a.id === "wa-nepc-20441")!;
  return { applicationId: application.id, reference: application.reference };
}