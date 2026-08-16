import type { Mentor } from "@/types/mentors";
import { apiFetch } from "./client";
import { getMockMentor, getMockMentors, requestMockMentor } from "./mocks/mentors";

/**
 * Real wire shape of GET /api/hub/services/mentors(/:id) — the Prisma
 * `Mentor` model is the backend's wire shape verbatim (mentor.type.ts: "thin
 * re-export"). It has NO `availability` field — that column does not exist
 * on the schema at all (prisma/schema.prisma `model Mentor`), unlike the
 * frontend's `Mentor.availability` (free-form schedule text, e.g. "Tuesday
 * and Thursday evenings") which every mock fixture carries and the browse
 * card / profile screen render directly.
 *
 * This is a genuine backend gap, not a naming mismatch — there is nothing to
 * map `availability` from. Real mentors map to an empty string here so the
 * UI degrades (no schedule line) instead of fabricating a value; a schema
 * addition is a backend-side follow-up, not something this layer can paper
 * over.
 */
type RealMentor = Omit<Mentor, "availability">;

function fromRealMentor(m: RealMentor): Mentor {
  return { ...m, availability: "" };
}

// SEAM: replace with GET /api/hub/services/mentors?category=
export async function getMentors(category = "All"): Promise<Mentor[]> {
  try {
    const query = category === "All" ? "" : `?category=${encodeURIComponent(category)}`;
    const mentors = await apiFetch<RealMentor[]>(`/api/hub/services/mentors${query}`, { authed: true });
    return mentors.map(fromRealMentor);
  } catch {
    return getMockMentors(category);
  }
}

// SEAM: replace with GET /api/hub/services/mentors/:id
export async function getMentor(id: string): Promise<Mentor | null> {
  try {
    const mentor = await apiFetch<RealMentor>(`/api/hub/services/mentors/${id}`, { authed: true });
    return fromRealMentor(mentor);
  } catch {
    return getMockMentor(id);
  }
}

/**
 * POST /api/hub/services/mentors/:id/requests — FREE, no payment step
 * (registry note on MentorRequestController: mentors volunteer their time).
 * The real row persists with `status: "pending"` (Prisma default) — the
 * `"sent"` literal returned here is deliberate UI-confirmation state ("your
 * request went out"), not a mirror of the backend's internal workflow
 * status, matching `MentorRequest.status` in types/mentors.ts.
 */
// SEAM: replace with POST /api/hub/services/mentors/:id/requests
export async function requestMentor(
  mentorId: string,
  request: { topics: string[]; note: string; slot: string },
): Promise<{ id: string; status: "sent" }> {
  try {
    const created = await apiFetch<{ id: string }>(`/api/hub/services/mentors/${mentorId}/requests`, {
      method: "POST",
      authed: true,
      body: request,
    });
    return { id: created.id, status: "sent" };
  } catch {
    return requestMockMentor(mentorId, request);
  }
}
