import type { DmStatus, DmThreadDetail, DmThreadMessage, DmThreadSummary } from "@/types/dm";
import { delay } from "../client";

const MOCK_THREADS: DmThreadSummary[] = [
  {
    id: "t-adaeze",
    creatorWawuId: "wawu-adaeze",
    creatorName: "Adaeze Okonkwo",
    creatorHandle: "adaeze",
    creatorAvatarUrl: null,
    snippet: "Yes, 12 seats left. I reply fastest on WAWU.",
    lastAt: "12:04",
    unread: true,
    status: "responded",
    amount: 300,
  },
  {
    id: "t-funmi",
    creatorWawuId: "wawu-funmi",
    creatorName: "Funmi Adeyemi",
    creatorHandle: "funmi",
    creatorAvatarUrl: null,
    snippet: "Do you still make the ankara tote bags?",
    lastAt: "09:41",
    unread: true,
    status: "awaiting_response",
    amount: 450,
  },
  {
    id: "t-zainab",
    creatorWawuId: "wawu-zainab",
    creatorName: "Zainab Bello",
    creatorHandle: "zainab",
    creatorAvatarUrl: null,
    snippet: "You got a refund of ₦200",
    lastAt: "Mon",
    unread: false,
    status: "refunded",
    amount: 200,
  },
];

const MOCK_THREAD_DETAILS: Record<string, { messages: DmThreadMessage[]; deadlineAt?: string; refundedAt?: string }> = {
  "t-adaeze": {
    messages: [
      { id: "m1", from: "me", text: "Hi Adaeze! Are the December registration slots still open?", at: "11:38" },
      { id: "m2", from: "creator", text: "Yes, 12 seats left. I reply fastest on WAWU.", at: "12:04" },
    ],
  },
  "t-funmi": {
    messages: [{ id: "m1", from: "me", text: "Do you still make the ankara tote bags?", at: "09:41" }],
    deadlineAt: "Tomorrow, 09:41",
  },
  "t-zainab": {
    messages: [{ id: "m1", from: "me", text: "Can I order a custom mix for my sister's graduation?", at: "Mon" }],
    refundedAt: "Monday",
  },
};

/** Paid DM entry states for the fan sheet. */
export type DmSendResult = "success" | "payment_failed" | "cancelled" | "verify_failed" | "error";

// SEAM: replace with GET /api/hub/dm/inbox
export async function getMockDmThreads(): Promise<DmThreadSummary[]> {
  await delay(300);
  return MOCK_THREADS;
}

// SEAM: replace with GET /api/hub/dm/inbox
export async function getMockDmThread(threadId: string): Promise<DmThreadDetail | null> {
  await delay(300);
  const summary = MOCK_THREADS.find((t) => t.id === threadId);
  if (!summary) return null;
  const detail = MOCK_THREAD_DETAILS[threadId] ?? { messages: [] };
  return { summary, messages: detail.messages, deadlineAt: detail.deadlineAt, refundedAt: detail.refundedAt };
}

let sendCounter = 0;

/**
 * Simulates the compose + pay round trip. Always succeeds so the happy path is
 * demoable; the sheet renders its failure state if this ever rejects.
 */
// SEAM: replace with POST /api/hub/dm/:creatorId/send
export async function sendMockPaidDm(
  creator: { wawuId: string; name: string; handle: string },
  text: string,
  amount: number,
): Promise<{ threadId: string; result: DmSendResult }> {
  await delay(650);
  sendCounter += 1;
  const threadId = `t-${creator.wawuId}-${sendCounter}`;
  MOCK_THREADS.unshift({
    id: threadId,
    creatorWawuId: creator.wawuId,
    creatorName: creator.name,
    creatorHandle: creator.handle,
    creatorAvatarUrl: null,
    snippet: text,
    lastAt: "Just now",
    unread: false,
    status: "awaiting_response",
    amount,
  });
  MOCK_THREAD_DETAILS[threadId] = {
    messages: [{ id: `m-${sendCounter}`, from: "me", text, at: "Just now" }],
    deadlineAt: "Tomorrow, this time",
  };
  return { threadId, result: "success" };
}