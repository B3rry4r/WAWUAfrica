import { mockRequest } from "./client";
import { kycSubmission } from "./mocks/kyc";
import type { KycSubmission } from "@/types/kyc";

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
    // SEAM: replace with POST /api/hub/creator/kyc
    return mockRequest({ ...updated }, 800);
  },
};
