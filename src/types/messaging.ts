/** DM response rate over the last 28 days — drives penalties. */
export interface ResponseStats {
  responded: number;
  total: number;
  /** Percentage 0–100. */
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
