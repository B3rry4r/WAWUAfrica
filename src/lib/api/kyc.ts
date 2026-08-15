import { mockRequest } from "./client";
import { kycSubmission } from "./mocks/kyc";
import type { KycSubmission } from "@/types/kyc";

export interface KycApi {
  getStatus: () => Promise<KycSubmission>;
  submit: (submission: KycSubmission) => Promise<KycSubmission>;
}

export const kycApi: KycApi = {
  getStatus: () => mockRequest({ ...kycSubmission }),

  submit: async (submission) => {
    const updated: KycSubmission = { ...kycSubmission, ...submission, status: "pending" };
    Object.assign(kycSubmission, updated);
    return mockRequest({ ...updated }, 800);
  },
};
