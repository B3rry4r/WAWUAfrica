import type { Mentor } from "@/types/mentors";
import { delay } from "../client";

export const MOCK_MENTORS: Mentor[] = [
  {
    id: "m-obinna",
    name: "Obinna Eze",
    handle: "obinna",
    field: "Produce exporter",
    category: "Export",
    tagline: "Ran a produce export business for 18 years.",
    bio: "I shipped dried ginger and hibiscus to the UK and Ghana for eighteen years, and lost money on the first four before I understood documentation. Come to me with the boring parts — paperwork, buyers who will not pay, cold chain.",
    topics: ["Export paperwork", "Buyer contracts", "Cold chain", "Pricing for export"],
    verification: "trusted_partner",
    availability: "Tuesday and Thursday evenings",
    openForRequests: true,
    yearsExperience: 18,
    sessions: 34,
    languages: ["English", "Igbo", "Pidgin"],
  },
  {
    id: "m-funmi",
    name: "Funmi Adeyemi",
    handle: "funmi",
    field: "Chartered accountant",
    category: "Finance",
    tagline: "Chartered accountant. Small-business books and tax.",
    bio: "I keep small-business books straight and out of trouble with tax. Most of what I coach is unglamorous — invoices, receipts, knowing what to set aside before you spend it.",
    topics: ["Tax planning", "Bookkeeping", "Pricing", "Business registration"],
    verification: "certified_professional",
    availability: "Tuesdays and Thursdays",
    openForRequests: true,
    yearsExperience: 11,
    sessions: 140,
    languages: ["English", "Yoruba", "Pidgin"],
  },
  {
    id: "m-hauwa",
    name: "Hauwa Sule",
    handle: "hauwa",
    field: "Poultry farmer",
    category: "Agriculture",
    tagline: "Poultry at scale. Feed, disease, cold chain.",
    bio: "I run a poultry operation that scaled past what a family farm can manage on instinct alone. I coach the operational side — feed costs, disease control, keeping a cold chain intact on bad roads.",
    topics: ["Poultry feed", "Disease control", "Cold chain", "Scaling flock size"],
    verification: "basic",
    availability: "Weekend mornings",
    openForRequests: false,
    fullUntil: "September",
    yearsExperience: 14,
    sessions: 61,
    languages: ["English", "Hausa"],
  },
  {
    id: "m-musa",
    name: "Musa Ibrahim",
    handle: "musa",
    field: "Content strategist",
    category: "Content & growth",
    tagline: "Growing a Nigerian audience that actually buys.",
    bio: "Content strategist. We work on posting, pricing and turning viewers into paying customers rather than chasing views for their own sake.",
    topics: ["Content calendar", "Growing an audience", "Turning views into sales", "Posting cadence"],
    verification: "verified_user",
    availability: "Most weekdays",
    openForRequests: true,
    yearsExperience: 9,
    sessions: 220,
    languages: ["English", "Hausa", "Pidgin"],
  },
  {
    id: "m-zainab",
    name: "Zainab Bello",
    handle: "zainab",
    field: "Agronomist",
    category: "Agriculture",
    tagline: "Small plots, big yields — the numbers side.",
    bio: "Agronomist focused on smallholder farms. Great for creators selling seeds, tools or farm courses who need the yield math to hold up.",
    topics: ["Seed selection", "Yield per acre", "Soil testing", "Selling farm produce"],
    verification: "verified_business",
    availability: "Fridays",
    openForRequests: true,
    yearsExperience: 7,
    sessions: 95,
    languages: ["English", "Hausa"],
  },
];

// SEAM: replace with GET /api/hub/mentors?category=
export async function getMockMentors(category = "All"): Promise<Mentor[]> {
  await delay(280);
  if (category === "All") return MOCK_MENTORS;
  return MOCK_MENTORS.filter((m) => m.category === category);
}

// SEAM: replace with GET /api/hub/mentors/:id
export async function getMockMentor(id: string): Promise<Mentor | null> {
  await delay(250);
  return MOCK_MENTORS.find((m) => m.id === id) ?? null;
}

// SEAM: replace with POST /api/hub/mentors/:id/request
export async function requestMockMentor(
  mentorId: string,
  request: { topics: string[]; note: string; slot: string },
): Promise<{ id: string; status: "sent" }> {
  await delay(500);
  void request;
  return { id: `req-${mentorId}-${Date.now()}`, status: "sent" };
}
