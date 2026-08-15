import type { DmThreadDetail, DmThreadSummary } from "@/types/dm";
import {
  getMockDmThread,
  getMockDmThreads,
  getMockUnreadDmCount,
  sendMockPaidDm,
  type DmSendResult,
} from "./mocks/dm";

export async function fetchUnreadDmCount(): Promise<number> {
  // Target: part of GET /api/hub/dm/inbox (mocked until the API is live)
  return getMockUnreadDmCount();
}

export async function getDmThreads(): Promise<DmThreadSummary[]> {
  return getMockDmThreads();
}

export async function getDmThread(threadId: string): Promise<DmThreadDetail | null> {
  return getMockDmThread(threadId);
}

export async function sendPaidDm(
  creator: { wawuId: string; name: string; handle: string },
  text: string,
  amount: number,
): Promise<{ threadId: string; result: DmSendResult }> {
  return sendMockPaidDm(creator, text, amount);
}