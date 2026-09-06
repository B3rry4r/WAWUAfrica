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

/**
 * BUSINESS PLAYBOOK: THE NAIJA WAY, by Emmanuel Lennox.
 *
 * A real 213-page book published by WAWU Technology Ltd (ISBN
 * 978-978-68-0965-6), not a description of one. What was here before was
 * invented: a made-up title with five made-up chapters and prose nobody
 * wrote, in front of a download that did not exist.
 *
 * Every chapter title and page range below is the book's own, and each
 * reading section is the opening of that chapter, lifted from the PDF rather
 * than summarised. `fileUrl` is the actual file.
 */
export const MOCK_PLAYBOOK: Playbook = {
  id: "pb-naija-way",
  title: "Business Playbook: The Naija Way",
  author: "Emmanuel Lennox",
  pages: 213,
  format: "PDF",
  fileUrl: "/business-playbook-the-naija-way.pdf",
  downloadCount: 0,
  description:
    "Twenty chapters on building a business in Nigeria, from spotting the idea to handing it on. Written for the market you actually trade in, not the one a textbook describes. Free to everybody, tier or no tier.",
  chapters: [
    { section: "The foundation, before you start", title: "The Naija Idea: Spotting Opportunities in Chaos", pages: "7\u201312" },
    { section: "The foundation, before you start", title: "From \"I Think\" to \"I Know\": Market Research, Naija Style", pages: "13\u201320" },
    { section: "The foundation, before you start", title: "Crafting Your Battle Plan: The Simple, Actionable Business Plan", pages: "21\u201331" },
    { section: "The foundation, before you start", title: "Legal Eagles & Corporate Affairs Commission (CAC): Getting Your Papers Right", pages: "32\u201343" },
    { section: "The foundation, before you start", title: "The Naija Money Talk: Startup Capital, Bootstrapping & \"See Me, See Profit\"", pages: "44\u201356" },
    { section: "Setting up and operations", title: "Location, Location, Situation: Physical Store, Online, or \"WhatsApp Warehouse\"?", pages: "57\u201367" },
    { section: "Setting up and operations", title: "Dealing with \"Oga at the Top\": Government Agencies, Regulations & Multiple Taxation", pages: "68\u201376" },
    { section: "Setting up and operations", title: "Power, Logistics, Internet: Building Your Business Infrastructure", pages: "77\u201384" },
    { section: "Setting up and operations", title: "Hiring Your First Staff: Family, Friends, or Professionals?", pages: "85\u201394" },
    { section: "Setting up and operations", title: "Record Keeping & Basic Accounting: Beyond \"The Black Box\"", pages: "95\u2013105" },
    { section: "Sales and marketing", title: "Pricing for Profit: How to Price Your Product in a Price-Sensitive Market", pages: "106\u2013117" },
    { section: "Sales and marketing", title: "Branding & Packaging: Why Your \"Pure Water\" Business Needs a Logo", pages: "118\u2013127" },
    { section: "Sales and marketing", title: "Digital Marketing: From Instagram to WhatsApp, Reaching Millions on a Shoestring", pages: "128\u2013136" },
    { section: "Sales and marketing", title: "The Art of the Naija Sell: Customer Psychology & Relationship Management", pages: "137\u2013146" },
    { section: "Sales and marketing", title: "Distribution & Delivery: Getting Your Product to the Customer Despite Bad Roads", pages: "147\u2013156" },
    { section: "Growth and sustainability", title: "Reinvesting & Managing Cash Flow: Avoiding \"Boombastic to Bankrupt\"", pages: "157\u2013166" },
    { section: "Growth and sustainability", title: "Scaling Up: When to Expand, Diversify, or Franchise", pages: "167\u2013176" },
    { section: "Growth and sustainability", title: "Building a Team Culture: From One-Man Squad to a Cohesive Unit", pages: "177\u2013186" },
    { section: "Growth and sustainability", title: "The Mental Game: Resilience, Burnout, and the Entrepreneur's Health", pages: "187\u2013195" },
    { section: "Growth and sustainability", title: "Giving Back & Building a Legacy: The Social Responsibility of the Naija Entrepreneur", pages: "196\u2013213" },
  ],
  readingSections: [
    {
      heading: "The Naija Idea: Spotting Opportunities in Chaos",
      body:
        "Your business does not need to be a revolutionary, never-before-seen concept. It simply needs to be a reliable, effective solution to a common, painful problem. The more acute the pain, the more valuable the solution. Carry a small notebook or use the notes app on your phone. Every single time you sigh, grumble, or exclaim in frustration at a product, a service, or a process, write it down.",
    },
    {
      heading: "From \"I Think\" to \"I Know\": Market Research, Naija Style",
      body:
        "Low-Cost Primary Research: The Street-Smart Methods 1. The \"Stroll and Observe\" Technique (The Silent Investigator) Before you ask a single question, learn to be a master observer. Go to where your potential customers congregate. If you're selling office snacks, spend a week during lunch breaks around the clusters of \"mama put\" canteens and street vendors near business districts in Ikeja or GRA.",
    },
    {
      heading: "Crafting Your Battle Plan: The Simple, Actionable Business Plan",
      body:
        "The One-Page Naija Battle Plan: Your Strategic Core Before you write a single lengthy paragraph, you must be able to distill the very essence of your business onto one page. If you cannot explain your business simply, you do not understand it well enough. This one-page document will become your North Star, the thing you can glance at in moments of doubt or distraction to remember exactly what you are building and why.",
    },
    {
      heading: "Legal Eagles & Corporate Affairs Commission (CAC): Getting Your Papers Right",
      body:
        "No Legal Protection: Your Personal Assets are on the Line. This is the single most important reason to register. If you are selling products as an individual and a customer has a bad reaction, or if a debtor decides to sue you, they are suing you personally. This means your personal savings, your car, and even your house could be seized to settle business debts.",
    },
    {
      heading: "The Naija Money Talk: Startup Capital, Bootstrapping & \"See Me, See Profit\"",
      body:
        "Let’s create a detailed, hypothetical budget for a business we’ll call “Uchenna’s Urban Wear,” a clothing brand producing custom-made Afrocentric t-shirts and sweatshirts.",
    },
    {
      heading: "Location, Location, Situation: Physical Store, Online, or \"WhatsApp Warehouse\"?",
      body:
        "The Unbeatable Advantages: The Trust Signal: In a market with a high trust deficit, a physical address is a powerful validator. Customers can verify quality firsthand, reducing the perceived risk of purchase. Immediate Gratification: The ability for a customer to walk in, purchase, and walk out with their product is a significant competitive advantage. It satisfies the “I need it now” urge that next-day delivery cannot fulfill.",
    },
    {
      heading: "Dealing with \"Oga at the Top\": Government Agencies, Regulations & Multiple Taxation",
      body:
        "The Federal Level: The Big Players These agencies set national standards and regulate specific industries. Corporate Affairs Commission (CAC): You met them in Chapter 4. They are your starting point, responsible for your business’s birth certificate (registration). Federal Inland Revenue Service (FIRS): This is the federal tax authority.",
    },
    {
      heading: "Power, Logistics, Internet: Building Your Business Infrastructure",
      body:
        "Layer 1: The Grid (Public Power Supply) The Reality: Unpredictable and often inadequate. It can be stable for days and disappear for weeks. Voltage fluctuations can damage sensitive equipment. The Strategy: View grid power as a bonus, not a base. When it is available, it should be your primary source to save on fuel costs. However, essential equipment must be protected by a voltage stabilizer.",
    },
    {
      heading: "Hiring Your First Staff: Family, Friends, or Professionals?",
      body:
        "The Alluring Advantages (Why We Do It): Perceived Trust and Loyalty: You have a pre-existing relationship. You feel you know their character, and you believe they will be more loyal to you than a stranger would. In a business environment rife with theft and disloyalty, this feels like a safe bet.",
    },
    {
      heading: "Record Keeping & Basic Accounting: Beyond \"The Black Box\"",
      body:
        "Profit Illusion: The \"Cash in Hand\" Deception. You see money flowing into your business account or your POS, you pay your major bills, and you assume the remainder is your profit. You then use this \"profit\" to cover personal expenses, only to find yourself stranded when a major tax bill, a bulk inventory purchase, or a equipment repair arises.",
    },
    {
      heading: "Pricing for Profit: How to Price Your Product in a Price-Sensitive Market",
      body:
        "The Formula: Cost of Goods Sold (COGS) + Overhead Allocation + Desired Profit = Selling Price. You are guaranteed a \"profit\" on every unit sold. The Catastrophic Flaw: This model is completely inward-looking. It ignores the most important factor in the pricing equation: THE CUSTOMER. It does not consider what the customer is willing to pay, what your competitors are charging, or the perceived value of your product.",
    },
    {
      heading: "Branding & Packaging: Why Your \"Pure Water\" Business Needs a Logo",
      body:
        "It is an investment in customer loyalty, perceived value, and future profits. It is the consistent expectation of quality, service, and experience that a customer has every time they interact with your business. It is what people say about you when you are not in the room. It is the emotion trust, joy, confidence, sophistication that your business evokes.",
    },
    {
      heading: "Digital Marketing: From Instagram to WhatsApp, Reaching Millions on a Shoestring",
      body:
        "The Trust Deficit is Real: Online scams are rampant. Your digital presence must be meticulously crafted to build trust. Social proof—testimonials, user-generated content is your most powerful weapon. Community Over Corporation: Nigerians crave connection. They don't want to interact with a faceless brand; they want to connect with a person, a story, a mission.",
    },
    {
      heading: "The Art of the Naija Sell: Customer Psychology & Relationship Management",
      body:
        "A product that signals success, sophistication, or being \"in the know\" has immense appeal. The \"Package Deal\": The value is in the entire experience the product, the packaging, the customer service, the brand story. A slightly more expensive item that comes with impeccable service and a sense of prestige is often chosen over a cheaper, bare-bones alternative.",
    },
    {
      heading: "Distribution & Delivery: Getting Your Product to the Customer Despite Bad Roads",
      body:
        "Traffic & Security: \"Go-slows,\" road closures, and security concerns in certain regions can disrupt the most carefully planned delivery schedules. The Human Factor: Dispatch Riders: The backbone of intra-city logistics, but managing them requires dealing with issues of reliability, honesty, and customer interaction.",
    },
    {
      heading: "Reinvesting & Managing Cash Flow: Avoiding \"Boombastic to Bankrupt\"",
      body:
        "Cash Outflow (You Pay): You pay your suppliers for raw materials, your staff, your rent, and your generator fuel. The Production Lag: You turn materials into finished goods. Cash Inflow (You Get Paid): The customer buys your product. But critically, the money might not hit your account immediately. Payment on Delivery (POD): You may wait days for the dispatch rider to remit cash.",
    },
    {
      heading: "Scaling Up: When to Expand, Diversify, or Franchise",
      body:
        "Systemization: Have you documented your key processes? Is the business dependent on you, the founder, for every decision? If you cannot systemize it, you cannot scale it. Is your brand recognized and trusted in your current market? A weak brand will not travel well to new locations or support new product lines. Is Your Team Ready for Greater Responsibility?",
    },
    {
      heading: "Building a Team Culture: From One-Man Squad to a Cohesive Unit",
      body:
        "We are transparent in our dealings and take responsibility for our mistakes. Hiring for Culture Add, Not Just Culture Fit: Don't just hire people who think like you. Hire people who bring diverse skills and perspectives but share your core values. Use the structured hiring process from Chapter 9. From \"Jobs\" to \"Roles and Responsibilities\": Create a clear Role Charter for every position.",
    },
    {
      heading: "The Mental Game: Resilience, Burnout, and the Entrepreneur's Health",
      body:
        "The Family & Community Expectation: Your success is often seen as a family asset. Suddenly, you become the \"ATM,\" expected to solve financial problems for a wide circle of relatives. Saying \"no\" can be construed as selfishness, leading to guilt and relational strain.",
    },
    {
      heading: "Giving Back & Building a Legacy: The Social Responsibility of the Naija Entrepreneur",
      body:
        "Obligatory Giving: Reactive, emotion-driven, often unfocused. It responds to the loudest request, not the greatest need. Strategic Giving: Proactive, planned, and aligned with your business's core competencies and values. It creates measurable impact and often generates returns for your business in terms of brand equity, employee morale, and community goodwill.",
    },
  ],
};

const NEPC_CROSS_SELL = {
  heading: "Need the certificate?",
  body: "NEPC export support runs inside WAWU. Answer a few questions and a legal consultant picks it up.",
  href: "/services/legal/intake?matter=cross_border",
  label: "Talk to the legal desk",
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
