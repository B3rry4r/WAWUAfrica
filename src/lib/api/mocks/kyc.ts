import type { KycSubmission } from "@/types/kyc";

export const kycSubmission: KycSubmission = {
  country: "Nigeria",
  bvn: "",
  nin: "",
  idDocumentType: "national_id_card",
  payoutBankName: "GTBank",
  payoutAccountNumber: "0123456789",
  status: "pending",
  submittedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
};
