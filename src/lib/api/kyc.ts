import { mockRequest } from "./client";
import { kycSubmission } from "./mocks/kyc";
import { setKycStatus } from "./mocks/session";
import type { KycSubmission } from "@/types/kyc";
import type { KycStatus } from "@/types/account";

export interface KycApi {
  getStatus: () => Promise<KycSubmission>;
  submit: (submission: KycSubmission) => Promise<KycSubmission>;
}

export const kycApi: KycApi = {
  // SEAM: replace with GET /api/hub/creator/kyc
  getStatus: () => mockRequest({ ...kycSubmission }),

  submit: async (submission) => {
    const updated: KycSubmission = { ...kycSubmission, ...submission, status: "pending" };
    Object.assign(kycSubmission, updated);
    // Keep the session's creator.kyc in sync with the submission — the
    // dashboard reads currentSession.creator.kyc via creatorGates(), and
    // a submission the session doesn't know about can never unlock it.
    setKycStatus(updated.status);
    // SEAM: replace with POST /api/hub/creator/kyc
    return mockRequest({ ...updated }, 800);
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
