import type { CountryGuide, LearnCourse, LearnGuide, Playbook, ReferenceArticle } from "@/types/learn";
import { delay } from "../client";

export const MOCK_COURSES: LearnCourse[] = [
  {
    id: "c-bookkeeping",
    externalHostUrl: "https://alison.com/course/c-bookkeeping",
    title: "Bookkeeping for small business",
    category: "Business",
    hours: 8,
    certificate: true,
    overview:
      "Cash books, ledgers, and knowing at a glance whether the month made money. Built for a business with no accountant.",
    whatItCovers: [
      "Daily cash book, by hand or on a phone",
      "Separating your money from the business money",
      "Reading a profit figure you can trust",
    ],
  },
  {
    id: "c-marketing",
    externalHostUrl: "https://alison.com/course/c-marketing",
    title: "Digital marketing basics",
    category: "Marketing",
    hours: 6,
    certificate: true,
    overview: "Getting found on WhatsApp, Instagram and search, without paying for ads you can't measure.",
    whatItCovers: [
      "Writing a bio and catalogue that convert",
      "Posting on a schedule you can actually keep",
      "Reading engagement without guessing",
    ],
  },
  {
    id: "c-export-docs",
    externalHostUrl: "https://alison.com/course/c-export-docs",
    title: "Export documentation",
    category: "Trade",
    hours: 10,
    certificate: true,
    overview: "The paperwork side of selling abroad, certificates, invoices and customs forms, done right the first time.",
    whatItCovers: [
      "Certificates of origin and phytosanitary paperwork",
      "Commercial invoices that clear customs",
      "Choosing the right shipping and Incoterms",
    ],
  },
  {
    id: "c-customer-service",
    externalHostUrl: "https://alison.com/course/c-customer-service",
    title: "Customer service that keeps people",
    category: "Business",
    hours: 4,
    certificate: true,
    overview: "Turning a one-time buyer into a repeat customer, on WhatsApp and in your DMs.",
    whatItCovers: [
      "Response times that build trust",
      "Handling a complaint without losing the sale",
      "Asking for a repeat order without being pushy",
    ],
  },
  {
    id: "c-ankara-brand",
    externalHostUrl: "https://alison.com/course/c-ankara-brand",
    title: "Building an ankara brand",
    category: "Fashion",
    hours: 5,
    certificate: true,
    overview: "Turn a tote-bag hustle into a recognisable fashion brand Nigerians trust.",
    whatItCovers: [
      "Positioning and pricing",
      "Phone photography that sells",
      "Handling made-to-order demand",
    ],
  },
  {
    id: "c-pricing-creators",
    externalHostUrl: "https://alison.com/course/c-pricing-creators",
    title: "Pricing for creators",
    category: "Creator business",
    hours: 4,
    certificate: true,
    overview: "Charge what your work is worth, for content, DMs and custom orders.",
    whatItCovers: [
      "Set your own rates",
      "Bundle without discounting your worth",
      "Handle haggling gracefully",
    ],
  },
];

export const MOCK_PLAYBOOK: Playbook = {
  id: "pb-business",
  title: "The WAWU Business Playbook",
  pages: 96,
  format: "PDF",
  downloadCount: 8412,
  description:
    "Everything WAWU knows about running a small business in Nigeria, written down once. Free to everybody, tier or no tier.",
  chapters: [
    { title: "Registering, and why it pays for itself", pages: "1–14" },
    { title: "Pricing so you actually make money", pages: "15–29" },
    { title: "Books, records, and tax without fear", pages: "30–58" },
    { title: "Getting paid, and chasing what you are owed", pages: "59–78" },
    { title: "Selling beyond your own street", pages: "79–96" },
  ],
  readingSections: [
    {
      heading: "Registering, and why it pays for itself",
      body:
        "A CAC registration costs less than a week of sales and opens doors a personal account never will: business bank accounts, supplier credit, and buyers who ask for a receipt. Do it before you need it, not after a customer asks.",
    },
    {
      heading: "Pricing so you actually make money",
      body:
        "Cost your materials, your time and your platform fees before you set a number, then round up. Undercharging is the single most common reason small businesses on WAWU stall out in the first year.",
    },
    {
      heading: "Books, records, and tax without fear",
      body:
        "A daily cash book, even a paper one, is the difference between knowing your month made money and hoping it did. Keep receipts. Keep them separate from your personal spending. That is most of what tax time needs from you.",
    },
    {
      heading: "Getting paid, and chasing what you are owed",
      body:
        "Ask for a deposit on custom work. Put your terms in writing before you start, even if it's a WhatsApp message. Chasing an unpaid invoice is easier when there was a clear agreement to point back to.",
    },
    {
      heading: "Selling beyond your own street",
      body:
        "Ghana and other ECOWAS markets are the cheapest first export a Nigerian seller can make, little or no duty, and a fair rehearsal for the paperwork harder markets will ask for later. Start with the country guides.",
    },
  ],
};

const NEPC_CROSS_SELL = {
  heading: "Need the certificate?",
  body: "NEPC export support runs inside WAWU, free to start, 3 to 5 days to first reply.",
  href: "/services/nepc/apply",
  label: "Apply for NEPC",
} as const;

const COUNTRY_GUIDES: CountryGuide[] = [
  {
    id: "g-gh",
    kind: "country",
    country: "Ghana",
    title: "Selling into Ghana",
    updated: "Updated July",
    subtitle: "ECOWAS · no duty on most produce",
    readMinutes: 6,
    dutyLabel: "0%",
    dutyCaption: "Duty on produce",
    borderDaysLabel: "3–5 days",
    borderDaysCaption: "Border clearance",
    whyFirstHeading: "Why Ghana first",
    whyFirstBody:
      "Ghana is inside ECOWAS with Nigeria, so most agricultural goods cross without duty. It is the cheapest first export a Nigerian producer can make, and the paperwork is a fair rehearsal for harder markets.",
    whatYouNeed: [
      "CAC registration and NEPC certificate",
      "ECOWAS certificate of origin",
      "Phytosanitary certificate for plants",
    ],
    crossSell: NEPC_CROSS_SELL,
  },
  {
    id: "g-uk",
    kind: "country",
    country: "United Kingdom",
    title: "Selling into the United Kingdom",
    updated: "Updated June",
    subtitle: "Phytosanitary certificate required",
    readMinutes: 7,
    dutyLabel: "0–12%",
    dutyCaption: "Duty by category",
    borderDaysLabel: "5–8 days",
    borderDaysCaption: "Border clearance",
    whyFirstHeading: "Why the UK is worth the paperwork",
    whyFirstBody:
      "A large, English-speaking diaspora market with strong demand for Nigerian food and craft goods, the market is real, but every plant or food shipment needs a phytosanitary certificate issued before departure.",
    whatYouNeed: [
      "CAC registration and NEPC certificate",
      "Phytosanitary certificate for plant or food goods",
      "UK importer of record on the other end",
    ],
    crossSell: NEPC_CROSS_SELL,
  },
  {
    id: "g-us",
    kind: "country",
    country: "United States",
    title: "Selling into the United States",
    updated: "Updated June",
    subtitle: "FDA registration for food",
    readMinutes: 8,
    dutyLabel: "0–15%",
    dutyCaption: "Duty by category",
    borderDaysLabel: "6–10 days",
    borderDaysCaption: "Border clearance",
    whyFirstHeading: "Why the US takes longer",
    whyFirstBody:
      "Food products need FDA facility registration before they can enter the country, plan for it early, since it is the single step most first-time exporters miss and get held up on at the border.",
    whatYouNeed: [
      "CAC registration and NEPC certificate",
      "FDA facility registration for food items",
      "Commercial invoice matching the shipment exactly",
    ],
    crossSell: NEPC_CROSS_SELL,
  },
  {
    id: "g-za",
    kind: "country",
    country: "South Africa",
    title: "Selling into South Africa",
    updated: "Updated May",
    subtitle: "SADC rules, import permit",
    readMinutes: 6,
    dutyLabel: "5–20%",
    dutyCaption: "Duty by category",
    borderDaysLabel: "5–7 days",
    borderDaysCaption: "Border clearance",
    whyFirstHeading: "Why South Africa needs a permit first",
    whyFirstBody:
      "South Africa is outside ECOWAS, so an import permit on the receiving end has to be arranged before goods ship, line this up with your buyer before you commit to a date.",
    whatYouNeed: [
      "CAC registration and NEPC certificate",
      "South African import permit (buyer-side)",
      "Certificate of origin",
    ],
    crossSell: NEPC_CROSS_SELL,
  },
  {
    id: "g-ke",
    kind: "country",
    country: "Kenya",
    title: "Selling into Kenya",
    updated: "Updated May",
    subtitle: "KEBS standards mark",
    readMinutes: 6,
    dutyLabel: "0–10%",
    dutyCaption: "Duty by category",
    borderDaysLabel: "4–6 days",
    borderDaysCaption: "Border clearance",
    whyFirstHeading: "Why Kenya asks for a standards mark",
    whyFirstBody:
      "Most consumer goods need a KEBS conformity mark before they can be sold in Kenya. Build the lead time for certification into your first shipment rather than your second.",
    whatYouNeed: [
      "CAC registration and NEPC certificate",
      "KEBS conformity mark",
      "Certificate of origin",
    ],
    crossSell: NEPC_CROSS_SELL,
  },
  {
    id: "g-ae",
    kind: "country",
    country: "United Arab Emirates",
    title: "Selling into the United Arab Emirates",
    updated: "Updated April",
    subtitle: "Halal certification for food",
    readMinutes: 7,
    dutyLabel: "0–5%",
    dutyCaption: "Duty by category",
    borderDaysLabel: "5–9 days",
    borderDaysCaption: "Border clearance",
    whyFirstHeading: "Why the UAE is a low-duty, high-standard market",
    whyFirstBody:
      "Duty is low across most categories, but food products need halal certification and clear labelling, get this sorted before your first shipment, not after it's held at port.",
    whatYouNeed: [
      "CAC registration and NEPC certificate",
      "Halal certification for food items",
      "Arabic-English bilingual labelling",
    ],
    crossSell: NEPC_CROSS_SELL,
  },
  {
    id: "g-ca",
    kind: "country",
    country: "Canada",
    title: "Selling into Canada",
    updated: "Updated April",
    subtitle: "CFIA import declaration",
    readMinutes: 7,
    dutyLabel: "0–8%",
    dutyCaption: "Duty by category",
    borderDaysLabel: "6–9 days",
    borderDaysCaption: "Border clearance",
    whyFirstHeading: "Why Canada wants a CFIA declaration",
    whyFirstBody:
      "Food and agricultural goods need a CFIA import declaration on file before they land. It is a paperwork step, not a rejection risk, as long as it is filed ahead of the shipment.",
    whatYouNeed: [
      "CAC registration and NEPC certificate",
      "CFIA import declaration",
      "Certificate of origin",
    ],
    crossSell: NEPC_CROSS_SELL,
  },
  {
    id: "g-ug",
    kind: "country",
    country: "Uganda",
    title: "Selling into Uganda",
    updated: "Updated March",
    subtitle: "EAC common market, light duty",
    readMinutes: 5,
    dutyLabel: "0–5%",
    dutyCaption: "Duty on most goods",
    borderDaysLabel: "4–7 days",
    borderDaysCaption: "Border clearance",
    whyFirstHeading: "Why Uganda is an easy second market",
    whyFirstBody:
      "Regional trade agreements keep duty light on most goods moving within East Africa. Freight is the real cost here, not paperwork.",
    whatYouNeed: [
      "CAC registration and NEPC certificate",
      "Certificate of origin",
      "Standard commercial invoice",
    ],
    crossSell: NEPC_CROSS_SELL,
  },
  {
    id: "g-dz",
    kind: "country",
    country: "Algeria",
    title: "Selling into Algeria",
    updated: "Updated March",
    subtitle: "Import licensing, longer clearance",
    readMinutes: 6,
    dutyLabel: "15–30%",
    dutyCaption: "Duty by category",
    borderDaysLabel: "10–14 days",
    borderDaysCaption: "Border clearance",
    whyFirstHeading: "Why Algeria takes patience",
    whyFirstBody:
      "Import licensing and higher duty make Algeria a slower, later-stage market, worth it for the right product, but plan for longer clearance times than West or East African routes.",
    whatYouNeed: [
      "CAC registration and NEPC certificate",
      "Algerian import licence (buyer-side)",
      "Certificate of origin",
    ],
    crossSell: NEPC_CROSS_SELL,
  },
  {
    id: "g-ma",
    kind: "country",
    country: "Morocco",
    title: "Selling into Morocco",
    updated: "Updated February",
    subtitle: "Free-trade routes for some goods",
    readMinutes: 6,
    dutyLabel: "0–17.5%",
    dutyCaption: "Duty by category",
    borderDaysLabel: "8–12 days",
    borderDaysCaption: "Border clearance",
    whyFirstHeading: "Why Morocco varies by product",
    whyFirstBody:
      "Duty depends heavily on category and existing trade routes, check your specific product against Morocco's tariff schedule before committing to a price.",
    whatYouNeed: [
      "CAC registration and NEPC certificate",
      "Certificate of origin",
      "French-language labelling where required",
    ],
    crossSell: NEPC_CROSS_SELL,
  },
  {
    id: "g-eg",
    kind: "country",
    country: "Egypt",
    title: "Selling into Egypt",
    updated: "Updated February",
    subtitle: "Registered-exporter list required",
    readMinutes: 6,
    dutyLabel: "5–20%",
    dutyCaption: "Duty by category",
    borderDaysLabel: "7–10 days",
    borderDaysCaption: "Border clearance",
    whyFirstHeading: "Why Egypt needs registration first",
    whyFirstBody:
      "Egypt keeps a registered-exporter list for several product categories, check your product against it before you ship, since being on it is faster than being added to it after the fact.",
    whatYouNeed: [
      "CAC registration and NEPC certificate",
      "Egyptian registered-exporter check",
      "Certificate of origin",
    ],
    crossSell: NEPC_CROSS_SELL,
  },
  {
    id: "g-et",
    kind: "country",
    country: "Ethiopia",
    title: "Selling into Ethiopia",
    updated: "Updated January",
    subtitle: "Foreign-exchange approval on large orders",
    readMinutes: 5,
    dutyLabel: "10–35%",
    dutyCaption: "Duty by category",
    borderDaysLabel: "9–13 days",
    borderDaysCaption: "Border clearance",
    whyFirstHeading: "Why Ethiopia needs an FX plan",
    whyFirstBody:
      "Larger orders can need foreign-exchange approval on the buyer's side before payment clears, agree the payment plan up front so it doesn't stall the shipment.",
    whatYouNeed: [
      "CAC registration and NEPC certificate",
      "Certificate of origin",
      "Buyer-side FX approval for large orders",
    ],
    crossSell: NEPC_CROSS_SELL,
  },
];

const REFERENCE_ARTICLES: ReferenceArticle[] = [
  {
    id: "a-pricing-without-guessing",
    kind: "article",
    title: "Pricing without guessing",
    updated: "Updated July",
    readMinutes: 8,
    summary: "A short, practical method for setting a price you can defend, for goods, services or content.",
    sections: [
      {
        heading: "Cost it before you price it",
        body: "Add up materials, your time at a real hourly rate, platform fees and delivery. Whatever is left after that is your actual margin, most underpricing happens because this step gets skipped.",
      },
      {
        heading: "Round up, not down",
        body: "When you're unsure between two numbers, pick the higher one. It is far easier to run a promotion later than to raise a price customers have already anchored to.",
      },
      {
        heading: "Re-check it quarterly",
        body: "Costs move. Revisit your pricing every few months rather than leaving it to erode against inflation and platform fee changes.",
      },
    ],
  },
];

// The "Templates & Resources" pack (invoice/receipt templates) was removed on
// your instruction. It was in the approved WAWU Learn design but was never
// named in docs/00_PLATFORM_MAP.md's Learn section, which lists the Business
// Playbook, country guides and "featured reference content" — so nothing in
// the locked docs depends on it. TemplatePack stays in types/learn.ts so the
// union and the detail view survive if you want it back.

export const MOCK_GUIDES: LearnGuide[] = [...COUNTRY_GUIDES, ...REFERENCE_ARTICLES];

/**
 * DEV ONLY mock enrollment store. Tracks which course ids have had a
 * free-course slot spent against them, plus optional in-progress percentages.
 * There is no backend yet — the real entitlement (tier, remaining slots)
 * comes from `creatorGates()`; this file only tracks *usage* against it.
 */
let enrolledCourseIds: string[] = ["c-bookkeeping"];
const progressByCourseId: Record<string, number> = {};

// SEAM: replace with GET /api/hub/learn/courses
export async function getMockCourses(): Promise<LearnCourse[]> {
  await delay(280);
  return MOCK_COURSES;
}

// SEAM: replace with GET /api/hub/content/:id
export async function getMockCourse(id: string): Promise<LearnCourse | null> {
  await delay(250);
  return MOCK_COURSES.find((c) => c.id === id) ?? null;
}

// SEAM: replace with GET /api/hub/learn/playbook
export async function getMockPlaybook(): Promise<Playbook> {
  await delay(250);
  return MOCK_PLAYBOOK;
}

// SEAM: replace with GET /api/hub/learn/guides
export async function getMockGuides(): Promise<LearnGuide[]> {
  await delay(280);
  return MOCK_GUIDES;
}

// SEAM: replace with GET /api/hub/learn/entitlement (the ids/progress half of it)
export async function getMockCourseUsage(): Promise<{ enrolledCourseIds: string[]; progressByCourseId: Record<string, number> }> {
  await delay(200);
  return { enrolledCourseIds: [...enrolledCourseIds], progressByCourseId: { ...progressByCourseId } };
}

/**
 * Spends a free-course slot on `courseId`, if one is available under `cap`.
 * Idempotent — enrolling in an already-enrolled course is a no-op.
 */
// SEAM: replace with POST /api/hub/learn/courses/:id/enrol
export async function enrolInCourseMock(courseId: string, cap: number): Promise<{ enrolledCourseIds: string[]; progressByCourseId: Record<string, number> }> {
  await delay(300);
  if (!enrolledCourseIds.includes(courseId) && enrolledCourseIds.length < cap) {
    enrolledCourseIds = [...enrolledCourseIds, courseId];
  }
  return { enrolledCourseIds: [...enrolledCourseIds], progressByCourseId: { ...progressByCourseId } };
}
