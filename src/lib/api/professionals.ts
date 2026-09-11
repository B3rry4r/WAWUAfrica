import { apiFetch } from "./client";
import type { CategoryId } from "@/lib/categories";
import type {
  MyProfessionalApplication,
  ProfessionalApplicationDraft,
  ProfessionalDetail,
  ProfessionalListing,
} from "@/types/professional";

/**
 * Professional profiles — creators listed as practitioners in one category,
 * reached through a paid DM.
 *
 * No mock fallback anywhere in this module, deliberately. Every other read in
 * this app falls back to mock data when there is no backend, and for a
 * catalogue or a feed that is a reasonable trade. Here it is not: a fake
 * lawyer or a fake pharmacist is exactly the thing a directory of certified
 * professionals exists to prevent, and someone would have to be very sure
 * which mode the app was in before trusting a name on this screen. An error
 * is the honest answer when the backend is unreachable.
 */

/** GET /api/hub/professionals — the directory, optionally by category. */
export async function listProfessionals(
  category?: CategoryId,
  page = 1,
): Promise<ProfessionalListing[]> {
  const params = new URLSearchParams({ page: String(page), perPage: "20" });
  if (category) params.set("category", category);
  return apiFetch<ProfessionalListing[]>(`/api/hub/professionals?${params}`);
}

/** GET /api/hub/professionals/:id */
export async function getProfessional(id: string): Promise<ProfessionalDetail> {
  return apiFetch<ProfessionalDetail>(`/api/hub/professionals/${id}`);
}

/** GET /api/hub/professionals/applications/mine */
export async function getMyApplications(): Promise<MyProfessionalApplication[]> {
  return apiFetch<MyProfessionalApplication[]>(
    "/api/hub/professionals/applications/mine",
    { authed: true },
  );
}

/**
 * POST /api/hub/professionals/applications, for ONE category.
 *
 * Licence fields are sent only for a regulated category. Outside those the
 * API has no use for them, and passing a number nobody will check invites the
 * applicant to think one was verified.
 *
 * A draft carrying several `categories` is sent as one call per category (see
 * the apply page) rather than widened into an array here, because the API
 * itself has no concept of a multi-category application — it is N separate
 * `ProfessionalProfile` rows under the hood, one per field.
 */
export async function applyAsProfessional(
  draft: Omit<ProfessionalApplicationDraft, "categories">,
  category: CategoryId,
  regulated: boolean,
): Promise<MyProfessionalApplication> {
  return apiFetch<MyProfessionalApplication>(
    "/api/hub/professionals/applications",
    {
      method: "POST",
      authed: true,
      body: {
        category,
        headline: draft.headline.trim(),
        about: draft.about.trim(),
        services: draft.services.filter((s) => s.trim().length > 0),
        credentialKind: draft.credentialKind,
        ...(regulated
          ? {
              licenceNumber: draft.licenceNumber.trim(),
              issuingBody: draft.issuingBody.trim(),
            }
          : {}),
        ...(draft.documents.length > 0 ? { documents: draft.documents } : {}),
      },
    },
  );
}

/**
 * PATCH /api/hub/professionals/applications/:id/listing.
 *
 * Availability, not approval — a professional at capacity hides themselves
 * without withdrawing an application a human already reviewed, and comes back
 * by flipping this rather than reapplying.
 */
export async function setProfessionalListed(
  id: string,
  listed: boolean,
): Promise<MyProfessionalApplication> {
  return apiFetch<MyProfessionalApplication>(
    `/api/hub/professionals/applications/${id}/listing`,
    { method: "PATCH", authed: true, body: { listed } },
  );
}
