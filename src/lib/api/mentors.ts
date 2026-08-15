import type { Mentor } from "@/types/mentors";
import { getMockMentor, getMockMentors, requestMockMentor } from "./mocks/mentors";

// SEAM: replace with GET /api/hub/mentors
export async function getMentors(): Promise<Mentor[]> {
  return getMockMentors();
}

// SEAM: replace with GET /api/hub/mentors/:id
export async function getMentor(id: string): Promise<Mentor | null> {
  return getMockMentor(id);
}

// SEAM: replace with POST /api/hub/mentors/:id/request
export async function requestMentor(mentorId: string, note: string): Promise<{ id: string; status: "sent" }> {
  return requestMockMentor(mentorId, note);
}