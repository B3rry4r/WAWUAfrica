import type { Mentor } from "@/types/mentors";
import { delay } from "../client";

export const MOCK_MENTORS: Mentor[] = [
  {
    id: "m-adaeze",
    name: "Adaeze Okonkwo",
    handle: "adaeze",
    field: "Agribusiness",
    tagline: "Farming inputs, group buys and the paperwork around them",
    bio: "Twelve years running agro supply in Lagos. I help creators turn their trade into something banks understand.",
    rate: 12000,
    rating: 4.9,
    sessions: 180,
    availability: "Wednesdays",
    languages: ["English", "Igbo", "Pidgin"],
  },
  {
    id: "m-funmi",
    name: "Funmi Adeyemi",
    handle: "funmi",
    field: "Fashion & retail",
    tagline: "From ankara hustle to a brand people pre-order",
    bio: "Built a fashion label off WhatsApp. I coach pricing, photography and handling made-to-order demand.",
    rate: 10000,
    rating: 4.8,
    sessions: 140,
    availability: "Tuesdays & Thursdays",
    languages: ["English", "Yoruba", "Pidgin"],
  },
  {
    id: "m-musa",
    name: "Musa Ibrahim",
    handle: "musa",
    field: "Content & growth",
    tagline: "Growing a Nigerian audience that actually buys",
    bio: "Content strategist. We work on posting, pricing and turning viewers into paying customers.",
    rate: 8000,
    rating: 4.7,
    sessions: 220,
    availability: "Most weekdays",
    languages: ["English", "Hausa", "Pidgin"],
  },
  {
    id: "m-zainab",
    name: "Zainab Bello",
    handle: "zainab",
    field: "Agriculture",
    tagline: "Small plots, big yields — the numbers side",
    bio: "Agronomist focused on smallholder farms. Great for creators selling seeds, tools or farm courses.",
    rate: 9000,
    rating: 4.8,
    sessions: 95,
    availability: "Fridays",
    languages: ["English", "Hausa"],
  },
];

// SEAM: replace with GET /api/hub/mentors
export async function getMockMentors(): Promise<Mentor[]> {
  await delay(280);
  return MOCK_MENTORS;
}

// SEAM: replace with GET /api/hub/mentors/:id
export async function getMockMentor(id: string): Promise<Mentor | null> {
  await delay(250);
  return MOCK_MENTORS.find((m) => m.id === id) ?? null;
}

// SEAM: replace with POST /api/hub/mentors/:id/request
export async function requestMockMentor(mentorId: string, note: string): Promise<{ id: string; status: "sent" }> {
  await delay(500);
  void note;
  return { id: `req-${mentorId}-${Date.now()}`, status: "sent" };
}