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

export async function getOwnProfile(): Promise<OwnProfile> {
  return getMockOwnProfile();
}

export async function saveProfile(draft: OwnProfileDraft): Promise<OwnProfile> {
  return saveMockOwnProfile(draft);
}

export async function getVerificationLadder(): Promise<VerificationLevelEntry[]> {
  return getMockLadder();
}

export async function getVerificationSubmissions(): Promise<VerificationSubmission[]> {
  return getMockVerificationSubmissions();
}

export async function submitVerification(tier: VerificationLevel): Promise<VerificationSubmission> {
  return submitMockVerification(tier);
}

export async function resubmitVerification(tier: VerificationLevel): Promise<VerificationSubmission> {
  return resubmitMockVerification(tier);
}