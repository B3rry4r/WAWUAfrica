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
    id: "pay",
    slug: "pay",
    name: "Bills Payment",
    tagline: "Airtime, data, electricity and cable",
    blurb:
      "Pay any bill without leaving WAWU. Confirm the meter or number first, pay with your card, and the top-up lands straight away.",
    icon: "Zap",
    status: "coming",
    comingNote: "Bills payment is paused for now.",
  },
  {
    id: "legal",
    slug: "legal",
    name: "Legal",
    tagline: "Filings without a lawyer, lawyers when you need one",
    blurb:
      "Register a business, file your tax or NDPR return with no lawyer call at all. For contracts, trademarks and entertainment law, book a consultation.",
    icon: "Scale",
    status: "live",
    turnaround: "Consultation within days",
    priceFrom: `Consultations from ${formatNaira(25000)}`,
    cta: { label: "Browse legal services", href: "/services/legal" },
  },
  {
    id: "loans",
    slug: "loans",
    name: "Loans/EasyBuy",
    tagline: "Spread the cost over instalments",
    blurb:
      "Finance a phone, laptop or equipment and pay it back monthly instead of all at once.",
    icon: "Smartphone",
    status: "live",
    turnaround: "Reviewed in 3 to 5 days",
    priceFrom: "Pay in 3 to 12 instalments",
    eligibility: [
      "Verified WAWUAfrica account",
      "Valid government ID",
      "Proof of income or 3 month bank statement",
    ],
    benefits: [
      "Pay in 3 to 12 monthly instalments",
      "No paperwork beyond your WAWU ID",
      "Approved items delivered to you",
      "Build a repayment track record",
    ],
    cta: { label: "Apply now", href: "/services/loans/apply" },
  },
  {
    id: "care",
    slug: "care",
    name: "Telemedicine",
    tagline: "See a doctor, get covered",
    blurb:
      "Virtual consultations with licensed doctors, medication cover and screening, paid monthly rather than yearly.",
    icon: "Stethoscope",
    status: "coming",
    partner: "WellaHealth",
    comingNote: "We are finishing the partner rollout. It opens here first.",
  },
  {
    id: "pension",
    slug: "pension",
    name: "Pensions",
    tagline: "Micro-pension access",
    blurb:
      "Start a micro-pension and save towards retirement, even with irregular income.",
    icon: "PiggyBank",
    status: "live",
    turnaround: "Reviewed in 3 to 5 days",
    priceFrom: "No upfront cost",
    partner: "ARM Pension",
    eligibility: ["Verified WAWUAfrica account", "Valid government ID"],
    benefits: [
      "Flexible contributions",
      "Withdraw a portion when needed",
      "Long term retirement savings",
      "Professionally managed funds",
    ],
    cta: { label: "Apply now", href: "/services/pension/apply" },
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
    statusLabel: "Rejected, refunded",
    amountPaid: 25000,
    timeline: [
      { stage: "Submitted", status: "done", date: "22 Jul", note: "Your details and payment were with the agent." },
      { stage: "Under review", status: "done", date: "24 Jul", note: "All three names were already registered." },
      { stage: "Rejected", status: "done", date: "26 Jul", note: "You were not charged for the outcome, refunded in full." },
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
  /** Object-storage URLs for the uploaded supporting documents. */
  documents?: string[];
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