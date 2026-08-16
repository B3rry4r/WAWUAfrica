import type { VerificationLevel } from "@/types/account";
import type {
  OwnProfile,
  OwnProfileDraft,
  VerificationLadderStatus,
  VerificationLevelEntry,
  VerificationSubmission,
  VerificationSubmissionStatus,
} from "@/types/verification";
import { apiFetch } from "./client";
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
 * NOT wired against a real endpoint in this pass. This module's assigned
 * scope is the VerificationSubmission workflow (see doc comment above);
 * "own profile" assembly is a different, cross-cutting resource — Hub API's
 * GET/PATCH /api/hub/users/me (UserProfileController) returns only
 * handle/bio/interests/accountType plus the WAWU-ID JWT claims merged in.
 * It has no stats/plan/credits/earningsThisMonth/contentSlots fields at
 * all — those live on CreatorState, CreditsState, and CreatorEarnings,
 * resources this file has no business touching. Wiring only the
 * users/me-shaped subset here would produce an OwnProfile that's half
 * real, half stale mock data with no way for a caller to tell which half
 * is which — worse than staying mock until a dedicated profile-assembly
 * pass (or the /api/hub/profile aggregate the SEAM comment below assumes)
 * exists. Left as-is; see report.
 */
// SEAM: replace with GET /api/hub/profile
export async function getOwnProfile(): Promise<OwnProfile> {
  return getMockOwnProfile();
}

// SEAM: replace with PATCH /api/hub/profile
export async function saveProfile(draft: OwnProfileDraft): Promise<OwnProfile> {
  return saveMockOwnProfile(draft);
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
