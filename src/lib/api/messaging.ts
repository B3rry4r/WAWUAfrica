import type { MessagingState, ResponseStats, PenaltyKind, Thread, ThreadDetail, ThreadMessage, ThreadStatus } from "@/types/messaging";
import { apiFetch, apiFetchPaginated, mockRequest } from "./client";

export const currentMessaging: MessagingState = {
  threads: [
    {
      id: "t1",
      buyerName: "Ada",
      buyerInitials: "A",
      preview: "Is your stall pricing guide still available?",
      price: 300,
      opened: true,
      expiresAt: "in 18h 20m",
    },
    {
      id: "t2",
      buyerName: "Musa",
      buyerInitials: "M",
      preview: "I bought the playbook yesterday — quick question.",
      price: 300,
      opened: false,
    },
    {
      id: "t3",
      buyerName: "Tobi",
      buyerInitials: "T",
      preview: "Can I resell your PDF to my group?",
      price: 300,
      opened: false,
    },
  ],
  responseStats: { responded: 14, total: 18, rate: 22 },
  penalty: "warned",
};

/**
 * Desktop-only (D8 three-pane inbox) full thread conversations. Mobile has
 * no creator-side thread detail view, so this is a separate mock store from
 * `currentMessaging.threads` above rather than an extension of it.
 */
export const paidQuestions: ThreadDetail[] = [
  {
    id: "t1",
    buyerName: "Ada Eze",
    buyerInitials: "A",
    location: "Lagos",
    askedAgo: "22h ago",
    price: 300,
    status: "awaiting",
    deadlineMinutes: 72,
    deadlineLabel: "1h 12m",
    messages: [
      {
        id: "t1-m1",
        from: "buyer",
        text: "I'm registering with my sister — is a business name enough or do we need a limited company? We plan to supply two schools.",
        attachmentName: "quote-two-schools.pdf",
      },
    ],
  },
  {
    id: "t2",
    buyerName: "Musa Danladi",
    buyerInitials: "M",
    location: "Kaduna",
    askedAgo: "14h ago",
    price: 300,
    status: "awaiting",
    deadlineMinutes: 544,
    deadlineLabel: "9h 04m",
    messages: [
      {
        id: "t2-m1",
        from: "buyer",
        text: "I bought the playbook yesterday — quick question: can I use my personal account for payouts, or does it need to be the business's?",
      },
    ],
  },
  {
    id: "t3",
    buyerName: "Tobi Alade",
    buyerInitials: "T",
    location: "Ibadan",
    askedAgo: "2h ago",
    price: 300,
    status: "awaiting",
    deadlineMinutes: 1300,
    deadlineLabel: "21h 40m",
    messages: [{ id: "t3-m1", from: "buyer", text: "Can I resell your PDF to my group, or is it single-use?" }],
  },
  {
    id: "t4",
    buyerName: "Zainab Bello",
    buyerInitials: "Z",
    location: "Kano",
    askedAgo: "1d ago",
    price: 300,
    status: "answered",
    messages: [
      { id: "t4-m1", from: "buyer", text: "Best month to file annual returns?" },
      {
        id: "t4-m2",
        from: "creator",
        text: "January to March, right after the calendar year closes — file early so you're not competing with the deadline crowd.",
      },
    ],
  },
];

function cloneThread(t: ThreadDetail): ThreadDetail {
  return { ...t, messages: t.messages.map((m) => ({ ...m })) };
}

/**
 * Wire shape of DirectMessage as returned by the real backend
 * (/workspace/projects/WAWU-Hub-API/src/direct-message — prisma model is
 * the wire shape verbatim). This is the CREATOR side: `creatorWawuId` is
 * always the signed-in caller here, `senderWawuId` is the buyer.
 *
 * GAP: the row carries only `senderWawuId` — no buyer name/initials. There
 * is no profile-join on this endpoint and no bulk user-lookup route in
 * DirectMessage's contract. Thread/ThreadDetail's buyer fields are
 * synthesized below as placeholders (see `buyerDisplay`).
 */
interface RawDirectMessage {
  id: string;
  creatorWawuId: string;
  senderWawuId: string;
  text: string;
  amount: number;
  status: "awaiting_response" | "responded" | "refunded";
  sentAt: string;
  deadlineAt: string;
  respondedAt: string | null;
  responseText: string | null;
  flutterwaveTxRef: string;
}

/** Wire shape of GET /dm/response-stats (CreatorNoResponseTracker). */
interface RawResponseStats {
  creatorWawuId: string;
  /** The NO-response rate — inverse of the fan-facing "response rate" concept. */
  noResponseRatePct: number;
  penaltyState: "none" | "warned" | "disabled_7d" | "disabled_30d";
  dmDisabledUntil: string | null;
}

function toPenaltyKind(state: RawResponseStats["penaltyState"]): PenaltyKind {
  switch (state) {
    case "disabled_7d":
      return "disabled7";
    case "disabled_30d":
      return "disabled30";
    default:
      return state;
  }
}

/**
 * GAP: no buyer profile available on the DM row (see RawDirectMessage doc
 * comment) — placeholder until a real name source is wired in.
 */
function buyerDisplay(senderWawuId: string): { buyerName: string; buyerInitials: string } {
  return { buyerName: "Buyer", buyerInitials: senderWawuId.slice(0, 1).toUpperCase() || "B" };
}

/** "22h ago" / "2h ago" / "1d ago" — matches the mock's copy style. */
function formatAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return `${Math.max(1, Math.floor(ms / 60_000))}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** "1h 12m" / "9h 04m" style duration label, minutes zero-padded per the mock. */
function formatDuration(ms: number): { minutes: number; label: string } {
  const totalMinutes = Math.max(0, Math.round(ms / 60_000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { minutes: totalMinutes, label: `${hours}h ${String(minutes).padStart(2, "0")}m` };
}

function toThreadStatus(status: RawDirectMessage["status"]): ThreadStatus {
  if (status === "awaiting_response") return "awaiting";
  if (status === "responded") return "answered";
  return "refunded";
}

function toThread(dm: RawDirectMessage): Thread {
  const { buyerName, buyerInitials } = buyerDisplay(dm.senderWawuId);
  const remainingMs = new Date(dm.deadlineAt).getTime() - Date.now();
  return {
    id: dm.id,
    buyerName,
    buyerInitials,
    preview: dm.text,
    price: dm.amount,
    // GAP: DirectMessage has no separate "opened" state — the mock model's
    // held-until-opened window doesn't exist on the real backend, whose
    // 24h deadline runs from `sentAt` unconditionally (registry note:
    // "single locked deadline"). Every awaiting DM is already "open" and
    // counting down from send time, so this is always true.
    opened: true,
    expiresAt:
      dm.status === "awaiting_response" && remainingMs > 0 ? `in ${formatDuration(remainingMs).label}` : undefined,
    // GAP: no per-thread unread counter on the backend.
    unread: undefined,
  };
}

function toThreadMessages(dm: RawDirectMessage): ThreadMessage[] {
  const messages: ThreadMessage[] = [{ id: `${dm.id}-m1`, from: "buyer", text: dm.text }];
  if (dm.responseText) messages.push({ id: `${dm.id}-m2`, from: "creator", text: dm.responseText });
  return messages;
}

function toThreadDetail(dm: RawDirectMessage): ThreadDetail {
  const { buyerName, buyerInitials } = buyerDisplay(dm.senderWawuId);
  const remainingMs = new Date(dm.deadlineAt).getTime() - Date.now();
  const awaiting = dm.status === "awaiting_response";
  const duration = awaiting && remainingMs > 0 ? formatDuration(remainingMs) : undefined;
  return {
    id: dm.id,
    buyerName,
    buyerInitials,
    // GAP: no buyer location on the backend.
    location: undefined,
    askedAgo: formatAgo(dm.sentAt),
    price: dm.amount,
    status: toThreadStatus(dm.status),
    deadlineMinutes: duration?.minutes,
    deadlineLabel: duration?.label,
    messages: toThreadMessages(dm),
  };
}

export interface MessagingApi {
  getState: () => Promise<MessagingState>;
  getStats: () => Promise<ResponseStats>;
  getPenalty: () => Promise<PenaltyKind>;
  /** Desktop three-pane inbox (D8): full thread list with conversations. */
  getThreads: () => Promise<ThreadDetail[]>;
  /** Desktop three-pane inbox (D8): a single thread's full conversation. */
  getThread: (id: string) => Promise<ThreadDetail | undefined>;
  /** Creator's answer — releases the held payment. */
  replyToThread: (id: string, text: string) => Promise<ThreadDetail>;
}

export const messagingApi: MessagingApi = {
  // SEAM: replace with GET /api/hub/dm/inbox
  getState: async () => {
    try {
      const [{ data: inbox }, stats] = await Promise.all([
        apiFetchPaginated<RawDirectMessage>("/api/hub/dm/inbox", { authed: true }),
        apiFetch<RawResponseStats>("/api/hub/dm/response-stats", { authed: true }),
      ]);
      return {
        threads: inbox.map(toThread),
        // GAP: response-stats has no responded/total counts, only a rolling
        // no-response percentage — see RawResponseStats doc comment. There
        // is nothing on the real backend to populate these two counts from.
        responseStats: { responded: 0, total: 0, rate: Math.round(100 - stats.noResponseRatePct) },
        penalty: toPenaltyKind(stats.penaltyState),
      };
    } catch {
      return mockRequest({ ...currentMessaging, threads: [...currentMessaging.threads] });
    }
  },
  // SEAM: replace with GET /api/hub/dm/stats
  getStats: async () => {
    try {
      const stats = await apiFetch<RawResponseStats>("/api/hub/dm/response-stats", { authed: true });
      // GAP: see RawResponseStats doc comment — responded/total aren't available.
      return { responded: 0, total: 0, rate: Math.round(100 - stats.noResponseRatePct) };
    } catch {
      return mockRequest({ ...currentMessaging.responseStats });
    }
  },
  // SEAM: replace with GET /api/hub/dm/penalty
  getPenalty: async () => {
    try {
      const stats = await apiFetch<RawResponseStats>("/api/hub/dm/response-stats", { authed: true });
      return toPenaltyKind(stats.penaltyState);
    } catch {
      return mockRequest(currentMessaging.penalty);
    }
  },
  // SEAM: replace with GET /api/hub/dm/inbox
  getThreads: async () => {
    try {
      const { data } = await apiFetchPaginated<RawDirectMessage>("/api/hub/dm/inbox", { authed: true });
      return data.map(toThreadDetail);
    } catch {
      return mockRequest(paidQuestions.map(cloneThread));
    }
  },
  // SEAM: replace with GET /api/hub/dm/:threadId
  getThread: async (id) => {
    try {
      const dm = await apiFetch<RawDirectMessage>(`/api/hub/dm/${id}`, { authed: true });
      return toThreadDetail(dm);
    } catch {
      const found = paidQuestions.find((t) => t.id === id);
      return mockRequest(found ? cloneThread(found) : undefined);
    }
  },
  // SEAM: replace with POST /api/hub/dm/:messageId/respond { text }
  replyToThread: async (id, text) => {
    try {
      const dm = await apiFetch<RawDirectMessage>(`/api/hub/dm/${id}/respond`, {
        method: "POST",
        authed: true,
        body: { text },
      });
      return toThreadDetail(dm);
    } catch {
      const thread = paidQuestions.find((t) => t.id === id);
      if (!thread) return Promise.reject(new Error(`Unknown thread ${id}`));
      thread.messages.push({ id: `${id}-m${thread.messages.length + 1}`, from: "creator", text });
      thread.status = "answered";
      thread.deadlineMinutes = undefined;
      thread.deadlineLabel = undefined;
      return mockRequest(cloneThread(thread));
    }
  },
};
