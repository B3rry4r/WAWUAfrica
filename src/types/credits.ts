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
}

export interface CommunityMessage {
  id: string;
  communityId: string;
  sender: { wawuId: string; name: string; avatarUrl?: string };
  text: string;
  /** 1 credit per message in general/open communities. */
  costInCredits: number;
  sentAt: string;
}