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
