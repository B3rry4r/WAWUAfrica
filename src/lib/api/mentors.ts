import type { Mentor } from "@/types/mentors";
import { getMockMentor, getMockMentors, requestMockMentor } from "./mocks/mentors";

// SEAM: replace with GET /api/hub/mentors?category=
export async function getMentors(category = "All"): Promise<Mentor[]> {
  return getMockMentors(category);
}

// SEAM: replace with GET /api/hub/mentors/:id
export async function getMentor(id: string): Promise<Mentor | null> {
  return getMockMentor(id);
}

// SEAM: replace with POST /api/hub/mentors/:id/request
export async function requestMentor(
  mentorId: string,
  request: { topics: string[]; note: string; slot: string },
): Promise<{ id: string; status: "sent" }> {
  return requestMockMentor(mentorId, request);
}