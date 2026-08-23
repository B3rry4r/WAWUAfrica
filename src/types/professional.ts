import type { CategoryId } from "@/lib/categories";
import type { VerificationLevel } from "./account";

/**
 * What a professional offers their credential as evidence of.
 *
 * Regulated fields accept `licence` only. Everywhere else there is usually no
 * issuing body to check with, so a portfolio is a real answer rather than a
 * weaker one.
 */
export type CredentialKind = "licence" | "qualification" | "portfolio";

export const CREDENTIAL_LABEL: Record<CredentialKind, string> = {
  licence: "Practising licence",
  qualification: "Qualification or certification",
  portfolio: "Work history and samples",
};

/**
 * Categories where a licence is required and will be confirmed with the body
 * that issued it. Mirrors REGULATED_CATEGORIES in the Hub API — the API is
 * the enforcer; this copy exists so the form can ask for the right things
 * instead of letting someone fill in a page and get a 400.
 */
export const REGULATED_CATEGORIES: CategoryId[] = [
  "legal_services",
  "healthcare",
  "finance",
  "insurance_pensions",
];

export function isRegulatedCategory(id: CategoryId | ""): boolean {
  return REGULATED_CATEGORIES.includes(id as CategoryId);
}

export type ProfessionalStatus = "pending" | "approved" | "rejected";

/** A professional as they appear in the directory. */
export interface ProfessionalListing {
  id: string;
  wawuId: string;
  name: string;
  handle: string | null;
  category: CategoryId;
  headline: string;
  services: string[];
  verification: VerificationLevel;
  pieceCount: number;
  /** Whether they can be paid-messaged right now. */
  dmEnabled: boolean;
  dmPrice: number | null;
  dmResponseHours: number;
}

/** One professional in full. */
export interface ProfessionalDetail extends Omit<ProfessionalListing, "services"> {
  about: string;
  services: string[];
  /**
   * Who certified them. The licence NUMBER is deliberately never sent to the
   * app — a buyer can check the register themselves, but the number is an
   * identifier that could be used to impersonate its holder.
   */
  issuingBody: string | null;
  credentialKind: CredentialKind;
}

/** The caller's own application in one category. */
export interface MyProfessionalApplication {
  id: string;
  category: CategoryId;
  headline: string;
  about: string;
  services: string[];
  credentialKind: CredentialKind;
  issuingBody: string | null;
  status: ProfessionalStatus;
  rejectionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  listed: boolean;
}

export interface ProfessionalApplicationDraft {
  category: CategoryId | "";
  headline: string;
  about: string;
  services: string[];
  credentialKind: CredentialKind;
  licenceNumber: string;
  issuingBody: string;
  documents: string[];
}
