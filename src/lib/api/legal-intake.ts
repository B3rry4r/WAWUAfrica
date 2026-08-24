import { apiFetch } from "./client";
import type { LegalIntake, LegalMatterOption } from "@/types/legal-intake";

/**
 * Legal profiling.
 *
 * No mock fallback in this module, deliberately, and for the same reason as
 * the professional directory: a legal brief that a consultant reads before
 * advising a client must never be something this app invented offline. If the
 * backend cannot be reached, the screen says so.
 */

/** The fourteen things somebody can say they need. */
export async function getLegalMatters(): Promise<LegalMatterOption[]> {
  return apiFetch<LegalMatterOption[]>("/api/hub/legal/intake/matters", {
    authed: true,
  });
}

/** Start, or pick up an unfinished intake for the same matter. */
export async function startLegalIntake(matter: string): Promise<LegalIntake> {
  return apiFetch<LegalIntake>("/api/hub/legal/intake", {
    method: "POST",
    authed: true,
    body: { matter },
  });
}

export async function getLegalIntake(id: string): Promise<LegalIntake> {
  return apiFetch<LegalIntake>(`/api/hub/legal/intake/${id}`, { authed: true });
}

export async function getMyLegalIntakes(): Promise<LegalIntake[]> {
  return apiFetch<LegalIntake[]>("/api/hub/legal/intake/mine", { authed: true });
}

/**
 * Save answers as they are given.
 *
 * Partial by design — the server merges. Sending one answer at a time means a
 * dropped request costs that answer rather than the whole intake, which is
 * what makes it safe to save on every tap instead of at the end.
 */
export async function saveLegalIntakeAnswers(
  id: string,
  answers: Record<string, string | string[] | null>,
  documents?: string[],
): Promise<LegalIntake> {
  return apiFetch<LegalIntake>(`/api/hub/legal/intake/${id}/answers`, {
    method: "PATCH",
    authed: true,
    body: { answers, ...(documents ? { documents } : {}) },
  });
}

/**
 * Finish, and generate the brief.
 *
 * This can genuinely fail — it makes a live model call — and the failure is
 * not silent: the intake stays open and the caller is told to retry. Do not
 * swallow the error here.
 */
export async function completeLegalIntake(id: string): Promise<LegalIntake> {
  return apiFetch<LegalIntake>(`/api/hub/legal/intake/${id}/complete`, {
    method: "POST",
    authed: true,
  });
}
