/**
 * DM reply record over the last 30 days — drives penalties.
 *
 * `rate` is the MISSED/UNANSWERED percentage, not an answered/response
 * rate — every UI consumer (Inbox's penalty banner, PaidMessagesSettings'
 * "Your reply record") displays it as "X% unanswered" / "X% missed". It is
 * backed directly by the real backend's CreatorNoResponseTracker.
 * noResponseRatePct (see messaging.ts) — never invert it when mapping the
 * wire response; a prior version of that mapping did (`100 - pct`) and
 * confirmed live as "100% missed" for a creator with a perfect 0%
 * no-response record.
 */
export interface ResponseStats {
  responded: number;
  total: number;
  /** Percentage 0–100, missed/unanswered — NOT an answered-rate. */
  rate: number;
}

export type PenaltyKind = "none" | "warned" | "disabled7" | "disabled30";

export interface Thread {
  id: string;
  buyerName: string;
  buyerInitials: string;
  preview: string;
  price: number;
  /** True once the buyer has opened it (starts the 24h window). */
  opened: boolean;
  expiresAt?: string;
  unread?: number;
  /**
   * Real thread status when known (from the backend's DirectMessage.status),
   * used to tell an answered thread from a refunded one within the
   * "opened" bucket. Undefined for mock data, which doesn't model refunds
   * on this shape — Inbox treats undefined as answered (its prior default).
   */
  status?: ThreadStatus;
  /** How long the creator took to reply, e.g. "3h" / "45m". Undefined if not yet replied or unknown. */
  repliedIn?: string;
}

export interface MessagingState {
  threads: Thread[];
  responseStats: ResponseStats;
  penalty: PenaltyKind;
}

export type ThreadStatus = "awaiting" | "answered" | "refunded";

export interface ThreadMessage {
  id: string;
  from: "buyer" | "creator";
  text: string;
  attachmentName?: string;
}

/**
 * A single paid-question thread with its full conversation — powers the
 * desktop three-pane inbox (design D8). Mobile has no creator-side
 * thread/reply view yet, so this is a separate shape from `Thread` above
 * rather than an extension of it.
 */
export interface ThreadDetail {
  id: string;
  buyerName: string;
  buyerInitials: string;
  location?: string;
  /** e.g. "22h ago". */
  askedAgo: string;
  /** What the buyer paid, held until answered or refunded. */
  price: number;
  status: ThreadStatus;
  /** Minutes remaining to respond. Present only while status === "awaiting". */
  deadlineMinutes?: number;
  /** Human label, e.g. "1h 12m left". Present only while status === "awaiting". */
  deadlineLabel?: string;
  messages: ThreadMessage[];
}
