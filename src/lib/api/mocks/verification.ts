import type { VerificationLevel } from "@/types/account";
import type {
  OwnProfile,
  OwnProfileDraft,
  VerificationLevelEntry,
  VerificationSubmission,
} from "@/types/verification";
import { delay } from "../client";

/**
 * Mock for the signed-in user's own profile. Mirrors the session mock's identity
 * (Amara Okafor, creator, Basic tier, KYC pending) so /profile stays coherent
 * with the session provider.
 */
export const MOCK_OWN_PROFILE: OwnProfile = {
  wawuId: "wawu-me",
  name: "Amara Okafor",
  handle: "amara",
  email: "amara@example.com",
  bio: "Teaching farmers the paperwork side of agribusiness.",
  accountType: "creator",
  verification: "verified_user",
  plan: "basic",
  stats: { published: 4, sales: 86, followers: "2.4k" },
  interests: ["Agriculture", "Business", "Trade"],
  socials: { instagram: "amara.okafor", whatsapp: "08012345678" },
  credits: 48,
  earningsThisMonth: 184500,
  toReply: 3,
  contentSlots: { published: 4, total: 7 },
};

export const MOCK_VERIFICATION_LADDER: VerificationLevelEntry[] = [
  { tier: "basic", status: "done", copy: "Phone and email confirmed." },
  { tier: "verified_user", status: "yours", copy: "Government ID submitted and approved by hand." },
  { tier: "verified_business", status: "next", copy: "Business documents, plus a website or active socials." },
  { tier: "certified_professional", status: "locked", copy: "A professional qualification or a practising licence." },
  { tier: "trusted_partner", status: "locked", copy: "Applied and approved as a WAWU partner." },
];

/** Level submissions, newest first. Mirrors frame 6's three status cards. */
export const MOCK_VERIFICATION_SUBMISSIONS: VerificationSubmission[] = [
  { tier: "verified_business", status: "in_review", submittedAt: "12 August" },
  { tier: "verified_user", status: "approved", submittedAt: "2 July", reviewedAt: "2 July" },
  {
    tier: "certified_professional",
    status: "rejected",
    submittedAt: "2 July",
    reviewedAt: "4 August",
    reason:
      "The certificate you sent has expired. Send a current one, or a letter from the issuing body confirming you still hold it.",
  },
];

// SEAM: replace with GET /api/hub/profile
export async function getMockOwnProfile(): Promise<OwnProfile> {
  await delay(350);
  return { ...MOCK_OWN_PROFILE, socials: { ...MOCK_OWN_PROFILE.socials } };
}

// SEAM: replace with PATCH /api/hub/profile
export async function saveMockOwnProfile(draft: OwnProfileDraft): Promise<OwnProfile> {
  await delay(450);
  MOCK_OWN_PROFILE.name = draft.name;
  MOCK_OWN_PROFILE.handle = draft.handle;
  MOCK_OWN_PROFILE.bio = draft.bio;
  MOCK_OWN_PROFILE.interests = [...draft.interests];
  MOCK_OWN_PROFILE.socials = { ...draft.socials };
  return { ...MOCK_OWN_PROFILE, socials: { ...MOCK_OWN_PROFILE.socials } };
}

// SEAM: replace with GET /api/hub/verification/ladder
export async function getMockLadder(): Promise<VerificationLevelEntry[]> {
  await delay(300);
  return MOCK_VERIFICATION_LADDER;
}

// SEAM: replace with GET /api/hub/verification/submissions
export async function getMockVerificationSubmissions(): Promise<VerificationSubmission[]> {
  await delay(300);
  return MOCK_VERIFICATION_SUBMISSIONS;
}

// SEAM: replace with POST /api/hub/verification/submit
export async function submitMockVerification(tier: VerificationLevel): Promise<VerificationSubmission> {
  await delay(500);
  const submission: VerificationSubmission = { tier, status: "in_review", submittedAt: "Today" };
  MOCK_VERIFICATION_SUBMISSIONS.unshift(submission);
  return submission;
}

// SEAM: replace with POST /api/hub/verification/submit
export async function resubmitMockVerification(tier: VerificationLevel): Promise<VerificationSubmission> {
  return submitMockVerification(tier);
}