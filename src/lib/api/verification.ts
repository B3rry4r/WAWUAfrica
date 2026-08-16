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
import {
  getMockLadder,
  getMockOwnProfile,
  getMockVerificationSubmissions,
  resubmitMockVerification,
  saveMockOwnProfile,
  submitMockVerification,
} from "./mocks/verification";

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
 * this mirrors the design copy from the mock ladder (MOCK_VERIFICATION_LADDER)
 * to keep the UI's wording identical whether the ladder came from a real or
 * mock response.
 */
const TIER_COPY: Record<VerificationLevel, string> = {
  basic: "Phone and email confirmed.",
  verified_user: "Government ID submitted and approved by hand.",
  verified_business: "Business documents, plus a website or active socials.",
  certified_professional: "A professional qualification or a practising licence.",
  trusted_partner: "Applied and approved as a WAWU partner.",
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
    return { tier: e.tier, status, copy: TIER_COPY[e.tier] };
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
  lastName: string;
  verificationTier: string;
  accountType: AccountType | null;
  handle: string | null;
  bio: string | null;
  interests: string[];
  instagramHandle: string | null;
  whatsappHandle: string | null;
}

/** PATCH /api/hub/users/me body — exactly UpdateUserProfileDto's field set. No `name`/`fullName` field exists on this DTO at all (see getOwnProfile's HubMeResponse doc comment) — never invent one. */
interface UpdateUserProfileBody {
  interests?: string[];
  bio?: string;
  handle?: string;
  instagramHandle?: string;
  whatsappHandle?: string;
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
 * The secondary creator/state, earnings, and credits calls degrade
 * gracefully on their own failure (bare catch, same as auth.ts's signIn()
 * creator/state read) rather than failing the whole profile — a creator
 * account with no CreatorState row yet, or a transient earnings/credits
 * hiccup, should not block the identity block from rendering. The PRIMARY
 * users/me call is the one Pattern-A-gated: a real failure there throws
 * (never silently substitutes the mock identity), and only a genuine
 * no-backend-configured dev/demo mode falls back to mock data.
 */
export async function getOwnProfile(): Promise<OwnProfile> {
  try {
    const me = await apiFetch<HubMeResponse>("/api/hub/users/me", { authed: true });
    const accountType: AccountType = me.accountType ?? "user";
    const name = `${me.firstName ?? ""} ${me.lastName ?? ""}`.trim() || me.handle || "WAWU member";

    let plan: CreatorTier = "basic";
    let contentSlots: OwnProfile["contentSlots"];
    let published = 0;
    let earningsThisMonth: number | undefined;

    if (accountType === "creator") {
      try {
        const state = await apiFetch<HubCreatorStateForProfile>("/api/hub/creator/state", { authed: true });
        plan = state.tier;
        contentSlots = { published: state.slotsUsed, total: state.slotsTotal };
        published = state.slotsUsed;
      } catch {
        // SEAM: GET /api/hub/creator/state — a creator account with no
        // CreatorState row yet (pre-tier-selection). Leave plan/contentSlots
        // at their defaults; creatorGates() already treats this the same way.
      }
      try {
        const earnings = await apiFetch<HubEarningsForProfile>("/api/hub/content/mine/earnings", { authed: true });
        // KNOWN BACKEND GAP: `total` is an all-time aggregate — the real
        // contract has no month-scoped figure at all (confirmed against
        // creator-earnings.service.ts: no date filtering anywhere in it).
        // Using it as the best available stand-in for "this month" rather
        // than inventing a monthly figure that doesn't exist.
        earningsThisMonth = earnings.total;
      } catch {
        // SEAM: GET /api/hub/content/mine/earnings
      }
    }

    let credits = 0;
    try {
      const creditsState = await apiFetch<HubCreditsForProfile>("/api/hub/credits", { authed: true });
      credits = creditsState.creditBalance;
    } catch {
      // SEAM: GET /api/hub/credits
    }

    return {
      wawuId: me.wawuUserId,
      name,
      handle: me.handle ?? "",
      email: me.email ?? "",
      bio: me.bio ?? "",
      accountType,
      verification: mapVerificationTier(me.verificationTier),
      plan,
      stats: { published, sales: undefined, followers: undefined },
      interests: me.interests ?? [],
      socials: { instagram: me.instagramHandle ?? undefined, whatsapp: me.whatsappHandle ?? undefined },
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
        interests: draft.interests,
        bio: draft.bio,
        handle: draft.handle,
        instagramHandle: draft.socials.instagram ?? "",
        whatsappHandle: draft.socials.whatsapp ?? "",
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
  try {
    const entries = await apiFetch<HubVerificationLadderEntry[]>("/api/hub/verification/ladder", {
      authed: true,
    });
    return fromHubLadder(entries);
  } catch {
    // SEAM: replace with GET /api/hub/verification/ladder
    return getMockLadder();
  }
}

export async function getVerificationSubmissions(): Promise<VerificationSubmission[]> {
  try {
    const submissions = await apiFetch<HubVerificationSubmission[]>("/api/hub/verification/submissions", {
      authed: true,
    });
    return submissions.map(fromHubSubmission);
  } catch {
    // SEAM: replace with GET /api/hub/verification/submissions
    return getMockVerificationSubmissions();
  }
}

/**
 * `documents` defaults to `[]` so existing call sites (which don't yet
 * collect real document URLs — see VerificationApplyForm's `uploaded`
 * state, local filenames only) keep compiling unchanged. An empty array
 * makes the real POST 400 (ArrayNotEmpty on the Hub's
 * CreateVerificationSubmissionDto), which the try/catch below treats the
 * same as any other real-call failure and falls back to the mock — see
 * report for the follow-up this implies.
 */
export async function submitVerification(
  tier: VerificationLevel,
  documents: string[] = [],
): Promise<VerificationSubmission> {
  try {
    const hub = await apiFetch<HubVerificationSubmission>("/api/hub/verification/submissions", {
      method: "POST",
      authed: true,
      body: { tier, documents },
    });
    return fromHubSubmission(hub);
  } catch {
    // SEAM: replace with POST /api/hub/verification/submissions
    return submitMockVerification(tier);
  }
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
  try {
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
  } catch {
    // SEAM: replace with GET /api/hub/verification/submissions + POST /api/hub/verification/submissions/:id/resubmit
    return resubmitMockVerification(tier);
  }
}
