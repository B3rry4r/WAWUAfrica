import type { AccountType, CreatorTier } from "@/types/account";
import type { ProfileExperience } from "@/types/profile";
import type {
  OwnProfile,
  OwnProfileDraft,
  TickState,
  VerificationKind,
  VerificationOffer,
  VerificationOverview,
  VerificationUnavailable,
  VerificationState,
  ProfileStep,
} from "@/types/verification";
import { NO_VERIFICATION } from "@/types/verification";
import { apiFetch, isMockModeError } from "./client";
import { openFlutterwaveCheckout, isFlutterwaveCancelled, checkoutCustomerFromSession } from "@/lib/flutterwave";
import { sessionStorage } from "@/lib/auth/session-storage";
import { getMockOwnProfile, saveMockOwnProfile } from "./mocks/verification";
import { VERIFICATION_OFFERS } from "@/lib/verification-offers";

/**
 * The two-tick verification model, end to end.
 *
 * WHAT WAS HERE BEFORE: a five-rung credibility ladder
 * (basic/verified_user/verified_business/certified_professional/trusted_partner)
 * with a document-upload application per rung, GET /api/hub/verification/ladder
 * and POST /api/hub/verification/submissions behind it. Build brief B1
 * deleted that product. There are now exactly TWO verifications, they are
 * independent of each other, and both are bought rather than applied for.
 *
 * Everything on the wire follows the shared contract the Hub backend and
 * WAWU ID implement too: `verification: { creator: TickState, professional:
 * TickState }` wherever a user appears.
 */

// ── the one derivation ───────────────────────────────────────────────────────

/**
 * Normalizes whatever a backend hands us into a VerificationState.
 *
 * This is the ONLY place in the web client that turns wire data into ticks.
 * Two reasons it is tolerant rather than strict:
 *
 *  1. Rollout. The Hub and WAWU ID ship the new field on their own schedule,
 *     and the migration is deliberately expand-only (the old
 *     `verification_tier` column is not dropped). A response that predates
 *     the new field must render as "no tick", not crash a list of creators.
 *  2. `verified` is SERVER-computed from the expiry. The client never
 *     compares `expiresAt` to the device clock — a phone with a wrong date
 *     would otherwise draw a lapsed tick, or hide a live one.
 *
 * Anything unrecognised means no tick. Never the other way round: inventing a
 * credential is worse than missing one.
 */
export function toVerificationState(raw: unknown): VerificationState {
  if (typeof raw !== "object" || raw === null) return NO_VERIFICATION;
  const bag = raw as Record<string, unknown>;
  return {
    creator: toTickState(bag.creator),
    professional: toTickState(bag.professional),
  };
}

function toTickState(raw: unknown): TickState {
  if (typeof raw !== "object" || raw === null) return { verified: false, expiresAt: null };
  const bag = raw as Record<string, unknown>;
  return {
    verified: bag.verified === true,
    expiresAt: typeof bag.expiresAt === "string" ? bag.expiresAt : null,
  };
}

// ── buying a tick ────────────────────────────────────────────────────────────

/**
 * GET /api/hub/verification/me - the caller's own ticks, the price list and
 * what they are eligible to buy.
 *
 * The path and the shape are the Hub's, verified against its controller and
 * its generated contract/openapi.json, NOT invented here. An earlier cut of
 * this file called `GET /api/hub/verification` and expected `{ verification,
 * offers }`; the Hub serves neither, so every call 404'd. Change this only
 * alongside the Hub.
 */
interface HubVerificationOverviewResponse {
  verification: unknown;
  pricing?: { creator?: number; professional?: number; termMonths?: number };
  eligibility?: Array<{
    kind: string;
    allowed: boolean;
    priceNgn: number;
    reason: string | null;
  }>;
}

interface HubVerificationCheckoutResponse {
  flutterwaveConfig: {
    txRef: string;
    amount: number;
    currency: "NGN";
    publicKey: string;
  };
}

function isKind(k: string): k is VerificationKind {
  return k === "creator" || k === "professional";
}

/**
 * Splits the Hub's `eligibility` rows into what this caller can buy and what
 * they cannot, keeping the server's reason for the second group.
 *
 * `offers` carries ONLY allowed rows. That is load-bearing: VerificationPrompt
 * renders nothing when the list is empty, which is how a buyer account avoids
 * being nagged to buy a tick it is not eligible for in the first place.
 */
function splitEligibility(
  raw: HubVerificationOverviewResponse["eligibility"],
  termMonths: number,
): { offers: VerificationOffer[]; unavailable: VerificationUnavailable[] } {
  if (!Array.isArray(raw)) return { offers: [], unavailable: [] };
  const offers: VerificationOffer[] = [];
  const unavailable: VerificationUnavailable[] = [];
  for (const row of raw) {
    if (!row || !isKind(row.kind)) continue;
    if (row.allowed) {
      const price = Number(row.priceNgn);
      // A tick with no usable price is not an offer. Showing a Buy button
      // over a missing figure is how somebody gets charged an amount nobody
      // displayed.
      if (Number.isFinite(price) && price > 0) {
        offers.push({ kind: row.kind, price, periodMonths: termMonths });
      }
      continue;
    }
    unavailable.push({
      kind: row.kind,
      reason: row.reason ?? "This tick is not available on your account yet.",
    });
  }
  return { offers, unavailable };
}

/**
 * The caller's own verification and what they can buy.
 *
 * The PRICE comes from here and only from here. No component may hold a naira
 * figure for verification: what it costs is the backend's to change, and a
 * price baked into a screen means a release of this app every time it moves.
 */
export async function getVerificationOverview(): Promise<VerificationOverview> {
  try {
    const res = await apiFetch<HubVerificationOverviewResponse>("/api/hub/verification/me", { authed: true });
    const termMonths = Number(res.pricing?.termMonths) || 12;
    const { offers, unavailable } = splitEligibility(res.eligibility, termMonths);
    return { verification: toVerificationState(res.verification), offers, unavailable };
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with GET /api/hub/verification/me
    //
    // No backend configured. The published price list stands in for the
    // server's offers, and the caller's own ticks come from the fixture
    // profile, so every screen in a fixture build agrees about who is
    // verified.
    const me = await getMockOwnProfile();
    return { verification: me.verification, offers: VERIFICATION_OFFERS.map((o) => ({ ...o })), unavailable: [] };
  }
}

/** One year from today, ISO. Used only by the no-backend path above. */
function oneYearOut(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}

export type VerificationPurchaseResult =
  | { result: "success"; verification: VerificationState }
  | { result: "cancelled" }
  | { result: "payment_failed" }
  | { result: "verify_failed" };

/**
 * Buys one tick. The same three-step sequence every other paid flow here uses
 * (src/lib/flutterwave.ts): init on our backend, collect the card on
 * Flutterwave's own surface, then have the SERVER re-verify the real
 * transaction id before it grants anything. A client-side callback is never
 * trusted, which matters more here than usual: the thing being granted is a
 * credential other people rely on.
 *
 * The two are bought independently. Somebody who holds one and buys the other
 * ends up holding both, and nothing here overwrites the tick they already had
 * - the server returns the full state back and that is what we store.
 */
export async function purchaseVerification(kind: VerificationKind): Promise<VerificationPurchaseResult> {
  try {
    const init = await apiFetch<HubVerificationCheckoutResponse>("/api/hub/verification/purchase", {
      method: "POST",
      authed: true,
      body: { kind },
    });

    const customer = checkoutCustomerFromSession(sessionStorage.getUser());
    if (!customer) return { result: "payment_failed" };

    const charge = await openFlutterwaveCheckout(
      init.flutterwaveConfig,
      customer,
      {
        title: kind === "creator" ? "Creator verification" : "Professional verification",
        description: "One year of verification on WAWU",
      },
      {
        verifyPath: "/api/hub/verification/purchase/verify",
        successPath: "/profile/verification",
        label: "Your verification",
      },
    );

    // Past this line the money HAS moved. "Try again" would take a second
    // payment, so a failure here gets its own result the screen renders
    // differently.
    try {
      const done = await apiFetch<{ verification: unknown }>("/api/hub/verification/purchase/verify", {
        method: "POST",
        authed: true,
        body: { transaction_id: charge.transaction_id, tx_ref: charge.tx_ref },
      });
      return { result: "success", verification: toVerificationState(done.verification) };
    } catch {
      return { result: "verify_failed" };
    }
  } catch (e) {
    if (isFlutterwaveCancelled(e)) return { result: "cancelled" };
    if (!isMockModeError(e)) return { result: "payment_failed" };
    // SEAM: replace with POST /api/hub/verification/purchase [+ /verify]
    //
    // No backend configured, so nothing is charged and nothing is stored.
    // The granted state is returned so the screen can show what a real
    // purchase looks like; it lasts until the page is reloaded, because the
    // only thing that can actually hold a tick is the server.
    const me = await getMockOwnProfile();
    return {
      result: "success",
      verification: { ...me.verification, [kind]: { verified: true, expiresAt: oneYearOut() } },
    };
  }
}

// ── the caller's own profile ─────────────────────────────────────────────────

/**
 * GET /api/hub/users/me response — UserProfile columns merged with the
 * caller's WAWU ID JWT claims (Hub API's `UserProfileWithClaims`; verified
 * directly against WAWU-Hub-API's user-profile.controller.ts /
 * user-profile.service.ts / wawu-jwt-claims.interface.ts). Only the fields
 * this module actually reads are declared — `fullName` does not exist here
 * (WAWU ID splits it into firstName/lastName; the combined `fullName` only
 * comes back from WAWU ID's own /auth/login response, see auth.ts).
 *
 * Named apart from auth.ts's narrower HubMeResponse on purpose: two
 * interfaces with the same name in two files is exactly what the `forks`
 * gate calls a second truth waiting to drift.
 */
interface HubUserProfileResponse {
  wawuUserId: string;
  email: string | null;
  firstName: string;
  /** Optional: WAWU ID only started storing it when sign-up split the name. */
  middleName?: string | null;
  lastName: string;
  /** The two-tick contract. Absent on an instance that has not shipped it yet. */
  verification?: unknown;
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
  company?: string | null;
  headline?: string | null;
  /** Server-ordered: current role first, then newest first. Never re-sorted. */
  experience?: ProfileExperience[];
  avatarUrl: string | null;
  coverUrl: string | null;
}

/** PATCH /api/hub/users/me body — exactly UpdateUserProfileDto's field set. No `name`/`fullName` field exists on this DTO at all (see getOwnProfile's HubUserProfileResponse doc comment) — never invent one. */
/**
 * GET /api/hub/users/me/profile-stats.
 *
 * Owner-only by construction on the server: it takes the caller's id from the
 * token and has no parameter that could point it at another account, which is
 * what keeps the view count off a stranger's screen.
 */
interface HubProfileStatsResponse {
  followerCount: number;
  followingCount: number;
  postCount: number;
  profileViewsThisMonth: number;
  productsSoldThisMonth: number;
  profileCompletenessPct: number;
  profileCompletenessMissing: ProfileStep[];
}

/** 2400 reads better than 2,400 in a stat cell, and 2.4k better still. */
function compactCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return String(n);
}

interface UpdateUserProfileBody {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  interests?: string[];
  bio?: string;
  handle?: string;
  company?: string;
  headline?: string;
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
    const me = await apiFetch<HubUserProfileResponse>("/api/hub/users/me", { authed: true });
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

    /*
      THE FOUR FIGURES THE APPROVED PROFILE DRAWS, from the endpoint that has
      always served them.

      Posts, Followers, Following and a month-scoped view count all come from
      here. Nothing in this client called it, so the profile showed
      Published / Followers / EVG and a comment on the screen claimed no
      endpoint answered the other two.

      Caught rather than awaited on its own line: these are the decoration on
      a screen whose subject is the profile. A stats call that fails should
      leave the row short, not fail the page. `null` is "not answered", which
      every field below distinguishes from zero.
    */
    const stats = await apiFetch<HubProfileStatsResponse>("/api/hub/users/me/profile-stats", {
      authed: true,
    }).catch(() => null);

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
      verification: toVerificationState(me.verification),
      plan,
      stats: {
        // `postCount` from the stats endpoint is the authority when it
        // answers: it counts LIVE pieces, where `published` is the creator
        // state's slot usage and counts drafts too. The slot figure stays as
        // the fallback so the row is not empty when the call fails.
        published: stats?.postCount ?? published,
        sales: stats ? stats.productsSoldThisMonth : undefined,
        followers: stats ? compactCount(stats.followerCount) : undefined,
        following: stats ? compactCount(stats.followingCount) : undefined,
        monthlyViews: stats ? compactCount(stats.profileViewsThisMonth) : undefined,
        completenessPct: stats?.profileCompletenessPct,
        completenessMissing: stats?.profileCompletenessMissing,
      },
      interests: me.interests ?? [],
      company: me.company ?? undefined,
      headline: me.headline ?? undefined,
      // `?? []` because a Hub that predates the column sends nothing, and an
      // absent list means "no roles", not a header that cannot render.
      experience: me.experience ?? [],
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
        // Free text, so it is sent even when empty and clears the field.
        // The URL fields below are the exception, not this.
        company: draft.company ?? "",
        headline: draft.headline ?? "",
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

/* ------------------------- the experience list -------------------------- */

/**
 * One role, added, changed or removed.
 *
 * These are three requests rather than part of `saveProfile` because each row
 * is edited on its own: sending the whole list back on every save would make
 * "delete the third one" a read-modify-write, and two open tabs would lose
 * each other's rows. The server owns the ordering and the id, so each call
 * returns the saved row rather than the caller reconstructing it.
 *
 * `startedOn` and `endedOn` are MONTHS ("2023-03"). The API rejects anything
 * else, deliberately: a day component on a job history is a number somebody
 * invented.
 */
export interface ExperienceDraft {
  title: string;
  company: string;
  location?: string | null;
  startedOn: string;
  /** Omit or null for the role they hold now. */
  endedOn?: string | null;
  description?: string | null;
}

export async function addExperience(draft: ExperienceDraft): Promise<ProfileExperience> {
  try {
    return await apiFetch<ProfileExperience>("/api/hub/users/me/experience", {
      method: "POST",
      authed: true,
      body: draft,
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with POST /api/hub/users/me/experience
    const { addMockExperience } = await import("./mocks/verification");
    return addMockExperience(draft);
  }
}

export async function editExperience(
  id: string,
  draft: Partial<ExperienceDraft>,
): Promise<ProfileExperience> {
  try {
    return await apiFetch<ProfileExperience>(`/api/hub/users/me/experience/${id}`, {
      method: "PATCH",
      authed: true,
      body: draft,
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with PATCH /api/hub/users/me/experience/:id
    const { editMockExperience } = await import("./mocks/verification");
    return editMockExperience(id, draft);
  }
}

export async function removeExperience(id: string): Promise<void> {
  try {
    await apiFetch<unknown>(`/api/hub/users/me/experience/${id}`, {
      method: "DELETE",
      authed: true,
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with DELETE /api/hub/users/me/experience/:id
    const { removeMockExperience } = await import("./mocks/verification");
    removeMockExperience(id);
  }
}
