import type {
  OwnProfile,
  OwnProfileDraft,
} from "@/types/verification";
import { delay } from "../client";

/**
 * Mock for the signed-in user's own profile. Mirrors the session mock's identity
 * (Amara Okafor, creator, Basic tier, KYC pending) so /profile stays coherent
 * with the session provider.
 */
export const MOCK_OWN_PROFILE: OwnProfile = {
  wawuId: "wawu-me",
  firstName: "Adaeze",
  middleName: "",
  lastName: "Okonkwo",
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

// SEAM: replace with GET /api/hub/verification/submissions

// SEAM: replace with POST /api/hub/verification/submit

// SEAM: replace with POST /api/hub/verification/submit

/*
 * The ladder/submission mocks that used to live here are gone. They had no
 * callers — getVerificationLadder() has no mock fallback path — and they
 * carried the OLD rung copy, including "Government ID submitted and approved
 * by hand", which is a description of the KYC identity check rather than of
 * the public trust badge. Leaving a dead fixture that says the wrong thing is
 * how the wrong thing gets copied back in.
 */
