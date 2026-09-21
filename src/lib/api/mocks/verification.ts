import type { OwnProfile, OwnProfileDraft, VerificationKind, VerificationState } from "@/types/verification";
import { delay } from "../client";

/** One fixed date, so fixtures do not shift under a snapshot. */
const MOCK_TICK_EXPIRY = "2027-03-14T00:00:00.000Z";

/**
 * Builds a VerificationState for a fixture.
 *
 * Every other mock file calls this instead of hand-writing the nested
 * object, so a fixture cannot drift from the contract shape and a fixture
 * holding both ticks looks exactly like one holding neither, minus the
 * argument.
 *
 * Declared ABOVE the fixtures that call it, and so is MOCK_TICK_EXPIRY: a
 * `const` read during another module-level initialiser in the same file is a
 * temporal-dead-zone crash at import time, which is how this first showed up
 * (the whole /explore route failed to build).
 */
export function mockVerification(held: VerificationKind[] = []): VerificationState {
  return {
    creator: { verified: held.includes("creator"), expiresAt: held.includes("creator") ? MOCK_TICK_EXPIRY : null },
    professional: {
      verified: held.includes("professional"),
      expiresAt: held.includes("professional") ? MOCK_TICK_EXPIRY : null,
    },
  };
}

/**
 * Mock for the signed-in user's own profile. Mirrors the session mock's identity
 * (Amara Okafor, creator, KYC pending) so /profile stays coherent with the
 * session provider.
 *
 * She holds NEITHER tick, deliberately. Unverified is the state the whole of
 * build brief B1 is about, so it is the one a fixture build should open on:
 * it makes the persistent prompt, the purchase screen and the verified-only
 * event gate all reachable without editing anything. Ticks rendering on
 * other people are covered by the creator, search and explore fixtures.
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
  verification: mockVerification([]),
  plan: "basic",
  stats: { published: 4, sales: 86, followers: "2.4k" },
  interests: ["Agriculture", "Business", "Trade"],
  socials: { instagram: "amara.okafor", whatsapp: "08012345678" },
  avatarUrl: null,
  coverUrl: null,
  credits: 48,
  earningsThisMonth: 184500,
  toReply: 3,
  contentSlots: { published: 4, total: 7 },
};

function cloneVerification(v: VerificationState): VerificationState {
  return { creator: { ...v.creator }, professional: { ...v.professional } };
}

// SEAM: replace with GET /api/hub/users/me
export async function getMockOwnProfile(): Promise<OwnProfile> {
  await delay(350);
  return {
    ...MOCK_OWN_PROFILE,
    socials: { ...MOCK_OWN_PROFILE.socials },
    verification: cloneVerification(MOCK_OWN_PROFILE.verification),
  };
}

// SEAM: replace with PATCH /api/hub/users/me
export async function saveMockOwnProfile(draft: OwnProfileDraft): Promise<OwnProfile> {
  await delay(450);
  MOCK_OWN_PROFILE.name = draft.name;
  MOCK_OWN_PROFILE.handle = draft.handle;
  MOCK_OWN_PROFILE.bio = draft.bio;
  MOCK_OWN_PROFILE.interests = [...draft.interests];
  MOCK_OWN_PROFILE.socials = { ...draft.socials };
  // The avatar/cover survive the save in mock mode too. Without this a real
  // FilePicker upload vanished the moment the edit page read its OWN profile
  // back — and the header avatar patch (updateUser) had null to work with.
  MOCK_OWN_PROFILE.avatarUrl = draft.avatarUrl;
  MOCK_OWN_PROFILE.coverUrl = draft.coverUrl;
  return {
    ...MOCK_OWN_PROFILE,
    socials: { ...MOCK_OWN_PROFILE.socials },
    verification: cloneVerification(MOCK_OWN_PROFILE.verification),
  };
}

/*
 * The ladder/submission mocks that used to live here are gone, and so is the
 * ladder itself. There is no rung to apply for any more: two ticks, bought,
 * annual, independent. See src/lib/api/verification.ts.
 *
 * The price list is NOT here either, on purpose. It is not fixture data: it
 * is the published price of a real product, so it lives in config
 * (src/lib/verification-offers.ts) where a component can never reach past it.
 */
