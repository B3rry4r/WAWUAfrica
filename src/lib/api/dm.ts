import type { DmThreadDetail, DmThreadSummary } from "@/types/dm";
import {
  getMockDmThread,
  getMockDmThreads,
  getMockUnreadDmCount,
  sendMockPaidDm,
  type DmSendResult,
} from "./mocks/dm";

export async function fetchUnreadDmCount(): Promise<number> {
  // SEAM: replace with GET /api/hub/dm/inbox (unread count)
  return getMockUnreadDmCount();
}

// SEAM: replace with GET /api/hub/dm/inbox
export async function getDmThreads(): Promise<DmThreadSummary[]> {
  return getMockDmThreads();
}

// SEAM: replace with GET /api/hub/dm/:id
export async function getDmThread(threadId: string): Promise<DmThreadDetail | null> {
  return getMockDmThread(threadId);
}

// SEAM: replace with POST /api/hub/dm/:creatorId/send
export async function sendPaidDm(
  creator: { wawuId: string; name: string; handle: string },
  text: string,
  amount: number,
): Promise<{ threadId: string; result: DmSendResult }> {
  return sendMockPaidDm(creator, text, amount);
}