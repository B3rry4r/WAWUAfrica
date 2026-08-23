/** Paid DM lifecycle (docs/01 §2, docs/02 §2.3). */
export type DmStatus = "awaiting_response" | "responded" | "refunded";

/** Rolling no-response penalties, locked thresholds in docs/01 §2. */
export type DmPenaltyState = "none" | "warned" | "disabled_7d" | "disabled_30d";

export interface DmSettings {
  dmEnabled: boolean;
  /** Integer Naira, creator-set. No ceiling: creators price their own time. */
  dmPrice: number;
}

export interface DirectMessage {
  id: string;
  creatorWawuId: string;
  senderWawuId: string;
  text: string;
  /** Snapshot of dmPrice at send time. */
  amount: number;
  status: DmStatus;
  sentAt: string;
  /**
   * sentAt + the creator's reply window — locked at send time and never
   * recomputed. No longer always 24h: creators choose their own window, and
   * each message keeps the one it was paid against.
   */
  deadlineAt: string;
  respondedAt?: string | null;
}

export interface CreatorDmTracker {
  creatorWawuId: string;
  noResponseRatePct: number;
  penaltyState: DmPenaltyState;
  dmDisabledUntil?: string | null;
}

/** Fan-side inbox row. */
export interface DmThreadSummary {
  id: string;
  creatorWawuId: string;
  creatorName: string;
  creatorHandle: string;
  snippet: string;
  lastAt: string;
  unread: boolean;
  status: DmStatus;
  /** Snapshot of dmPrice at send time. */
  amount: number;
}

/** One bubble in a thread. */
export interface DmThreadMessage {
  id: string;
  from: "me" | "creator";
  text: string;
  at: string;
}

export interface DmThreadDetail {
  summary: DmThreadSummary;
  messages: DmThreadMessage[];
  /** Only when awaiting_response. */
  deadlineAt?: string;
  /** Only when refunded. */
  refundedAt?: string;
}