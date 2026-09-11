import type {
  Community,
  CommunityJoinRequest,
  CommunityMessage,
  CreditPackId,
  CreditsState,
} from "@/types/credits";
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
  getMockJoinRequests,
  getMockMembership,
  approveMockJoinRequest,
  declineMockJoinRequest,
  removeMockCommunityMember,
  joinMockCommunity,
  sendMockCommunityMessage,
  topUpMockCredits,
  updateMockCommunityImage,
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
  /** Nullable on the server — a community without a picture is normal. */
  imageUrl: string | null;
  memberCount: number;
  messagesToday: number;
}

/**
 * Wire shape for GET/POST /api/hub/communities/:id/messages
 * (community-message.type.ts). `sender` is populated on GET's list() from a
 * batched UserProfile + WAWU ID lookup (real name, handle, avatar) — it is
 * absent on POST's create() response, where the sender is always the caller
 * and toCommunityMessage() below falls back to the session user for that
 * case.
 */
interface CommunityMessageWire {
  id: string;
  communityId: string;
  senderWawuId: string;
  /** Null on an image-only message — `text` is nullable on the server. */
  text: string | null;
  imageUrl: string | null;
  costInCredits: number;
  sentAt: string;
  sender?: { wawuId: string; name: string; handle: string | null; avatarUrl: string | null };
}

/** Wire shape returned by POST /api/hub/communities/:id/join (community-membership.type.ts). */
interface CommunityMembershipWire {
  id: string;
  userWawuId: string;
  communityId: string;
  status: "joined" | "pending";
  /** When they asked. Set on every row; `joinedAt` stays null while pending. */
  requestedAt: string;
  joinedAt: string | null;
}

/** The server's two membership states. There is deliberately no "declined". */
export type CommunityMembershipStatus = "joined" | "pending";

/**
 * Wire shape for GET /api/hub/communities/:id/requests — the host's review
 * queue. A membership row plus the requester's `UserProfile.handle`, which
 * is genuinely nullable (see CommunityJoinRequest in types/credits.ts).
 */
interface CommunityJoinRequestWire extends CommunityMembershipWire {
  handle: string | null;
  avatarUrl: string | null;
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

/**
 * The same trick for the state a private community's requester sits in:
 * asked, not yet answered. Kept apart from `sessionJoinedIds` because the
 * two are not the same permission — a pending member cannot read or post,
 * and the server enforces that — so collapsing them would put someone in a
 * room the backend then refuses every message from.
 *
 * Unlike `joined`, this one CAN be rehydrated after a reload:
 * `getMyMembership()` reads the real `GET /communities/:id/membership` and
 * writes the answer back into these sets. Room screens do that on load, so
 * "waiting for the host" survives a refresh; the browse LISTS still show
 * only what this session has seen, because there is still no per-user field
 * on `GET /communities` and no membership-list endpoint.
 */
const sessionPendingIds = new Set<string>();

/** Records the server's real answer so every later read of any list agrees with it. */
function rememberMembership(id: string, status: CommunityMembershipStatus): CommunityMembershipStatus {
  if (status === "joined") {
    sessionJoinedIds.add(id);
    sessionPendingIds.delete(id);
  } else {
    sessionPendingIds.add(id);
    sessionJoinedIds.delete(id);
  }
  return status;
}

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
    pending: sessionPendingIds.has(c.id),
    imageUrl: c.imageUrl ?? null,
  };
}

/**
 * The backend now joins the sender's real profile in on GET's list()
 * (community-message.service.ts's `list()`, batched via WawuIdClient +
 * UserProfile). POST's create() response has no `sender` (the sender there
 * is always the caller, who already knows who they are) — that case falls
 * back to the signed-in session user rather than a bare wawuId, so a message
 * that has just been sent doesn't flash an id where the name goes before the
 * next refetch fills it in. The absolute last resort (`sender` missing AND
 * no session user, which should not happen for an authed send) still falls
 * back to the raw wawuId rather than an empty name.
 */
function toCommunityMessage(m: CommunityMessageWire): CommunityMessage {
  const self = sessionStorage.getUser();
  const sender = m.sender
    ? { wawuId: m.sender.wawuId, name: m.sender.name || m.sender.handle || m.senderWawuId, handle: m.sender.handle, avatarUrl: m.sender.avatarUrl }
    : self && self.wawuId === m.senderWawuId
      ? { wawuId: m.senderWawuId, name: self.fullName || m.senderWawuId, handle: null, avatarUrl: self.avatarUrl ?? null }
      : { wawuId: m.senderWawuId, name: m.senderWawuId, handle: null, avatarUrl: null };
  return {
    id: m.id,
    communityId: m.communityId,
    sender,
    text: m.text,
    imageUrl: m.imageUrl ?? null,
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
  /** Already-uploaded image URL from `uploadFile(file, "community/image")`. */
  imageUrl?: string | null;
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
      body: {
        name: input.name,
        description: input.description,
        kind: input.kind,
        // Omitted entirely when there is none — the server's column is
        // nullable and the DTO field optional, so sending `null` is not
        // needed to mean "no picture".
        ...(input.imageUrl ? { imageUrl: input.imageUrl } : {}),
      },
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
    //
    // ...but ONLY for an open community. `join` decides the status from
    // `kind`, so calling it on a room you host that is PRIVATE files a
    // `pending` request from the host to themselves — which would then show
    // up in their own approval queue and leave them staring at "waiting for
    // the host" in their own room. The server already treats the host as a
    // member without a row (`assertMember` short-circuits on
    // `hostWawuId`), so the honest client-side move is to record that,
    // not to ask.
    if (input.kind === "open") {
      try {
        await joinCommunity(wire.id);
      } catch {
        /* room created; membership can be settled from the room itself */
      }
    } else {
      rememberMembership(wire.id, "joined");
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

/**
 * PATCH /api/hub/communities/:id — host-only edit. Only the picture is
 * exposed from the client today, which is the only part of the room a host
 * had no way to change: `imageUrl: null` clears it back to the placeholder,
 * an omitted field leaves it alone. The endpoint also takes name/description;
 * they are not wired to a screen yet, so nothing here pretends they are.
 *
 * A real rejection (403 not the host, 400 validation) surfaces untouched —
 * the host-only rule is the server's, never re-implemented here.
 */
// SEAM: replace with PATCH /api/hub/communities/:id
export async function updateCommunityImage(id: string, imageUrl: string | null): Promise<Community> {
  try {
    const wire = await apiFetch<CommunityWire>(`/api/hub/communities/${id}`, {
      method: "PATCH",
      authed: true,
      body: { imageUrl },
    });
    return toCommunity(wire);
  } catch (e) {
    // Only genuine mock mode falls back — a real 403 (not the host) or 400
    // must reach the caller as a real failure, not a picture that looks
    // changed and is not.
    if (!isMockModeError(e)) throw e;
    return updateMockCommunityImage(id, imageUrl);
  }
}

// SEAM: replace with GET /api/hub/communities/:id
export async function getCommunity(id: string): Promise<Community | null> {
  try {
    // Two reads, because the room's identity and the caller's standing in it
    // are two different questions and the room screen cannot render honestly
    // without both. Before this, `joined` came only from what THIS session
    // happened to have done, so a reload put a "Join community" button in
    // front of someone who had already asked — or in front of a member.
    // `getMyMembership` never throws; a room that fails to answer is treated
    // as "no membership", which is exactly what the screen already assumes.
    const [wire, status] = await Promise.all([
      apiFetch<CommunityWire>(`/api/hub/communities/${id}`, { authed: true }),
      getMyMembership(id),
    ]);
    const community = toCommunity(wire);
    // The host is a member of their own room without a membership row — the
    // server's own convention (`assertMember` short-circuits on the host).
    if (wire.hostWawuId === sessionStorage.getUser()?.wawuId) {
      return { ...community, joined: true, pending: false };
    }
    return { ...community, joined: status === "joined", pending: status === "pending" };
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

/**
 * Sends one message: text, a photo, or both — never neither, which the server
 * rejects with a 400 and which no caller here can produce.
 *
 * `imageUrl` is an ALREADY-UPLOADED URL from `uploadFile(file,
 * "community/message")`; the bytes go straight to storage and only the
 * resulting link is sent here. Either way it is ONE message and costs ONE
 * credit — the server prices by message, never by what is in it, so a photo
 * never costs more than a sentence (docs/01 §3: 1 credit = 1 message).
 */
// SEAM: replace with POST /api/hub/communities/:id/messages
export async function sendCommunityMessage(
  id: string,
  text: string,
  imageUrl?: string | null,
): Promise<CommunityMessage> {
  try {
    const wire = await apiFetch<CommunityMessageWire>(`/api/hub/communities/${id}/messages`, {
      method: "POST",
      authed: true,
      // Each half is omitted when absent rather than sent as null: both DTO
      // fields are optional and the pair is validated together server-side.
      body: {
        ...(text ? { text } : {}),
        ...(imageUrl ? { imageUrl } : {}),
      },
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
    return sendMockCommunityMessage(id, text, imageUrl ?? null);
  }
}

/**
 * POST /api/hub/communities/:id/join.
 *
 * Returns the membership STATUS the server actually wrote, not a boolean.
 * An open community joins instantly (`"joined"`); a private one records a
 * request the host must approve (`"pending"`), and until they do the member
 * cannot read or post — the backend's `assertMember` requires `"joined"`.
 * This used to return `true` for both, so a private request rendered as a
 * completed join and the room then refused every message the "member" sent.
 */
// SEAM: replace with POST /api/hub/communities/:id/join
export async function joinCommunity(id: string): Promise<CommunityMembershipStatus> {
  try {
    const wire = await apiFetch<CommunityMembershipWire>(`/api/hub/communities/${id}/join`, {
      method: "POST",
      authed: true,
    });
    // Real success — record it so every subsequent toCommunity() call (any
    // list refetch, on this page or any other) reflects the real status. See
    // the sessionJoinedIds doc comment above.
    rememberMembership(id, wire.status);
    return wire.status;
  } catch (e) {
    // A real backend rejection (e.g. 400 for a nonexistent community id)
    // must reach the caller as a real failure, not a fake success that
    // moves the row to "Yours" anyway. Only genuine mock mode falls back.
    if (!isMockModeError(e)) throw e;
    return joinMockCommunity(id);
  }
}

/**
 * GET /api/hub/communities/:id/membership — the caller's own membership row,
 * or null if they have none.
 *
 * This is what makes "you asked, the host hasn't answered" survive a reload:
 * the session sets below are per-tab guesses, this is the server's answer.
 * A failure is NOT an error the caller has to handle — an unauthenticated or
 * flaky read simply means "we don't know", which is the same as no
 * membership for rendering purposes, so it resolves to null rather than
 * taking a room screen down.
 */
// SEAM: replace with GET /api/hub/communities/:id/membership
export async function getMyMembership(id: string): Promise<CommunityMembershipStatus | null> {
  try {
    const wire = await apiFetch<CommunityMembershipWire | null>(
      `/api/hub/communities/${id}/membership`,
      { authed: true },
    );
    if (wire?.status) rememberMembership(id, wire.status);
    return wire?.status ?? null;
  } catch (e) {
    if (!isMockModeError(e)) return null;
    return getMockMembership(id);
  }
}

/**
 * The host's review queue for a private community —
 * `GET /api/hub/communities/:id/requests`, host-only on the server.
 *
 * Ordered oldest-request-first by the backend (`requestedAt`), and that
 * order is preserved here: the whole point of a queue is answering who has
 * been waiting longest.
 */
// SEAM: replace with GET /api/hub/communities/:id/requests
export async function getJoinRequests(communityId: string): Promise<CommunityJoinRequest[]> {
  try {
    const { data } = await apiFetchPaginated<CommunityJoinRequestWire>(
      `/api/hub/communities/${communityId}/requests?page=1&perPage=100`,
      { authed: true },
    );
    return data.map((r) => ({
      communityId: r.communityId,
      user: { wawuId: r.userWawuId, handle: r.handle, avatarUrl: r.avatarUrl },
      requestedAt: r.requestedAt,
    }));
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return getMockJoinRequests(communityId);
  }
}

/**
 * Pending-request counts for the communities this account hosts, keyed by id.
 *
 * Only PRIVATE communities are asked about: an open one admits instantly and
 * can never have a pending row, so querying it would be a wasted round trip
 * for a guaranteed zero. One request per private community — there is no
 * batch endpoint, and a creator hosts a handful of rooms, not hundreds.
 *
 * A failure on one community is not a failure of the badge: that room is
 * simply left out of the map rather than taking a dashboard down.
 */
export async function getPendingRequestCounts(
  communities: Community[],
): Promise<Record<string, number>> {
  const priv = communities.filter((c) => c.kind === "private");
  if (priv.length === 0) return {};
  const entries = await Promise.all(
    priv.map(async (c) => {
      try {
        return [c.id, (await getJoinRequests(c.id)).length] as const;
      } catch {
        return null;
      }
    }),
  );
  return Object.fromEntries(entries.filter((e): e is readonly [string, number] => e !== null));
}

/**
 * Approve a pending request — `POST /communities/:id/requests/:userWawuId/approve`.
 * The server flips the row to `joined` and stamps `joinedAt`, which is what
 * finally lets the member into the room. Approving an already-approved row
 * is a no-op there, so a double-tap on a stale queue is safe.
 */
// SEAM: replace with POST /api/hub/communities/:id/requests/:userWawuId/approve
export async function approveJoinRequest(communityId: string, userWawuId: string): Promise<void> {
  try {
    await apiFetch(`/api/hub/communities/${communityId}/requests/${userWawuId}/approve`, {
      method: "POST",
      authed: true,
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    await approveMockJoinRequest(communityId, userWawuId);
  }
}

/**
 * Decline a pending request — `DELETE /communities/:id/requests/:userWawuId`.
 *
 * Declining DELETES the request rather than storing a "declined" state (the
 * server's decision — see CommunityService.declineJoinRequest), so the
 * person can ask again and the host will see them in the queue if they do.
 * The UI must not promise a permanent block it does not implement.
 *
 * A 409 means the request was already approved from somewhere else and this
 * queue is stale; the server refuses rather than ejecting a real member, and
 * that message is surfaced to the host untouched.
 */
// SEAM: replace with DELETE /api/hub/communities/:id/requests/:userWawuId
export async function declineJoinRequest(communityId: string, userWawuId: string): Promise<void> {
  try {
    await apiFetch(`/api/hub/communities/${communityId}/requests/${userWawuId}`, {
      method: "DELETE",
      authed: true,
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    await declineMockJoinRequest(communityId, userWawuId);
  }
}

/**
 * Remove someone already in the room — `DELETE /communities/:id/members/:userWawuId`.
 * Deliberately separate from declining: ejecting a settled member must never
 * be something a stale queue does by accident.
 */
// SEAM: replace with DELETE /api/hub/communities/:id/members/:userWawuId
export async function removeCommunityMember(communityId: string, userWawuId: string): Promise<void> {
  try {
    await apiFetch(`/api/hub/communities/${communityId}/members/${userWawuId}`, {
      method: "DELETE",
      authed: true,
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    await removeMockCommunityMember(communityId, userWawuId);
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
    }, {
      verifyPath: "/api/hub/credits/purchase/verify",
      successPath: "/communities",
      label: "Your credits",
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
