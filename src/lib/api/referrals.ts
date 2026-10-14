import { apiFetch, apiFetchPaginated } from "./client";
import { getAdminToken } from "./notifications";

/**
 * The admin side of /join (REF-01): the referral codes, the totals of the
 * whole offer and the people who registered. Every call needs the admin token
 * from /admin/auth/login; the Hub refuses anything else. Reads are open to
 * superadmin, finance and support; making or changing a code is superadmin
 * only (the Hub answers 403 to anyone else). Every figure is counted by the
 * server; nothing here adds up rows. There are no mocks.
 */

const BASE = "/api/hub/admin/waitlist";
const opts = () => ({ token: getAdminToken() ?? undefined });

/** The address a community shares: /join with its code in the address. */
export const JOIN_LINK_BASE = "https://wawuafrica.com/join";
export const joinLinkFor = (code: string): string => `${JOIN_LINK_BASE}?ref=${encodeURIComponent(code)}`;

export interface ReferralCodeRow {
  id: string;
  code: string;
  community: string;
  /** What a person using the code pays, in kobo; 0 means no payment. */
  priceKobo: number;
  /** How many people may use it; null means no limit. */
  limit: number | null;
  active: boolean;
  paidCount: number;
  /** Unpaid starts in the last 30 minutes, each holding a place. */
  heldCount: number;
  paidKobo: number;
  createdAt: string;
  updatedAt: string;
}

export interface NewReferralCode {
  code: string;
  community: string;
  priceKobo: number;
  limit?: number | null;
  active?: boolean;
}

export interface ReferralCodeChange {
  community?: string;
  priceKobo?: number;
  /** A number, or null to remove the limit. */
  limit?: number | null;
  active?: boolean;
}

export interface JoinSplitRow {
  /** The code; null is the "No code" row. */
  code: string | null;
  community: string | null;
  people: number;
  kobo: number;
}

export interface JoinSummary {
  offerId: string | null;
  paid: { people: number; kobo: number };
  /** Second payments kept for a refund. Not income. */
  failed: { people: number; kobo: number };
  unpaid: number;
  split: JoinSplitRow[];
  generatedAt: string;
}

export type PersonStatus = "pending" | "paid" | "failed";

export interface JoinPerson {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string | null;
  craft: string | null;
  status: PersonStatus;
  amountKobo: number;
  paidKobo: number | null;
  paidAt: string | null;
  createdAt: string;
  referralCode: string | null;
  referralCommunity: string | null;
}

/** The people filter. `code` is "" for everyone, NO_CODE for the registrations with no code, or a code. */
export const NO_CODE = "__none__";
export interface PeopleFilter {
  code: string;
  status: "" | PersonStatus;
}

function filterQuery(f: PeopleFilter): URLSearchParams {
  const q = new URLSearchParams();
  if (f.status) q.set("status", f.status);
  if (f.code === NO_CODE) q.set("noReferral", "true");
  else if (f.code) q.set("referralCode", f.code);
  return q;
}

export function listReferralCodes(): Promise<ReferralCodeRow[]> {
  return apiFetch<ReferralCodeRow[]>(`${BASE}/referral-codes`, opts());
}

export function createReferralCode(input: NewReferralCode): Promise<ReferralCodeRow> {
  return apiFetch<ReferralCodeRow>(`${BASE}/referral-codes`, { ...opts(), method: "POST", body: input });
}

export function updateReferralCode(id: string, change: ReferralCodeChange): Promise<ReferralCodeRow> {
  return apiFetch<ReferralCodeRow>(`${BASE}/referral-codes/${encodeURIComponent(id)}`, {
    ...opts(),
    method: "PATCH",
    body: change,
  });
}

export function getJoinSummary(): Promise<JoinSummary> {
  return apiFetch<JoinSummary>(`${BASE}/registrations/summary`, opts());
}

export async function listJoinPeople(
  filter: PeopleFilter,
  page: number,
  perPage = 25,
): Promise<{ items: JoinPerson[]; total: number; hasMore: boolean }> {
  const q = filterQuery(filter);
  q.set("page", String(page));
  q.set("perPage", String(perPage));
  const res = await apiFetchPaginated<JoinPerson>(`${BASE}/registrations?${q.toString()}`, opts());
  return { items: res.data, total: res.pagination.total, hasMore: res.pagination.nextPage !== null };
}

export interface JoinCsv {
  fileName: string;
  contentType: string;
  rowCount: number;
  content: string;
}

/** The existing export route with the same filter as the list. */
export function exportJoinPeople(filter: PeopleFilter): Promise<JoinCsv> {
  const q = filterQuery(filter).toString();
  return apiFetch<JoinCsv>(`${BASE}/registrations/export${q ? `?${q}` : ""}`, opts());
}
