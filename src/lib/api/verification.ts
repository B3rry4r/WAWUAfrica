import type { VerificationLevel } from "@/types/account";
import type {
  OwnProfile,
  OwnProfileDraft,
  VerificationLevelEntry,
  VerificationSubmission,
} from "@/types/verification";
import {
  getMockLadder,
  getMockOwnProfile,
  getMockVerificationSubmissions,
  resubmitMockVerification,
  saveMockOwnProfile,
  submitMockVerification,
} from "./mocks/verification";

// SEAM: replace with GET /api/hub/profile
export async function getOwnProfile(): Promise<OwnProfile> {
  return getMockOwnProfile();
}

// SEAM: replace with PATCH /api/hub/profile
export async function saveProfile(draft: OwnProfileDraft): Promise<OwnProfile> {
  return saveMockOwnProfile(draft);
}

// SEAM: replace with GET /api/hub/verification/ladder
export async function getVerificationLadder(): Promise<VerificationLevelEntry[]> {
  return getMockLadder();
}

// SEAM: replace with GET /api/hub/verification/submissions
export async function getVerificationSubmissions(): Promise<VerificationSubmission[]> {
  return getMockVerificationSubmissions();
}

// SEAM: replace with POST /api/hub/verification/submit
export async function submitVerification(tier: VerificationLevel): Promise<VerificationSubmission> {
  return submitMockVerification(tier);
}

// SEAM: replace with POST /api/hub/verification/submit
export async function resubmitVerification(tier: VerificationLevel): Promise<VerificationSubmission> {
  return resubmitMockVerification(tier);
}