import type { LearnCourse, LearnEntitlement, LearnGuide, Playbook } from "@/types/learn";
import { delay } from "../client";

export const MOCK_COURSES: LearnCourse[] = [
  {
    id: "c-farm-paperwork",
    title: "Farm paperwork made simple",
    category: "Agriculture",
    lessons: 6,
    minutes: 48,
    price: 0,
    host: { wawuId: "wawu-amara", name: "Amara Okafor" },
    rating: 4.8,
    students: 1240,
    overview: "Records, receipts and registrations — the paperwork side of agribusiness, step by step.",
    whatYouLearn: ["Keep a one-page farm ledger", "File a simple receipt system", "Know which registrations matter"],
  },
  {
    id: "c-ankara-brand",
    title: "Building an ankara brand",
    category: "Fashion",
    lessons: 8,
    minutes: 74,
    price: 1500,
    host: { wawuId: "wawu-funmi", name: "Funmi Adeyemi" },
    rating: 4.9,
    students: 860,
    overview: "Turn a tote-bag hustle into a recognisable fashion brand Nigerians trust.",
    whatYouLearn: ["Positioning and pricing", "Phone-photography that sells", "Handling made-to-order demand"],
  },
  {
    id: "c-small-biz-books",
    title: "Small-business books that balance",
    category: "Business",
    lessons: 5,
    minutes: 39,
    price: 1000,
    host: { wawuId: "wawu-funmi", name: "Funmi Adeyemi" },
    rating: 4.7,
    students: 610,
    overview: "Simple records for businesses that started on WhatsApp.",
    whatYouLearn: ["A one-page ledger that works", "Separating money from pocket money", "Reading your own numbers"],
  },
  {
    id: "c-pricing-for-creators",
    title: "Pricing for creators",
    category: "Creator business",
    lessons: 7,
    minutes: 62,
    price: 2000,
    host: { wawuId: "wawu-adaeze", name: "Adaeze Okonkwo" },
    rating: 4.8,
    students: 920,
    overview: "Charge what your work is worth — for content, DMs and custom orders.",
    whatYouLearn: ["Set your own rates", "Bundle without discounting your worth", "Handle haggling gracefully"],
  },
  {
    id: "c-garden-yields",
    title: "Garden yields on small plots",
    category: "Agriculture",
    lessons: 9,
    minutes: 81,
    price: 1200,
    host: { wawuId: "wawu-zainab", name: "Zainab Bello" },
    rating: 4.6,
    students: 740,
    overview: "Grow more from less land, without fancy inputs.",
    whatYouLearn: ["Soil basics for small plots", "Crop rotations that pay", "Selling what you grow locally"],
  },
  {
    id: "c-tailor-orders",
    title: "Tailor orders without the chaos",
    category: "Crafts",
    lessons: 6,
    minutes: 55,
    price: 900,
    host: { wawuId: "wawu-ifeanyi", name: "Ifeanyi Nwosu" },
    rating: 4.5,
    students: 430,
    overview: "Measurements, deposits and delivery — order management for tailors.",
    whatYouLearn: ["A measurement template", "Deposits that protect both sides", "Delivery that doesn't drag"],
  },
];

export const MOCK_PLAYBOOK: Playbook = {
  id: "pb-business",
  title: "The WAWU Business Playbook",
  pages: 96,
  format: "PDF",
  description:
    "The WAWU Business Playbook is the free, plain-language handbook for creators selling on WAWU. Pricing, paid messages, credits, verification and getting paid — everything a new creator needs, in one 96-page PDF.",
  chapters: [
    { title: "Starting out", pages: "1–14" },
    { title: "Pricing your work", pages: "15–29" },
    { title: "Paid messages & communities", pages: "30–44" },
    { title: "Verification & KYC", pages: "45–58" },
    { title: "Getting paid", pages: "59–78" },
    { title: "Growing an audience", pages: "79–96" },
  ],
};

export const MOCK_GUIDES: LearnGuide[] = [
  { id: "g-ng", country: "Nigeria", title: "Selling as a Nigerian creator", pages: 18 },
  { id: "g-gh", country: "Ghana", title: "Selling as a Ghanaian creator", pages: 14 },
  { id: "g-ke", country: "Kenya", title: "Selling as a Kenyan creator", pages: 15 },
  { id: "g-za", country: "South Africa", title: "Selling as a South African creator", pages: 16 },
  { id: "g-ug", country: "Uganda", title: "Selling as a Ugandan creator", pages: 12 },
  { id: "g-dz", country: "Algeria", title: "Selling as an Algerian creator", pages: 13 },
  { id: "g-ma", country: "Morocco", title: "Selling as a Moroccan creator", pages: 13 },
  { id: "g-eg", country: "Egypt", title: "Selling as an Egyptian creator", pages: 15 },
  { id: "g-et", country: "Ethiopia", title: "Selling as an Ethiopian creator", pages: 12 },
  { id: "g-tz", country: "Tanzania", title: "Selling as a Tanzanian creator", pages: 11 },
  { id: "g-ao", country: "Angola", title: "Selling as an Angolan creator", pages: 12 },
  { id: "g-ci", country: "Côte d'Ivoire", title: "Selling as an Ivorian creator", pages: 12 },
];

export async function getMockLearnEntitlement(): Promise<LearnEntitlement> {
  await delay(250);
  return { tier: "basic", freeCourses: 1, totalCourses: MOCK_COURSES.length, canDownloadPlaybook: true };
}

export async function getMockCourses(): Promise<LearnCourse[]> {
  await delay(280);
  return MOCK_COURSES;
}

export async function getMockCourse(id: string): Promise<LearnCourse | null> {
  await delay(250);
  return MOCK_COURSES.find((c) => c.id === id) ?? null;
}

export async function getMockPlaybook(): Promise<Playbook> {
  await delay(250);
  return MOCK_PLAYBOOK;
}

export async function getMockGuides(): Promise<LearnGuide[]> {
  await delay(280);
  return MOCK_GUIDES;
}