import type {
  Community,
  CommunityJoinRequest,
  CommunityMessage,
  CreditPackId,
  CreditsState,
} from "@/types/credits";
import { CREDIT_PACKS } from "@/types/credits";
import { delay } from "../client";

/** Balances the signed-in user's credits and joins. Never a currency value. */
let MOCK_BALANCE = 48;
const MOCK_JOINED = new Set<string>(["funmi-books", "zainab-farmers", "adaeze-agro"]);
/** Private communities this account has ASKED to join and is still waiting on. */
const MOCK_PENDING = new Set<string>();

/**
 * The host's review queue, keyed by community id. Only private communities
 * ever have one — an open room admits instantly, so a pending row cannot
 * exist for it. Seeded for `ifeanyi-tailors`, the private fixture below, so
 * the queue screen has something real-shaped to render in dev mode; one
 * requester deliberately has no handle, because the server returns null for
 * anyone who has not set one.
 */
const MOCK_JOIN_REQUESTS: Record<string, { wawuId: string; handle: string | null; requestedAt: string }[]> = {
  "ifeanyi-tailors": [
    {
      wawuId: "wawu-chidera",
      handle: "chidera_fabrics",
      requestedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      wawuId: "wawu-tobi",
      handle: null,
      requestedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

const MOCK_COMMUNITIES: Community[] = [
  {
    id: "adaeze-agro",
    name: "Agro-preneurs Lagos",
    description: "Buy, sell and learn about farming inputs with Adaeze's community.",
    host: { wawuId: "wawu-adaeze", name: "Adaeze Okonkwo", verified: true },
    memberCount: 1240,
    messagesToday: 86,
    kind: "open",
    joined: true,
  },
  {
    id: "zainab-farmers",
    name: "Young farmers network",
    description: "Weekly ideas on running a small farm profitably.",
    host: { wawuId: "wawu-zainab", name: "Zainab Bello", verified: true },
    memberCount: 3200,
    messagesToday: 214,
    kind: "open",
    joined: true,
  },
  {
    id: "funmi-books",
    name: "Small-business books",
    description: "Keep simple records even when you're just starting.",
    host: { wawuId: "wawu-funmi", name: "Funmi Adeyemi", verified: true },
    memberCount: 540,
    messagesToday: 41,
    kind: "open",
    joined: true,
  },
  {
    id: "ifeanyi-tailors",
    name: "Aba tailors circle",
    description: "Private circle for registered tailors and fabric traders.",
    host: { wawuId: "wawu-ifeanyi", name: "Ifeanyi Nwosu", verified: true },
    memberCount: 760,
    messagesToday: 58,
    kind: "private",
    joined: false,
  },
  {
    id: "musa-naija",
    name: "Naija content tips",
    description: "Posting, pricing and growing a Nigerian audience.",
    host: { wawuId: "wawu-musa", name: "Musa Ibrahim", verified: true },
    memberCount: 980,
    messagesToday: 132,
    kind: "open",
    joined: false,
  },
];

const MOCK_MESSAGES: Record<string, CommunityMessage[]> = {
  "adaeze-agro": [
    {
      id: "cm1",
      communityId: "adaeze-agro",
      sender: { wawuId: "wawu-adaeze", name: "Adaeze Okonkwo" },
      text: "Good morning fam, the December registration sheet is open. First come first served.",
      costInCredits: 0,
      sentAt: "09:12",
    },
    {
      id: "cm2",
      communityId: "adaeze-agro",
      sender: { wawuId: "u-tunde", name: "Tunde" },
      text: "Is there a minimum order for the fertilizer group buy?",
      costInCredits: 1,
      sentAt: "09:31",
    },
    {
      id: "cm3",
      communityId: "adaeze-agro",
      sender: { wawuId: "wawu-adaeze", name: "Adaeze Okonkwo" },
      text: "No minimum, just share your quantity and pickup zone.",
      costInCredits: 0,
      sentAt: "09:40",
    },
  ],
  "zainab-farmers": [
    {
      id: "cm1",
      communityId: "zainab-farmers",
      sender: { wawuId: "wawu-zainab", name: "Zainab Bello" },
      text: "This week's idea: price your produce before you harvest, not after.",
      costInCredits: 0,
      sentAt: "Yesterday",
    },
  ],
  "funmi-books": [
    {
      id: "cm1",
      communityId: "funmi-books",
      sender: { wawuId: "wawu-funmi", name: "Funmi Adeyemi" },
      text: "A one-page ledger is enough to start. I'll drop the template today.",
      costInCredits: 0,
      sentAt: "Mon",
    },
  ],
};

// SEAM: replace with GET /api/hub/credits
export async function getMockCreditsState(): Promise<CreditsState> {
  await delay(250);
  return { creditBalance: MOCK_BALANCE, trialEndsAt: null };
}

// SEAM: replace with GET /api/hub/communities
export async function getMockCommunities(kind: "joined" | "discover"): Promise<Community[]> {
  await delay(280);
  const all = MOCK_COMMUNITIES.map((c) => ({
    ...c,
    joined: MOCK_JOINED.has(c.id),
    pending: MOCK_PENDING.has(c.id),
  }));
  return kind === "joined" ? all.filter((c) => c.joined) : all.filter((c) => !c.joined);
}

// SEAM: replace with GET /api/hub/communities/:id
export async function getMockCommunity(id: string): Promise<Community | null> {
  await delay(250);
  const c = MOCK_COMMUNITIES.find((x) => x.id === id);
  return c ? { ...c, joined: MOCK_JOINED.has(c.id), pending: MOCK_PENDING.has(c.id) } : null;
}

// SEAM: replace with GET /api/hub/communities/:id/messages
export async function getMockCommunityMessages(id: string): Promise<CommunityMessage[]> {
  await delay(250);
  return MOCK_MESSAGES[id] ?? [];
}

/**
 * 1 credit per message in open communities; reading is always free. A photo
 * costs the same ONE credit as a sentence — the real service prices by
 * message, never by content type, and the mock must not imply otherwise.
 */
// SEAM: replace with POST /api/hub/communities/:id/messages
export async function sendMockCommunityMessage(
  id: string,
  text: string,
  imageUrl: string | null = null,
): Promise<CommunityMessage> {
  await delay(350);
  MOCK_BALANCE = Math.max(0, MOCK_BALANCE - 1);
  const msg: CommunityMessage = {
    id: `cm-${Date.now()}`,
    communityId: id,
    sender: { wawuId: "wawu-me", name: "Amara Okafor" },
    text: text || null,
    imageUrl,
    costInCredits: 1,
    sentAt: "Just now",
  };
  MOCK_MESSAGES[id] = [...(MOCK_MESSAGES[id] ?? []), msg];
  return msg;
}

/**
 * Dev-mode stand-in for PATCH /communities/:id (image only). Mutates the same
 * in-memory row every other mock read uses, so the new picture shows up in
 * the rooms list and the room header immediately.
 */
// SEAM: replace with PATCH /api/hub/communities/:id
export async function updateMockCommunityImage(id: string, imageUrl: string | null): Promise<Community> {
  await delay(300);
  const community = MOCK_COMMUNITIES.find((c) => c.id === id);
  if (!community) throw new Error("Community not found");
  community.imageUrl = imageUrl;
  return { ...community, joined: MOCK_JOINED.has(community.id) };
}

// SEAM: replace with POST /api/hub/communities/:id/join
export async function joinMockCommunity(id: string): Promise<"joined" | "pending"> {
  await delay(250);
  // Mirrors the server's rule exactly (CommunityService.join): an open room
  // admits instantly, a private one files a request the host must approve.
  // Returning "joined" for both here would hide the pending screen from
  // dev-mode work on the very flow it exists for.
  const community = MOCK_COMMUNITIES.find((c) => c.id === id);
  if (community?.kind === "private") {
    MOCK_PENDING.add(id);
    MOCK_JOIN_REQUESTS[id] = [
      ...(MOCK_JOIN_REQUESTS[id] ?? []),
      { wawuId: "wawu-me", handle: "you", requestedAt: new Date().toISOString() },
    ];
    return "pending";
  }
  MOCK_JOINED.add(id);
  return "joined";
}

// SEAM: replace with GET /api/hub/communities/:id/membership
export async function getMockMembership(id: string): Promise<"joined" | "pending" | null> {
  await delay(120);
  if (MOCK_JOINED.has(id)) return "joined";
  if (MOCK_PENDING.has(id)) return "pending";
  return null;
}

// SEAM: replace with GET /api/hub/communities/:id/requests
export async function getMockJoinRequests(communityId: string): Promise<CommunityJoinRequest[]> {
  await delay(220);
  return (MOCK_JOIN_REQUESTS[communityId] ?? []).map((r) => ({
    communityId,
    user: { wawuId: r.wawuId, handle: r.handle, avatarUrl: null },
    requestedAt: r.requestedAt,
  }));
}

// SEAM: replace with POST /api/hub/communities/:id/requests/:userWawuId/approve
export async function approveMockJoinRequest(communityId: string, userWawuId: string): Promise<void> {
  await delay(280);
  MOCK_JOIN_REQUESTS[communityId] = (MOCK_JOIN_REQUESTS[communityId] ?? []).filter(
    (r) => r.wawuId !== userWawuId,
  );
  const community = MOCK_COMMUNITIES.find((c) => c.id === communityId);
  if (community) community.memberCount += 1;
  // Approving your own pending request is how the dev-mode requester gets in.
  if (userWawuId === "wawu-me") {
    MOCK_PENDING.delete(communityId);
    MOCK_JOINED.add(communityId);
  }
}

/**
 * Declining DELETES the request, exactly as the server does — there is no
 * "declined" state to store, and the person may ask again. See
 * declineJoinRequest in ../communities.ts.
 */
// SEAM: replace with DELETE /api/hub/communities/:id/requests/:userWawuId
export async function declineMockJoinRequest(communityId: string, userWawuId: string): Promise<void> {
  await delay(280);
  MOCK_JOIN_REQUESTS[communityId] = (MOCK_JOIN_REQUESTS[communityId] ?? []).filter(
    (r) => r.wawuId !== userWawuId,
  );
  if (userWawuId === "wawu-me") MOCK_PENDING.delete(communityId);
}

// SEAM: replace with DELETE /api/hub/communities/:id/members/:userWawuId
export async function removeMockCommunityMember(communityId: string, userWawuId: string): Promise<void> {
  await delay(280);
  const community = MOCK_COMMUNITIES.find((c) => c.id === communityId);
  if (community && community.memberCount > 0) community.memberCount -= 1;
  if (userWawuId === "wawu-me") {
    MOCK_JOINED.delete(communityId);
    MOCK_PENDING.delete(communityId);
  }
}

/**
 * Communities this account hosts. Real communities carry a `hostWawuId`, so
 * "mine" is a filter over the same list the discover/joined tabs read — there
 * is no separate hosted-communities fixture and no separate endpoint.
 */
// SEAM: replace with GET /api/hub/communities (filtered by hostWawuId)
export async function getMockHostedCommunities(hostWawuId: string): Promise<Community[]> {
  await delay(240);
  return MOCK_COMMUNITIES.filter((c) => c.host.wawuId === hostWawuId).map((c) => ({
    ...c,
    joined: MOCK_JOINED.has(c.id),
  }));
}

/**
 * Dev-mode stand-in for POST /communities. Pushes a genuinely new row into the
 * same in-memory list every other mock read uses, so the community shows up in
 * Hosting, in Discover and in the onboarding checklist immediately — it does
 * not fabricate members or activity it could not have.
 */
// SEAM: replace with POST /api/hub/communities
export async function createMockCommunity(input: {
  name: string;
  description: string;
  kind: "open" | "private";
  imageUrl?: string | null;
  host: { wawuId: string; name: string };
}): Promise<Community> {
  await delay(420);
  const community: Community = {
    id: `c-${Date.now()}`,
    name: input.name,
    description: input.description,
    host: { wawuId: input.host.wawuId, name: input.host.name },
    memberCount: 0,
    messagesToday: 0,
    kind: input.kind,
    joined: true,
    imageUrl: input.imageUrl ?? null,
  };
  MOCK_COMMUNITIES.push(community);
  MOCK_JOINED.add(community.id);
  MOCK_MESSAGES[community.id] = [];
  return community;
}

// SEAM: replace with POST /api/hub/credits/purchase
export async function topUpMockCredits(pack: CreditPackId): Promise<number> {
  await delay(500);
  MOCK_BALANCE += CREDIT_PACKS[pack].credits;
  return MOCK_BALANCE;
}