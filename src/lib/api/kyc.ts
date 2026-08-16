import { apiFetch, mockRequest } from "./client";
import { kycSubmission } from "./mocks/kyc";
import { setKycStatus } from "./mocks/session";
import type { IdDocumentType, KycSubmission } from "@/types/kyc";
import type { KycStatus } from "@/types/account";

export interface KycApi {
  getStatus: () => Promise<KycSubmission>;
  submit: (submission: KycSubmission) => Promise<KycSubmission>;
}

/**
 * Hub API wire shape — kyc-submission.service.ts / kyc-submission.controller.ts
 * (`@Controller('kyc')`, mounted under the global `api/hub` prefix; Prisma
 * model is the wire shape, KycSubmissionModel). Fully owned by this backend
 * (no WAWU-ID involvement, unlike verification.ts's VerificationSubmission —
 * CLAUDE.md is explicit these are separate systems). This is the
 * creator-earning-payout gate: GET/POST /api/hub/kyc require an
 * authenticated caller with a CreatorState row (roles: ["creator"],
 * enforced service-side as a 403 for a plain user, not a route guard).
 */
interface HubKycSubmission {
  id: string;
  wawuUserId: string;
  country: string;
  bvn: string | null;
  nin: string | null;
  nationalIdEquivalent: string | null;
  idDocumentType: string;
  idDocumentUrl: string;
  payoutBankName: string;
  payoutAccountNumber: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

/** GET /api/hub/kyc returns `KycSubmission | null` — null means no submission has ever been made. */
function fromHub(hub: HubKycSubmission | null): KycSubmission {
  if (!hub) {
    return {
      country: "",
      idDocumentType: "national_id_card",
      payoutBankName: "",
      payoutAccountNumber: "",
      status: "not_started",
    };
  }
  return {
    country: hub.country,
    bvn: hub.bvn ?? undefined,
    nin: hub.nin ?? undefined,
    nationalIdEquivalent: hub.nationalIdEquivalent ?? undefined,
    idDocumentType: hub.idDocumentType as IdDocumentType,
    idDocumentUrl: hub.idDocumentUrl,
    payoutBankName: hub.payoutBankName,
    payoutAccountNumber: hub.payoutAccountNumber,
    status: hub.status,
    rejectionReason: hub.rejectionReason ?? undefined,
  };
}

export const kycApi: KycApi = {
  getStatus: async () => {
    try {
      const hub = await apiFetch<HubKycSubmission | null>("/api/hub/kyc", { authed: true });
      return fromHub(hub);
    } catch {
      // SEAM: replace with GET /api/hub/kyc
      return mockRequest({ ...kycSubmission });
    }
  },

  submit: async (submission) => {
    try {
      // CreateKycSubmissionDto: country + idDocumentType/idDocumentUrl +
      // payoutBankName/payoutAccountNumber are always required;
      // bvn/nin are required (and 11-digit-validated) only when country
      // is Nigeria, nationalIdEquivalent only otherwise (server validates
      // by country — mirrored here as "send what's present, omit blanks"
      // rather than re-implementing the country branch client-side).
      const hub = await apiFetch<HubKycSubmission>("/api/hub/kyc", {
        method: "POST",
        authed: true,
        body: {
          country: submission.country,
          bvn: submission.bvn || undefined,
          nin: submission.nin || undefined,
          nationalIdEquivalent: submission.nationalIdEquivalent || undefined,
          idDocumentType: submission.idDocumentType,
          idDocumentUrl: submission.idDocumentUrl,
          payoutBankName: submission.payoutBankName,
          payoutAccountNumber: submission.payoutAccountNumber,
        },
      });
      const mapped = fromHub(hub);
      // Keep the session's creator.kyc in sync with the submission — the
      // dashboard reads currentSession.creator.kyc via creatorGates(), and
      // a submission the session doesn't know about can never unlock it.
      setKycStatus(mapped.status);
      return mapped;
    } catch {
      const updated: KycSubmission = { ...kycSubmission, ...submission, status: "pending" };
      Object.assign(kycSubmission, updated);
      setKycStatus(updated.status);
      // SEAM: replace with POST /api/hub/kyc
      return mockRequest({ ...updated }, 800);
    }
  },
};

/**
 * DEV ONLY — remove when the session endpoint is live.
 *
 * KYC review happens off-platform (manual, 1-3 days); there is no in-app
 * action that moves a submission to approved/rejected yet. This lets the
 * preview switcher move through every status while keeping kycSubmission
 * and currentSession.creator.kyc in sync, instead of flipping local view
 * state that the rest of the app never sees.
 */
export function devSetKycStatus(status: KycStatus): void {
  kycSubmission.status = status;
  setKycStatus(status);
}
