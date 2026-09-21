import type { OwnProfile, OwnProfileDraft, VerificationKind, VerificationState } from "@/types/verification";
import type { ProfileExperience } from "@/types/profile";
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
  // All four the reference draws, so mock mode shows the owner's row as the
  // real one will. `monthlyViews` is the owner-only figure.
  // All four figures the reference draws, plus the completeness the ring and
  // the strength checklist both read. `missing` deliberately still has two
  // entries: a fixture showing a finished profile never exercises the card
  // that exists to get somebody to finish one.
  stats: {
    published: 4,
    sales: 86,
    followers: "2.4k",
    following: "312",
    monthlyViews: "12.4k",
    completenessPct: 60,
    completenessMissing: ["cover", "links"],
  },
  interests: ["Agriculture", "Business", "Trade"],
  headline: "Chief Steward, WAWU",
  company: "WAWU Africa",
  /*
    Three roles, chosen to exercise the three cases the header has to draw
    rather than to look full: one CURRENT role with no end date, one finished
    role that started LATER than the current one (so a single sort on
    startedOn would put it in the wrong place), and one with no location and
    no description at all.
  */
  experience: [
    {
      id: "exp-1",
      title: "Chief Steward",
      company: "WAWU Africa",
      location: "Lagos, Nigeria",
      startedOn: "2023-03",
      endedOn: null,
      current: true,
      description:
        "Building a creator economy for Africa and beyond. Empowering creators, businesses and communities through technology, opportunity and ownership.",
    },
    {
      id: "exp-2",
      title: "Business Development Lead",
      company: "Sahel Trading Co",
      location: "Abuja, Nigeria",
      startedOn: "2019-06",
      endedOn: "2023-02",
      current: false,
      description: "Took 40 market traders through CAC registration and into their first wholesale contracts.",
    },
    {
      id: "exp-3",
      title: "Bookkeeper",
      company: "Okonkwo & Sons",
      location: null,
      startedOn: "2016-01",
      endedOn: "2019-05",
      current: false,
      description: null,
    },
  ],
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
  MOCK_OWN_PROFILE.company = draft.company;
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

/* ------------------------- the experience list -------------------------- */

/**
 * The mock side of the three experience calls.
 *
 * These mutate MOCK_OWN_PROFILE in place, like saveMockOwnProfile above, so
 * a row added on the edit screen is still there when the profile reads itself
 * back. They keep the SERVER'S ordering rule rather than appending: current
 * role first, then newest first. A mock that ordered differently from the API
 * would make the list look wrong in mock mode and right in production, which
 * is the one direction a fixture must never fail in.
 */
function sortExperience(rows: ProfileExperience[]): ProfileExperience[] {
  return [...rows].sort((a, b) => {
    if (a.current !== b.current) return a.current ? -1 : 1;
    return b.startedOn.localeCompare(a.startedOn);
  });
}

export async function addMockExperience(draft: {
  title: string;
  company: string;
  location?: string | null;
  startedOn: string;
  endedOn?: string | null;
  description?: string | null;
}): Promise<ProfileExperience> {
  await delay(350);
  const row: ProfileExperience = {
    id: `exp-${Date.now()}`,
    title: draft.title,
    company: draft.company,
    location: draft.location ?? null,
    startedOn: draft.startedOn,
    endedOn: draft.endedOn ?? null,
    current: !draft.endedOn,
    description: draft.description ?? null,
  };
  MOCK_OWN_PROFILE.experience = sortExperience([...MOCK_OWN_PROFILE.experience, row]);
  return { ...row };
}

export async function editMockExperience(
  id: string,
  draft: Partial<{
    title: string;
    company: string;
    location: string | null;
    startedOn: string;
    endedOn: string | null;
    description: string | null;
  }>,
): Promise<ProfileExperience> {
  await delay(350);
  const existing = MOCK_OWN_PROFILE.experience.find((r) => r.id === id);
  if (!existing) throw new Error("Experience not found");
  const next: ProfileExperience = {
    ...existing,
    ...draft,
    // Derived on the server, so derived here too rather than taken from the
    // patch: a mock that let a caller set `current` directly would allow the
    // contradictory state the schema exists to prevent.
    current:
      draft.endedOn !== undefined ? draft.endedOn === null : existing.current,
  };
  MOCK_OWN_PROFILE.experience = sortExperience(
    MOCK_OWN_PROFILE.experience.map((r) => (r.id === id ? next : r)),
  );
  return { ...next };
}

export function removeMockExperience(id: string): void {
  MOCK_OWN_PROFILE.experience = MOCK_OWN_PROFILE.experience.filter((r) => r.id !== id);
}
