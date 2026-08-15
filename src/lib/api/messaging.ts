import type { MessagingState, ResponseStats, PenaltyKind, ThreadDetail } from "@/types/messaging";
import { mockRequest } from "./client";

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
  getState: () => mockRequest({ ...currentMessaging, threads: [...currentMessaging.threads] }),
  // SEAM: replace with GET /api/hub/dm/stats
  getStats: () => mockRequest({ ...currentMessaging.responseStats }),
  // SEAM: replace with GET /api/hub/dm/penalty
  getPenalty: () => mockRequest(currentMessaging.penalty),
  // SEAM: replace with GET /api/hub/dm/inbox
  getThreads: () => mockRequest(paidQuestions.map(cloneThread)),
  // SEAM: replace with GET /api/hub/dm/:threadId
  getThread: (id) => {
    const found = paidQuestions.find((t) => t.id === id);
    return mockRequest(found ? cloneThread(found) : undefined);
  },
  // SEAM: replace with POST /api/hub/dm/:messageId/respond { text }
  replyToThread: (id, text) => {
    const thread = paidQuestions.find((t) => t.id === id);
    if (!thread) return Promise.reject(new Error(`Unknown thread ${id}`));
    thread.messages.push({ id: `${id}-m${thread.messages.length + 1}`, from: "creator", text });
    thread.status = "answered";
    thread.deadlineMinutes = undefined;
    thread.deadlineLabel = undefined;
    return mockRequest(cloneThread(thread));
  },
};
