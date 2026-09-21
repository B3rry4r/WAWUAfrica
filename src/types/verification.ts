import type { AccountType, CreatorTier } from "./account";

/**
 * ONE tick.
 *
 * `verified` is computed SERVER-SIDE from the expiry. The client never
 * compares dates to decide whether to draw a tick: a device with a wrong
 * clock would otherwise show a credential that has lapsed, or hide one that
 * has not.
 *
 * `expiresAt === null` with `verified === true` is a perpetual,
 * admin-granted tick (the grandfathered accounts the backfill creates).
 * `expiresAt === null` with `verified === false` simply means never verified.
 */
export interface TickState {
  verified: boolean;
  /** ISO 8601. */
  expiresAt: string | null;
}

/**
 * The two verifications, as they travel on the wire. Identical in this repo,
 * in WAWU ID and in the Hub backend.
 *
 * They are INDEPENDENT of each other because one account can hold more than
 * one role. Never collapse them into a single badge and never pick a winner:
 * somebody who paid for both paid twice and shows both.
 */
export interface VerificationState {
  /** The purple tick. Bought annually; the price lives in config, never here. */
  creator: TickState;
  /** The green tick. Bought annually; the price lives in config, never here. */
  professional: TickState;
}

/** Which of the two a piece of UI is talking about. */
export type VerificationKind = "creator" | "professional";

/** Both kinds, in the order they render. Iterate this, never a hand-typed pair. */
export const VERIFICATION_KINDS: readonly VerificationKind[] = ["creator", "professional"];

/** What each tick is called in front of a user. */
export const VERIFICATION_LABELS: Record<VerificationKind, string> = {
  creator: "Creator verification",
  professional: "Professional verification",
};

/** The short form, for a tooltip or a chip where the full label will not fit. */
export const VERIFICATION_SHORT_LABELS: Record<VerificationKind, string> = {
  creator: "Verified creator",
  professional: "Verified professional",
};

/**
 * No tick at all. Used wherever a read genuinely cannot answer the question
 * (see the per-endpoint notes in src/lib/api) so that "we do not know" and
 * "not verified" produce the same, honest, tickless render.
 */
export const NO_VERIFICATION: VerificationState = {
  creator: { verified: false, expiresAt: null },
  professional: { verified: false, expiresAt: null },
};

/** True when this account holds at least one of the two ticks. */
/**
 * ONE safe way to read a single tick. Every call site uses it.
 *
 * WHY THIS EXISTS, and it is not defensive-programming taste. `VerificationState`
 * says both ticks are always present, and on the wire they are. A SESSION is
 * different: it is JSON written to localStorage by whatever build was deployed
 * when the person last signed in. Anybody signed in before the two-tick
 * release has a stored user with no `verification` at all, or a half-written
 * one, and the type system cannot see that because the data predates the type.
 *
 * `v?.[kind].verified` is NOT enough and that exact line crashed /create in
 * production: the `?.` guards `v` being null, then `.verified` is read off
 * `v[kind]`, which is undefined on a stored session that never had the field.
 * "Cannot read properties of undefined (reading 'verified')".
 *
 * So an absent or malformed tick reads as NOT VERIFIED, which is both the safe
 * answer and the honest one: we cannot prove a tick from data that does not
 * contain it. Same rule `toVerificationState` follows on the API boundary.
 */
export function tickOf(
  v: VerificationState | null | undefined,
  kind: VerificationKind,
): TickState {
  const tick = v?.[kind];
  if (!tick || typeof tick !== "object") return { verified: false, expiresAt: null };
  return {
    verified: tick.verified === true,
    expiresAt: typeof tick.expiresAt === "string" ? tick.expiresAt : null,
  };
}

export function hasAnyTick(v: VerificationState | null | undefined): boolean {
  return VERIFICATION_KINDS.some((kind) => tickOf(v, kind).verified);
}

/**
 * What one verification GRANTS. This list is the only thing any prompt,
 * paywall or gating explanation may promise, because it is the only thing
 * build brief B3 actually implements. Adding a line here without building
 * the mechanism is exactly what the `unbacked_promises` gate exists to stop.
 */
export const VERIFICATION_BENEFITS: readonly string[] = [
  "Your tick shows next to your name everywhere you appear: your profile, your listings, search results and carousels.",
  "You can host events and sell tickets to them. Hosting is verified accounts only.",
];

/**
 * One purchasable verification, priced by the server.
 *
 * The price is NEVER written into a component. It arrives from
 * GET /api/hub/verification/offers so that a change to what verification
 * costs is a backend change, not a release of this app.
 */
export interface VerificationOffer {
  kind: VerificationKind;
  /** Integer Naira. */
  price: number;
  /** How long one purchase lasts. Annual today; still read, never assumed. */
  periodMonths: number;
}

/** A tick this caller cannot buy yet, and the server's sentence saying why. */
export interface VerificationUnavailable {
  kind: VerificationKind;
  /**
   * The SERVER's wording, never ours. It is the sentence that turns a dead
   * end into a next step ("register as a creator first"), and build brief B3
   * requires that explanation rather than a control that silently vanishes.
   */
  reason: string;
}

/** The caller's own verification, plus what they can buy. */
export interface VerificationOverview {
  verification: VerificationState;
  /**
   * Only the ticks this caller may actually purchase. The Hub decides: the
   * creator tick needs a creator account, the professional tick needs an
   * approved professional profile, so a buyer account gets an empty list.
   * Every consumer relies on that (VerificationPrompt shows nothing when this
   * is empty), so never widen it to "all ticks" on the client.
   */
  offers: VerificationOffer[];
  /**
   * The rest, with the server's reason. Lets the purchase screen explain
   * itself instead of rendering an empty state at somebody who is one step
   * away from being able to buy.
   */
  unavailable: VerificationUnavailable[];
}

export interface OwnProfileStats {
  published: number;
  /**
   * No real endpoint returns a lifetime sales count (GET /api/hub/content/mine/earnings
   * only exposes naira totals + a capped recent-sales feed, never a count).
   * Undefined means "not available", not "zero" — render only when present.
   */
  sales?: number;
  /**
   * No real endpoint returns a follower count for the caller's own profile
   * (that field lives on the separate public-creator-profile aggregate, keyed
   * by another user's wawuId, not "me"). Undefined means "not available".
   */
  followers?: string;
}

/** The signed-in user's own profile, read from session + profile records. */
export interface OwnProfile {
  wawuId: string;
  /** The three parts as WAWU ID stores them, for the edit form. */
  firstName: string;
  middleName: string;
  lastName: string;
  /** The three joined, for everywhere that renders one name. */
  name: string;
  handle: string;
  email: string;
  bio: string;
  accountType: AccountType;
  verification: VerificationState;
  plan: CreatorTier;
  stats: OwnProfileStats;
  interests: string[];
  /**
   * Where a creator can be reached. Every one of these is a bare handle now,
   * with or without the "@": the API expands youtube, facebook and linkedin
   * into full profile links on write. `website` is the exception and stays a
   * full URL, since a personal site has no handle to expand.
   */
  socials: {
    instagram?: string;
    whatsapp?: string;
    x?: string;
    tiktok?: string;
    youtube?: string;
    facebook?: string;
    linkedin?: string;
    website?: string;
  };
  /** Profile picture and header image. Null until one is uploaded. */
  avatarUrl: string | null;
  coverUrl: string | null;
  /** User only — count, never a naira value. */
  credits: number;
  /** Creator only. */
  earningsThisMonth?: number;
  toReply?: number;
  contentSlots?: { published: number; total: number };
}

export interface OwnProfileDraft {
  /** The three parts, as WAWU ID stores them. */
  firstName: string;
  middleName: string;
  lastName: string;
  /** The three joined, for the avatar initial and anything rendering one name. */
  name: string;
  handle: string;
  bio: string;
  interests: string[];
  /**
   * Where a creator can be reached. Every one of these is a bare handle now,
   * with or without the "@": the API expands youtube, facebook and linkedin
   * into full profile links on write. `website` is the exception and stays a
   * full URL, since a personal site has no handle to expand.
   */
  socials: {
    instagram?: string;
    whatsapp?: string;
    x?: string;
    tiktok?: string;
    youtube?: string;
    facebook?: string;
    linkedin?: string;
    website?: string;
  };
  /** Profile picture and header image. Null clears one that was set. */
  avatarUrl: string | null;
  coverUrl: string | null;
}