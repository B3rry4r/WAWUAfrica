import type { KycStatus } from "./account";

export type IdDocumentType = "passport" | "national_id_card" | "drivers_licence";

/**
 * Manual KYC. Nigeria: BVN + NIN. Elsewhere: national-ID equivalent.
 * The API contract for §3.5 is still being defined by backend, so the UI
 * submits against this shape and the mock is the source of truth for now.
 */
export interface KycSubmission {
  country: string;
  bvn?: string;
  nin?: string;
  nationalIdEquivalent?: string;
  idDocumentType: IdDocumentType;
  idDocumentUrl?: string;
  payoutBankName: string;
  payoutAccountNumber: string;
  status: KycStatus;
  rejectionReason?: string;
  /**
   * ISO timestamps from the KycSubmission row. Undefined only for the
   * synthesised "not_started" record (no row exists yet). Without these the
   * creator had no way to see WHEN they submitted, so a submission that had
   * been sitting in review for a week looked identical to one sent a minute
   * ago — and identical to never having submitted at all.
   */
  submittedAt?: string;
  reviewedAt?: string;
}

export interface KycRequirement {
  id: "bvn" | "nin";
  label: string;
  help: string;
}
