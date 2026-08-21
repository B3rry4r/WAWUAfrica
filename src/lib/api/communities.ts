import type { Community, CommunityMessage, CreditPackId, CreditsState } from "@/types/credits";
import { apiFetch, apiFetchPaginated, ApiError, isMockModeError } from "./client";
import { openFlutterwaveCheckout, checkoutCustomerFromSession } from "@/lib/flutterwave";
import { sessionStorage } from "@/lib/auth/session-storage";
import {
  createMockCommunity,
  getMockCommunities,
  getMockCommunity,
  getMockCommunityMessages,
  getMockCreditsState,
  getMockHostedCommunities,
  joinMockCommunity,
  sendMockCommunityMessage,
  topUpMockCredits,
} from "./mocks/communities";

/**
 * Wire shape for GET /api/hub/communities and /api/hub/communities/:id
 * (WAWU-Hub-API src/common/types/community.type.ts — `CommunityResponse`,
 * a thin Prisma re-export plus derived `memberCount`/`messagesToday`).
 * Verified live against a running backend.
 */
interface CommunityWire {
  id: string;
  name: string;
  description: string;
  hostWawuId: string;
  kind: "open" | "private";
  memberCount: number;
  messagesToday: number;
}

/** Wire shape for GET/POST /api/hub/communities/:id/messages (community-message.type.ts). */
interface CommunityMessageWire {
  id: string;
  communityId: string;
  senderWawuId: string;
  text: string;
  costInCredits: number;
  sentAt: string;
}

/** Wire shape returned by POST /api/hub/communities/:id/join (community-membership.type.ts). */
interface CommunityMembershipWire {
  id: string;
  userWawuId: string;
  communityId: string;
  status: "joined" | "pending";
  joinedAt: string | null;
}

/**
 * GAP (real, verified against every controller/service touching
 * CommunityMembership — there is no other one): the real Community response
 * carries no per-user membership status — no `joined` field on
 * CommunityResponse, and no "my communities" / membership-list endpoint
 * exists anywhere in this backend. It also has no host display name or
 * verified badge, only `hostWawuId` (confirmed live: `GET /communities`
 * returns `{..., hostWawuId, kind, memberCount, messagesToday}`, nothing
 * else). Until the backend adds one of those, `host.name` falls back to the
 * raw wawuId — nothing is fabricated.
 *
 * `joined` is derived from `sessionJoinedIds` below rather than hardcoded
 * `false`: every real, successful `joinCommunity()` call records the id
 * there, and every subsequent `toCommunity()` call (any list refetch, any
 * screen) reflects it. This is real for THIS session — it resets on reload
 * because there is no membership-status endpoint to rehydrate from. A
 * community this account joined in a previous session will still read as
 * not-joined until the backend adds a per-user field; nothing here
 * fabricates a `true` the server never confirmed.
 */
const sessionJoinedIds = new Set<string>();

function toCommunity(c: CommunityWire): Community {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    host: { wawuId: c.hostWawuId, name: c.hostWawuId },
    memberCount: c.memberCount,
    messagesToday: c.messagesToday,
    kind: c.kind,
    joined: sessionJoinedIds.has(c.id),
  };
}

/**
 * GAP: CommunityMessage's wire shape only carries `senderWawuId` — no
 * display name or avatar (community-message.type.ts is a thin Prisma
 * re-export, no profile join). Falls back to the raw wawuId as the name.
 */
function toCommunityMessage(m: CommunityMessageWire): CommunityMessage {
  return {
    id: m.id,
    communityId: m.communityId,
    sender: { wawuId: m.senderWawuId, name: m.senderWawuId },
    text: m.text,
    costInCredits: m.costInCredits,
    sentAt: m.sentAt,
  };
}

// SEAM: replace with GET /api/hub/credits — verified live: {userWawuId, creditBalance, trialEndsAt}.
export async function getCreditsState(): Promise<CreditsState> {
  try {
    return await apiFetch<CreditsState>("/api/hub/credits", { authed: true });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return getMockCreditsState();
  }
}

// SEAM: replace with GET /api/hub/communities
export async function getCommunities(kind: "joined" | "discover"): Promise<Community[]> {
  try {
    // The real endpoint has no joined/discover filter (registry-frozen:
    // GET /communities, roles: ["any"], page/perPage only — see
    // community.controller.ts) — fetch the full real list once and split
    // client-side by the same `joined` flag toCommunity() sets. Per the GAP
    // above, that means the "joined" tab only reflects communities joined
    // THIS session (via joinCommunity()'s local flip) until the backend adds
    // per-user membership status; it deliberately never shows a real
    // community as joined when it isn't.
    const { data } = await apiFetchPaginated<CommunityWire>("/api/hub/communities?page=1&perPage=100", {
      authed: true,
    });
    // toCommunity() derives `joined` from sessionJoinedIds (see its doc
    // comment) — a real join made earlier THIS session is reflected here
    // on every refetch, across every screen that calls getCommunities().
    const all = data.map(toCommunity);
    return kind === "joined" ? all.filter((c) => c.joined) : all.filter((c) => !c.joined);
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return getMockCommunities(kind);
  }
}

/**
 * Communities THIS account hosts.
 *
 * There is no hosted-communities endpoint and no `?host=` filter on
 * GET /communities (registry-frozen: page/perPage only). But every real
 * CommunityResponse carries `hostWawuId`, so this is a genuine filter over
 * real rows rather than an invented list — it is exactly as complete as the
 * first 100 communities the list endpoint returns, which is the same window
 * getCommunities() already reads. If the catalogue ever outgrows that,
 * this needs a real server-side filter, not a bigger perPage.
 */
// SEAM: replace with GET /api/hub/communities?host=:wawuId once the backend has one
export async function getHostedCommunities(hostWawuId: string): Promise<Community[]> {
  if (!hostWawuId) return [];
  try {
    const { data } = await apiFetchPaginated<CommunityWire>("/api/hub/communities?page=1&perPage=100", {
      authed: true,
    });
    return data.filter((c) => c.hostWawuId === hostWawuId).map(toCommunity);
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return getMockHostedCommunities(hostWawuId);
  }
}

export interface CreateCommunityInput {
  name: string;
  description: string;
  kind: "open" | "private";
}

/**
 * POST /api/hub/communities — the create endpoint the Community module never
 * had. Its gates live on the server and are deliberately NOT re-implemented
 * here as the source of truth (the UI's own checks, from creatorGates(), are
 * there to explain the rule before the request, never to replace it):
 *   - creator account with `subscriptionPaid` — uploading/hosting gate
 *   - `kind: "private"` additionally requires tier `pro` (docs/01 §4);
 *     `kind: "open"` works on Basic (docs/01 §4, "unlimited messages in open
 *     communities")
 *   - KYC is NOT required — it gates earning, never creating (CLAUDE.md's
 *     two-independent-gates rule)
 *
 * A real rejection (403 wrong tier / no subscription, 400 validation, 409
 * duplicate name) is surfaced to the caller untouched. Only genuine mock mode
 * — no backend configured at all — falls back to the in-memory community,
 * same discipline as every other write in this file.
 */
export async function createCommunity(input: CreateCommunityInput): Promise<Community> {
  try {
    const wire = await apiFetch<CommunityWire>("/api/hub/communities", {
      method: "POST",
      authed: true,
      body: { name: input.name, description: input.description, kind: input.kind },
    });
    // Make the host's membership REAL rather than assumed. Whether POST
    // /communities also writes a CommunityMembership row for its creator is
    // the server's business and not something this client can know, so it
    // asks — POST /communities/:id/join is idempotent (community.service.ts
    // `join` returns any existing row untouched), so this either creates the
    // host's membership or confirms the one the create already made. Without
    // it the host lands in the room they just created looking at a "Join
    // community" button. A failure here is not a failed create: the community
    // exists, and the room's own join control can still be used.
    try {
      await joinCommunity(wire.id);
    } catch {
      /* room created; membership can be settled from the room itself */
    }
    return toCommunity(wire);
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    const user = sessionStorage.getUser();
    // SEAM: replace with POST /api/hub/communities
    return createMockCommunity({
      ...input,
      host: { wawuId: user?.wawuId ?? "wawu-me", name: user?.fullName ?? "You" },
    });
  }
}

// SEAM: replace with GET /api/hub/communities/:id
export async function getCommunity(id: string): Promise<Community | null> {
  try {
    const wire = await apiFetch<CommunityWire>(`/api/hub/communities/${id}`, { authed: true });
    return toCommunity(wire);
  } catch (e) {
    if (isMockModeError(e)) return getMockCommunity(id);
    // A real 404 means the community genuinely doesn't exist — that's
    // useCommunityThread's "not-found" state, not a retry-able error. Any
    // other real rejection (5xx, network) must surface as a real failure
    // ("failed"), not silently mocked or misread as not-found.
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

// SEAM: replace with GET /api/hub/communities/:id/messages
export async function getCommunityMessages(id: string): Promise<CommunityMessage[]> {
  try {
    // CommunityMessageService.list orders newest-first (`sentAt: 'desc'`,
    // matching CommentService's sibling precedent per its own doc comment —
    // verified live). This thread UI renders oldest-first, appending new
    // sends to the end (useCommunityThread.send), so reverse to chat order.
    const { data } = await apiFetchPaginated<CommunityMessageWire>(
      `/api/hub/communities/${id}/messages?page=1&perPage=50`,
      { authed: true },
    );
    return data.map(toCommunityMessage).reverse();
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return getMockCommunityMessages(id);
  }
}

// SEAM: replace with POST /api/hub/communities/:id/messages
export async function sendCommunityMessage(id: string, text: string): Promise<CommunityMessage> {
  try {
    const wire = await apiFetch<CommunityMessageWire>(`/api/hub/communities/${id}/messages`, {
      method: "POST",
      authed: true,
      body: { text },
    });
    return toCommunityMessage(wire);
  } catch (e) {
    // The "buy more credits" rejection (CommunityMessageService.create:
    // creditBalance=0 and the 7-day trial has ended) is a real 402, not a
    // network failure — don't paper over it as a mock success. It's thrown
    // as `{message, reason:'insufficient_credits'}`, but the shared
    // AllExceptionsFilter (common/filters/all-exceptions.filter.ts) strips
    // every HttpException body down to `{statusCode, message, data:null}`
    // before it reaches the client — `reason` never survives. Verified
    // against the backend's own contract spec, which only asserts
    // status 402 + a message containing "credit", never a `reason`/`code`
    // field. So status 402 is the only reliable signal; re-surface it with a
    // synthetic `code` so callers can branch on it the same way auth.ts's
    // WAWU ID errors are branched on (`err.code === "insufficient_credits"`).
    if (e instanceof ApiError && e.status === 402) {
      throw new ApiError(e.message, e.status, "insufficient_credits");
    }
    // Any other real rejection (5xx, network) must surface as a real send
    // failure, not a fake "sent" message the recipient never received.
    if (!isMockModeError(e)) throw e;
    return sendMockCommunityMessage(id, text);
  }
}

// SEAM: replace with POST /api/hub/communities/:id/join
export async function joinCommunity(id: string): Promise<boolean> {
  try {
    await apiFetch<CommunityMembershipWire>(`/api/hub/communities/${id}/join`, {
      method: "POST",
      authed: true,
    });
    // Real success — record it so every subsequent toCommunity() call (any
    // list refetch, on this page or any other) reflects the join. See the
    // sessionJoinedIds doc comment above.
    sessionJoinedIds.add(id);
    // GAP: a private community's join returns status:"pending" (queued for
    // host approval — CommunityService.join never auto-approves it) rather
    // than "joined". `joinCommunity(): Promise<boolean>` has no room to carry
    // that distinction, and both existing callers (useCommunityThread.doJoin,
    // CommunityTabs.doJoin) immediately flip `joined: true` on any truthy
    // return, so a pending request currently reads as fully joined in the UI.
    // Real and unresolved without a signature change to
    // Promise<CommunityMembership> once a pending-approval UI exists.
    return true;
  } catch (e) {
    // A real backend rejection (e.g. 400 for a nonexistent community id)
    // must reach the caller as a real failure, not a fake success that
    // moves the row to "Yours" anyway. Only genuine mock mode falls back.
    if (!isMockModeError(e)) throw e;
    return joinMockCommunity(id);
  }
}

/**
 * The real credit-purchase contract (WAWU-Hub-API src/credit-purchase/) is a
 * three-step Flutterwave flow:
 *   1. POST /api/hub/credits/purchase {pack} -> a Flutterwave config
 *      (txRef/amount/currency/publicKey). No balance change yet.
 *   2. The payer completes the charge in Flutterwave's inline checkout.
 *   3. POST /api/hub/credits/purchase/verify {transaction_id, tx_ref} ->
 *      {creditBalance} — the ONLY thing that actually credits the balance.
 *      The server re-verifies with Flutterwave before crediting; a
 *      client-side callback is never trusted on its own, same rule as
 *      content.ts's verifyUnlock.
 *
 * Until the checkout step existed this function returned `topUpMockCredits()`
 * unconditionally, which handed out real spendable credits for free without
 * ever contacting the backend. It now runs the genuine flow, falling back to
 * the mock only in true mock mode (no backend configured).
 */
/**
 * `onCharged` fires once Flutterwave reports a completed charge, before the
 * server verifies it. Callers use it to move from "opening checkout" to
 * "confirming payment" at the moment that becomes true.
 */
export async function topUpCredits(
  pack: CreditPackId,
  onCharged?: () => void,
): Promise<number> {
  try {
    const init = await initiateCreditsPurchase(pack);

    const customer = checkoutCustomerFromSession(sessionStorage.getUser());
    if (!customer) throw new Error("You need to be signed in with a valid email to buy credits.");

    const charge = await openFlutterwaveCheckout(init.flutterwaveConfig, customer, {
      title: "WAWU Credits",
      description: `Credit pack, ${pack}`,
    });

    onCharged?.();

    const { creditBalance } = await verifyCreditsPurchase({
      transaction_id: charge.transaction_id,
      tx_ref: charge.tx_ref,
    });
    return creditBalance;
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    // SEAM: replace with POST /api/hub/credits/purchase + .../verify
    return topUpMockCredits(pack);
  }
}

export interface FlutterwaveConfig {
  txRef: string;
  amount: number;
  currency: "NGN";
  publicKey: string;
}

// SEAM: replace with POST /api/hub/credits/purchase — verified live.
export async function initiateCreditsPurchase(
  pack: CreditPackId,
): Promise<{ flutterwaveConfig: FlutterwaveConfig }> {
  return apiFetch<{ flutterwaveConfig: FlutterwaveConfig }>("/api/hub/credits/purchase", {
    method: "POST",
    authed: true,
    body: { pack },
  });
}

// SEAM: replace with POST /api/hub/credits/purchase/verify — verified live.
export async function verifyCreditsPurchase(payload: {
  transaction_id: string;
  tx_ref: string;
}): Promise<{ creditBalance: number }> {
  return apiFetch<{ creditBalance: number }>("/api/hub/credits/purchase/verify", {
    method: "POST",
    authed: true,
    body: payload,
  });
}
