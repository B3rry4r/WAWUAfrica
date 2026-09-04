import type { AccountType, CreatorTier, VerificationLevel } from "@/types/account";
import type {
  OwnProfile,
  OwnProfileDraft,
  VerificationLadderStatus,
  VerificationLevelEntry,
  VerificationSubmission,
  VerificationSubmissionStatus,
} from "@/types/verification";
import { apiFetch, isMockModeError } from "./client";
import { getMockOwnProfile, saveMockOwnProfile } from "./mocks/verification";

/**
 * Hub API wire shapes — verification-submission.service.ts /
 * verification-submission.controller.ts (`@Controller('verification')`,
 * mounted under the global `api/hub` prefix). Owns the submission/review
 * workflow only; the badge *tier* itself is WAWU ID's own `verificationTier`
 * JWT claim (see auth.ts's mapVerificationTier) — this is a genuinely
 * different resource from kyc.ts's KycSubmission, per CLAUDE.md.
 */
interface HubVerificationSubmission {
  id: string;
  wawuUserId: string;
  tier: VerificationLevel;
  documents: string[];
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

/** GET /api/hub/verification/ladder entry — derived, not its own table. */
interface HubVerificationLadderEntry {
  tier: VerificationLevel;
  achieved: boolean;
  currentTier: boolean;
  submission: HubVerificationSubmission | null;
}

const SUBMISSION_STATUS_MAP: Record<HubVerificationSubmission["status"], VerificationSubmissionStatus> = {
  pending: "in_review",
  approved: "approved",
  rejected: "rejected",
};

/**
 * Static per-tier "why this level" copy. The real ladder endpoint returns
 * only {tier, achieved, currentTier, submission} — no descriptive text — so
 * this supplies the wording for every rung.
 *
 * COPY RULE: every rung describes a BADGE APPLICATION made on this screen.
 * None of it may describe what creator KYC collects.
 *
 * `verified_user` used to read "Government ID submitted and approved by
 * hand." — an exact description of the KYC identity check (BVN/NIN + ID
 * document + payout bank, POST /api/hub/kyc). Creators who had just finished
 * KYC read that rung as a promise that their submission counted towards it,
 * came here expecting to see it move, and saw an unchanged ladder. The two
 * systems are independent by product rule (CLAUDE.md) and the copy now says
 * so out loud on the rung that caused the confusion.
 */
const TIER_COPY: Record<VerificationLevel, string> = {
  basic: "Phone and email confirmed. Every account starts here.",
  verified_user:
    "Apply with photo ID so buyers can see a real, named person is behind this account. Not the same as the KYC identity check that unlocks getting paid.",
  verified_business:
    "Apply with your business registration, plus a website or active socials in the same trading name.",
  certified_professional:
    "Apply with a current professional qualification or practising licence, confirmed by the body that issued it.",
  trusted_partner: "Awarded by the WAWU partnerships team under a signed partnership agreement.",
};

/** Mirrors VERIFICATION_TIER_VALUES (verification-submission's DTO-side copy of the frozen Prisma enum). */
const TIER_ORDER: VerificationLevel[] = [
  "basic",
  "verified_user",
  "verified_business",
  "certified_professional",
  "trusted_partner",
];

function formatSubmissionDate(iso: string | null): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "long" });
}

function fromHubSubmission(hub: HubVerificationSubmission): VerificationSubmission {
  return {
    tier: hub.tier,
    status: SUBMISSION_STATUS_MAP[hub.status],
    submittedAt: formatSubmissionDate(hub.submittedAt),
    reviewedAt: formatSubmissionDate(hub.reviewedAt),
    reason: hub.rejectionReason ?? undefined,
  };
}

/**
 * The real ladder only tells us achieved/currentTier per rank — the
 * frontend's four-state status (done/yours/next/locked) is derived here:
 * the caller's own tier is "yours", every achieved rank below it is "done",
 * the rank immediately above it is "next", everything further out is
 * "locked".
 */
function fromHubLadder(entries: HubVerificationLadderEntry[]): VerificationLevelEntry[] {
  const currentRank = entries.findIndex((e) => e.currentTier);
  return entries.map((e) => {
    const rank = TIER_ORDER.indexOf(e.tier);
    const status: VerificationLadderStatus = e.currentTier
      ? "yours"
      : e.achieved
        ? "done"
        : rank === currentRank + 1
          ? "next"
          : "locked";
    return {
      tier: e.tier,
      status,
      copy: TIER_COPY[e.tier],
      // The endpoint already returns the caller's own submission per rung —
      // it was being dropped here, so a rung with an application in review
      // rendered identically to one never applied for ("Start", no state).
      submission: e.submission ? fromHubSubmission(e.submission) : undefined,
    };
  });
}

/**
 * GET /api/hub/users/me response — UserProfile columns merged with the
 * caller's WAWU ID JWT claims (Hub API's `UserProfileWithClaims`; verified
 * directly against WAWU-Hub-API's user-profile.controller.ts /
 * user-profile.service.ts / wawu-jwt-claims.interface.ts). Only the fields
 * this module actually reads are declared — `fullName` does not exist here
 * (WAWU ID splits it into firstName/lastName; the combined `fullName` only
 * comes back from WAWU ID's own /auth/login response, see auth.ts).
 */
interface HubMeResponse {
  wawuUserId: string;
  email: string | null;
  firstName: string;
  /** Optional: WAWU ID only started storing it when sign-up split the name. */
  middleName?: string | null;
  lastName: string;
  verificationTier: string;
  accountType: AccountType | null;
  handle: string | null;
  bio: string | null;
  interests: string[];
  instagramHandle: string | null;
  whatsappHandle: string | null;
  xHandle: string | null;
  tiktokHandle: string | null;
  youtubeUrl: string | null;
  facebookUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  avatarUrl: string | null;
  coverUrl: string | null;
}

/** PATCH /api/hub/users/me body — exactly UpdateUserProfileDto's field set. No `name`/`fullName` field exists on this DTO at all (see getOwnProfile's HubMeResponse doc comment) — never invent one. */
interface UpdateUserProfileBody {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  interests?: string[];
  bio?: string;
  handle?: string;
  instagramHandle?: string;
  whatsappHandle?: string;
  xHandle?: string;
  tiktokHandle?: string;
  /** A handle or a link; the API expands a handle. */
  youtubeUrl?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  /** A full URL, always. */
  websiteUrl?: string;
  avatarUrl?: string;
  coverUrl?: string;
}

/** GET /api/hub/creator/state subset this module reads — see auth.ts's identical HubCreatorStateResponse for the full shape. */
interface HubCreatorStateForProfile {
  tier: CreatorTier;
  slotsUsed: number;
  slotsTotal: number;
}

/** GET /api/hub/content/mine/earnings subset this module reads — see earnings.ts's EarningsSummary for the full shape. */
interface HubEarningsForProfile {
  total: number;
}

/** GET /api/hub/credits — see communities.ts's CreditsState for the full shape (creditBalance, trialEndsAt). */
interface HubCreditsForProfile {
  creditBalance: number;
}

/**
 * WAWU ID's verificationTier is a 6-value union; local copy of auth.ts's
 * mapVerificationTier (not exported there) — folds the admin/partner-only
 * 'official' tier onto 'trusted_partner', same reasoning as auth.ts.
 */
function mapVerificationTier(tier: string): VerificationLevel {
  if (tier === "official") return "trusted_partner";
  return (TIER_ORDER as string[]).includes(tier) ? (tier as VerificationLevel) : "basic";
}

/**
 * Assembles the real OwnProfile from every endpoint that genuinely has a
 * piece of it: GET /api/hub/users/me (identity/handle/bio/interests/socials,
 * always) plus, for creator accounts only, GET /api/hub/creator/state
 * (plan/contentSlots), GET /api/hub/content/mine/earnings (earningsThisMonth),
 * and GET /api/hub/credits (credits, both account types).
 *
 * `stats.sales`, `stats.followers`, and `toReply` have NO real source in any
 * of the above (see OwnProfileStats' doc comments and OwnProfile's `toReply`
 * field) — left undefined rather than invented; profile/page.tsx only
 * renders them when present.
 *
 * Per the no-mock-fallback policy, a real failure from ANY of these calls
 * (users/me, creator/state, earnings, or credits) throws and propagates to
 * the caller — no bare catch silently substitutes a default or a mock value
 * for a real backend error. Only the outer Pattern-A gate below distinguishes
 * a genuine no-backend-configured dev/demo mode (MockModeError) from a real
 * failure: the former falls back to the full mock profile, the latter throws.
 */
export async function getOwnProfile(): Promise<OwnProfile> {
  try {
    const me = await apiFetch<HubMeResponse>("/api/hub/users/me", { authed: true });
    const accountType: AccountType = me.accountType ?? "user";
    const name =
      [me.firstName, me.middleName, me.lastName].filter(Boolean).join(" ").trim() ||
      me.handle ||
      "WAWU member";

    let plan: CreatorTier = "basic";
    let contentSlots: OwnProfile["contentSlots"];
    let published = 0;
    let earningsThisMonth: number | undefined;

    if (accountType === "creator") {
      const state = await apiFetch<HubCreatorStateForProfile>("/api/hub/creator/state", { authed: true });
      plan = state.tier;
      contentSlots = { published: state.slotsUsed, total: state.slotsTotal };
      published = state.slotsUsed;

      const earnings = await apiFetch<HubEarningsForProfile>("/api/hub/content/mine/earnings", { authed: true });
      // KNOWN BACKEND GAP: `total` is an all-time aggregate — the real
      // contract has no month-scoped figure at all (confirmed against
      // creator-earnings.service.ts: no date filtering anywhere in it).
      // Using it as the best available stand-in for "this month" rather
      // than inventing a monthly figure that doesn't exist.
      earningsThisMonth = earnings.total;
    }

    const creditsState = await apiFetch<HubCreditsForProfile>("/api/hub/credits", { authed: true });
    const credits = creditsState.creditBalance;

    return {
      wawuId: me.wawuUserId,
      firstName: me.firstName ?? "",
      middleName: me.middleName ?? "",
      lastName: me.lastName ?? "",
      name,
      handle: me.handle ?? "",
      email: me.email ?? "",
      bio: me.bio ?? "",
      accountType,
      verification: mapVerificationTier(me.verificationTier),
      plan,
      stats: { published, sales: undefined, followers: undefined },
      interests: me.interests ?? [],
      socials: {
        instagram: me.instagramHandle ?? undefined,
        whatsapp: me.whatsappHandle ?? undefined,
        x: me.xHandle ?? undefined,
        tiktok: me.tiktokHandle ?? undefined,
        youtube: me.youtubeUrl ?? undefined,
        facebook: me.facebookUrl ?? undefined,
        linkedin: me.linkedinUrl ?? undefined,
        website: me.websiteUrl ?? undefined,
      },
      avatarUrl: me.avatarUrl ?? null,
      coverUrl: me.coverUrl ?? null,
      credits,
      earningsThisMonth,
      toReply: undefined,
      contentSlots,
    };
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with GET /api/hub/users/me [+ GET /api/hub/creator/state, GET /api/hub/content/mine/earnings, GET /api/hub/credits]
    return getMockOwnProfile();
  }
}

/**
 * Wires PATCH /api/hub/users/me exactly to UpdateUserProfileDto's field set
 * (interests/bio/handle/instagramHandle/whatsappHandle) — `draft.name` is
 * deliberately NOT sent; the DTO has no name/fullName field at all (WAWU ID
 * owns firstName/lastName, not writable through this endpoint). See
 * ProfileEditPage's disabled name field, which reflects this same real
 * constraint instead of pretending the save persisted it.
 */
export async function saveProfile(draft: OwnProfileDraft): Promise<OwnProfile> {
  try {
    await apiFetch<unknown>("/api/hub/users/me", {
      method: "PATCH",
      authed: true,
      body: {
        // Names live in WAWU ID; the hub proxies them. Sent together, because
        // a partial rename would land a new surname beside an old first name.
        firstName: draft.firstName,
        middleName: draft.middleName,
        lastName: draft.lastName,
        interests: draft.interests,
        bio: draft.bio,
        handle: draft.handle,
        instagramHandle: draft.socials.instagram ?? "",
        whatsappHandle: draft.socials.whatsapp ?? "",
        xHandle: draft.socials.x ?? "",
        tiktokHandle: draft.socials.tiktok ?? "",
        // Sent even when empty, so a social link can be REMOVED. These used
        // to be omitted when blank, because the API validated them as URLs
        // and rejected "" - which meant that once you added a link you could
        // never take it off your profile. They take handles now, so an empty
        // value clears the field like every other one on this form.
        youtubeUrl: draft.socials.youtube ?? "",
        facebookUrl: draft.socials.facebook ?? "",
        linkedinUrl: draft.socials.linkedin ?? "",
        // websiteUrl is still validated as a URL, so it keeps the old
        // treatment: send it only when there is something valid to send.
        ...(draft.socials.website ? { websiteUrl: draft.socials.website } : {}),
        ...(draft.avatarUrl ? { avatarUrl: draft.avatarUrl } : {}),
        ...(draft.coverUrl ? { coverUrl: draft.coverUrl } : {}),
      } satisfies UpdateUserProfileBody,
    });
    // Re-fetch rather than hand-map the PATCH response: upsertMe's response
    // is the raw UserProfile row only (no merged JWT claims), so it can't
    // produce a correct OwnProfile on its own — getOwnProfile already knows
    // how to assemble the full real shape.
    return await getOwnProfile();
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with PATCH /api/hub/users/me
    return saveMockOwnProfile(draft);
  }
}

export async function getVerificationLadder(): Promise<VerificationLevelEntry[]> {
  const entries = await apiFetch<HubVerificationLadderEntry[]>("/api/hub/verification/ladder", {
    authed: true,
  });
  return fromHubLadder(entries);
}

export async function getVerificationSubmissions(): Promise<VerificationSubmission[]> {
  const submissions = await apiFetch<HubVerificationSubmission[]>("/api/hub/verification/submissions", {
    authed: true,
  });
  return submissions.map(fromHubSubmission);
}

/**
 * `documents` defaults to `[]` so existing call sites (which don't yet
 * collect real document URLs — see VerificationApplyForm's `uploaded`
 * state, local filenames only) keep compiling unchanged. An empty array
 * makes the real POST 400 (ArrayNotEmpty on the Hub's
 * CreateVerificationSubmissionDto) — that real rejection now propagates to
 * the caller as a real error rather than being masked by a mock fallback.
 */
export async function submitVerification(
  tier: VerificationLevel,
  documents: string[] = [],
): Promise<VerificationSubmission> {
  const hub = await apiFetch<HubVerificationSubmission>("/api/hub/verification/submissions", {
    method: "POST",
    authed: true,
    body: { tier, documents },
  });
  return fromHubSubmission(hub);
}

/**
 * The real endpoint resubmits a specific submission by id
 * (`POST /api/hub/verification/submissions/:id/resubmit`), not by tier —
 * unlike this function's existing tier-only signature. Looks up the
 * caller's own rejected submission for that tier first. `documents`
 * defaults to `[]` for the same call-site-compat reason as submitVerification.
 */
export async function resubmitVerification(
  tier: VerificationLevel,
  documents: string[] = [],
): Promise<VerificationSubmission> {
  const mine = await apiFetch<HubVerificationSubmission[]>("/api/hub/verification/submissions", {
    authed: true,
  });
  const target = mine.find((s) => s.tier === tier && s.status === "rejected");
  if (!target) throw new Error(`No rejected ${tier} submission to resubmit`);
  const hub = await apiFetch<HubVerificationSubmission>(
    `/api/hub/verification/submissions/${target.id}/resubmit`,
    { method: "POST", authed: true, body: { documents } },
  );
  return fromHubSubmission(hub);
}
