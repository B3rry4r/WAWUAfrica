import type { Mentor } from "@/types/mentors";
import { getMockMentor, getMockMentors, requestMockMentor } from "./mocks/mentors";

export async function getMentors(): Promise<Mentor[]> {
  return getMockMentors();
}

export async function getMentor(id: string): Promise<Mentor | null> {
  return getMockMentor(id);
}

export async function requestMentor(mentorId: string, note: string): Promise<{ id: string; status: "sent" }> {
  return requestMockMentor(mentorId, note);
}