/**
 * The rules of the join-only upload flow (WEB-UPLOAD, R-126), as plain data and
 * plain functions. No imports on purpose: node:test loads this file as it
 * stands (src/lib/site-upload/rules.test.ts), and the pages, the API module and
 * the checks all read the same sentences from here.
 *
 * The Hub is the authority for every rule below. It enforces the app's upload
 * rules for a request marked `X-Wawu-Client: site` (price list, places by tier,
 * no course). This file only says them in words and keeps the screen from
 * offering what the Hub would refuse.
 */

/** The marker the Hub reads. Sent on every content and upload call the join-only site makes. */
export const SITE_CLIENT_HEADER = "X-Wawu-Client";
export const SITE_CLIENT_VALUE = "site";

/** Kinds the join-only flow offers. No course: the web has not proven lessons end to end (WEB-HOLD). */
export const SITE_KINDS = ["video", "audio", "pdf", "image"] as const;
export type SiteKind = (typeof SITE_KINDS)[number];

export const KIND_LABEL: Record<SiteKind, string> = {
  video: "Video",
  audio: "Audio",
  pdf: "PDF",
  image: "Picture",
};

export const KIND_HINT: Record<SiteKind, string> = {
  video: "MP4, MOV or WebM.",
  audio: "MP3, WAV or M4A.",
  pdf: "A PDF people can download and keep.",
  image: "PNG, JPEG or WebP.",
};

/** What the file picker offers for each kind. The Hub holds the same lists (FOLDER_CONTENT_TYPES). */
export const KIND_ACCEPT: Record<SiteKind, string> = {
  video: "video/mp4,video/quicktime,video/webm",
  audio: "audio/mpeg,audio/wav,audio/mp4,audio/aac",
  pdf: "application/pdf",
  image: "image/png,image/jpeg,image/webp",
};

/** A cover is a picture, at most 5 MB (the Hub's content/cover folder). */
export const COVER_MAX_BYTES = 5 * 1024 * 1024;
export const COVER_ACCEPT = "image/png,image/jpeg,image/webp";
export const COVER_TOO_LARGE = "That picture is over 5 MB. Choose a smaller one, PNG, JPEG or WebP.";

/** Where a person with no tier goes. */
export const JOIN_PATH = "/join";

export const NO_TIER_SENTENCE =
  "Your upload places come with a tier. Get one at wawuafrica.com/join, or sign in with the email or phone you paid with.";

export const PLACES_FULL_SENTENCE =
  "All your upload places are in use. Delete a piece to free one, or get a bigger tier at wawuafrica.com/join.";

export const NOT_ON_LIST_SENTENCE = "Pick one of the prices on the list.";

/** What the Hub's refusal codes say to a person. Null when the code is not one of these. */
export function refusalSentence(code: string | undefined): string | null {
  if (code === "tier_required") return NO_TIER_SENTENCE;
  if (code === "product_limit_reached") return PLACES_FULL_SENTENCE;
  if (code === "price_not_on_list") return NOT_ON_LIST_SENTENCE;
  return null;
}

export type AccessState = "no-tier" | "full" | "ok";

/** Whether this person can add a piece now, from the places the Hub reports (creator/state slotsTotal, slotsUsed). */
export function accessState(places: { total: number; used: number }): AccessState {
  if (places.total <= 0) return "no-tier";
  if (places.used >= places.total) return "full";
  return "ok";
}

export function placesLine(places: { total: number; used: number }): string {
  return `${places.used} of ${places.total} places used`;
}

/** Whole naira as the Hub's price list gives it, written with the naira sign and thousands separators. */
export function nairaText(naira: number): string {
  return `₦${Math.round(naira).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/** The price list as a sorted list of whole naira, dropping anything that is not a positive whole number. */
export function cleanPriceList(raw: unknown): number[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<number>();
  for (const item of raw) {
    const n = typeof item === "number" ? item : Number.NaN;
    if (Number.isSafeInteger(n) && n > 0) seen.add(n);
  }
  return [...seen].sort((a, b) => a - b);
}

export type PieceStateKey = "review" | "live" | "rejected" | "waiting-wallet";

export interface PieceState {
  key: PieceStateKey;
  label: string;
  /** A second line, when the state needs one. */
  detail: string | null;
}

export const WAITING_WALLET_TEXT = "Approved. It goes live when you open your wallet in the WAWU app.";

/**
 * A piece's state in words, from what GET /content/mine/library says.
 * `pending` with `waitingFor: "wallet"` is a piece a moderator approved that is held for the wallet step (R-126).
 */
export function pieceState(piece: {
  status: string;
  waitingFor?: string | null;
  rejectionReason?: string | null;
}): PieceState {
  if (piece.status === "live") return { key: "live", label: "Live", detail: null };
  if (piece.status === "rejected") {
    const reason = (piece.rejectionReason ?? "").trim();
    return { key: "rejected", label: reason ? `Not approved: ${reason}` : "Not approved", detail: null };
  }
  if (piece.waitingFor === "wallet") {
    return { key: "waiting-wallet", label: "Approved", detail: WAITING_WALLET_TEXT };
  }
  return { key: "review", label: "In review", detail: null };
}

/** The wallet-held state as one sentence, for the row's status line. */
export function pieceStateText(state: PieceState): string {
  return state.detail ?? state.label;
}

/** Bytes as a short size, the way the picker writes them. */
export function sizeText(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

/** Where a signed-in person lands after sign-in or sign-up. Only the join-only site's own pages. */
export function landingAfterSignIn(next: string | null): string {
  if (next === "/create/new" || next === "/create/library") return next;
  return "/create/library";
}
