/** WAWU Credits — a prepaid message-unit count, never currency (docs/01 §3). */
export type CreditPackId = "starter" | "popular" | "pro";

/** Locked pack sizes. Credits are never a naira value and never cashable. */
export const CREDIT_PACKS: Record<CreditPackId, { credits: number; price: number }> = {
  starter: { credits: 50, price: 500 },
  popular: { credits: 120, price: 1000 },
  pro: { credits: 300, price: 2000 },
};

export interface CreditsState {
  /** Count of credits, never a currency amount. */
  creditBalance: number;
  /** 7 days from signup; null once it has lapsed. */
  trialEndsAt?: string | null;
}

export interface Community {
  id: string;
  name: string;
  description?: string;
  host: { wawuId: string; name: string; verified?: boolean };
  memberCount: number;
  messagesToday?: number;
  kind: "open" | "private";
  joined: boolean;
  /**
   * Access to a PRIVATE community was requested and the host has not answered
   * yet — the server's `status: "pending"` membership. Distinct from `joined`
   * on purpose: a pending member cannot read or post (the backend's
   * `assertMember` requires `joined`), so showing them the room, or showing
   * them a "Join" button they have already pressed, are both lies. Absent on
   * an open community, where joining is instant.
   */
  pending?: boolean;
  /**
   * The room's picture. Null/absent is normal — every community that existed
   * before the column has none — and every surface falls back to the
   * placeholder tile rather than showing a broken frame.
   */
  imageUrl?: string | null;
}

/**
 * One entry in a private community host's review queue —
 * `GET /api/hub/communities/:id/requests`.
 *
 * `handle` is genuinely nullable: handles are optional on UserProfile and a
 * requester may have no profile row at all. The server returns null rather
 * than inventing a name, and every surface falls back to the wawuId.
 */
export interface CommunityJoinRequest {
  communityId: string;
  user: { wawuId: string; handle: string | null };
  /** ISO timestamp of when they asked — the queue is ordered oldest-first. */
  requestedAt: string;
}

export interface CommunityMessage {
  id: string;
  communityId: string;
  sender: { wawuId: string; name: string; avatarUrl?: string };
  /** Null on an image-only message: a photo IS the message. */
  text: string | null;
  /** A photo posted in the room. A message is text, an image, or both. */
  imageUrl?: string | null;
  /** 1 credit per message — a photo costs the same as a sentence. */
  costInCredits: number;
  sentAt: string;
}