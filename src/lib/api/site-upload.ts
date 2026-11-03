import { ApiError, apiFetch, apiFetchPaginated } from "./client";
import { describeError } from "./errors";
import {
  SITE_CLIENT_HEADER,
  SITE_CLIENT_VALUE,
  cleanPriceList,
  refusalSentence,
  type SiteKind,
} from "@/lib/site-upload/rules";

/**
 * The join-only site's calls to the Hub (WEB-UPLOAD, R-126).
 *
 * Every content and upload write the join-only site makes carries
 * `X-Wawu-Client: site`. The Hub then holds the request to the app's upload
 * rules (price list, places by tier, no course) and holds an approved piece
 * until its creator has opened a wallet in the app. This is the one helper that
 * sets the marker; nothing else in the repo writes the header. Full mode never
 * calls this module, so it sends nothing new.
 */
export function siteHeaders(): Record<string, string> {
  return { [SITE_CLIENT_HEADER]: SITE_CLIENT_VALUE };
}

/** The person's tier. Reading it is also what claims a /join payment made with their proven email or phone (R-125). */
export interface MyTier {
  state: "none" | "active" | "ending" | "ended";
  tier: { id: string; name: string | null } | null;
  activeUntil: string | null;
  productsAllowed: number;
  productsUsed: number;
}

export async function readMyTier(): Promise<MyTier> {
  return apiFetch<MyTier>("/api/hub/me/tier", { authed: true });
}

export interface Places {
  total: number;
  used: number;
}

/** Thrown by readPlaces when the account is not a creator account (the Hub answers 403). */
export class NotACreatorAccount extends Error {}

/** The person's upload places, as the Hub counts them: slotsTotal from the tier (4, 8 or 15; 25 with a tick). */
export async function readPlaces(): Promise<Places> {
  try {
    const state = await apiFetch<{ slotsTotal?: number; slotsUsed?: number }>("/api/hub/creator/state", {
      authed: true,
      headers: siteHeaders(),
    });
    return { total: state.slotsTotal ?? 0, used: state.slotsUsed ?? 0 };
  } catch (e) {
    if (e instanceof ApiError && (e.status === 403 || e.status === 404)) throw new NotACreatorAccount();
    throw e;
  }
}

/** Makes this account a creator account (the same PATCH sign-up makes). */
export async function makeCreatorAccount(): Promise<void> {
  await apiFetch("/api/hub/users/me", { method: "PATCH", authed: true, body: { accountType: "creator" } });
}

/** The price list, in whole naira, lowest first. A price is picked from it, never typed. */
export async function readPriceList(): Promise<number[]> {
  const view = await apiFetch<{ prices?: { priceNaira?: number }[] }>("/api/hub/prices", {
    authed: true,
    headers: siteHeaders(),
  });
  return cleanPriceList((view.prices ?? []).map((p) => p.priceNaira));
}

export interface UploadedPiece {
  id: string;
  contentType: string;
  title: string;
  accessType: "free" | "paid";
  price: number;
  status: "pending" | "live" | "rejected" | "removed";
  coverUrl: string | null;
  previewAssetUrl: string | null;
  rejectionReason: string | null;
  waitingFor: string | null;
  createdAt: string | null;
}

/** GET /content/mine/library: every piece the person made, newest first, with the reviewer's reason and the wallet hold. */
export async function listMyPieces(): Promise<UploadedPiece[]> {
  const res = await apiFetchPaginated<UploadedPiece>("/api/hub/content/mine/library?perPage=50", {
    authed: true,
    headers: siteHeaders(),
  });
  return res.data;
}

export interface NewPiece {
  contentType: SiteKind;
  title: string;
  description: string;
  specializations: string[];
  /** The deprecated flat category the Hub still requires. */
  category: string;
  accessType: "free" | "paid";
  /** Whole naira from the price list; 0 when there is no price. */
  price: number;
  fullAsset: string;
  /** Only a picture piece sends one: its own smaller copy. Audio, video and pdf send none (the Hub cuts it). */
  previewAsset?: string;
  coverAsset?: string;
}

export async function createPiece(piece: NewPiece): Promise<UploadedPiece> {
  const body: Record<string, unknown> = {
    contentType: piece.contentType,
    title: piece.title,
    description: piece.description,
    category: piece.category,
    specializations: piece.specializations,
    accessType: piece.accessType,
    price: piece.price,
    fullAsset: piece.fullAsset,
  };
  if (piece.previewAsset) body["previewAsset"] = piece.previewAsset;
  if (piece.coverAsset) body["coverAsset"] = piece.coverAsset;
  return apiFetch<UploadedPiece>("/api/hub/content", {
    method: "POST",
    authed: true,
    headers: siteHeaders(),
    body,
  });
}

export async function deletePiece(id: string): Promise<void> {
  await apiFetch<void>(`/api/hub/content/${encodeURIComponent(id)}`, {
    method: "DELETE",
    authed: true,
    headers: siteHeaders(),
  });
}

/** The code the Hub's refusal carried, when it sent one (reason.code). */
export function refusalCode(e: unknown): string | undefined {
  return e instanceof ApiError ? e.code : undefined;
}

/** A sentence for a failed call: the Hub's refusals in the flow's own words, anything else through describeError. */
export function sentenceFor(e: unknown): string {
  const own = refusalSentence(refusalCode(e));
  if (own) return own;
  if (e instanceof ApiError && e.status === 402) return refusalSentence("tier_required") ?? "That did not go through.";
  return describeError(e).body;
}
