import type { DmStatus, DmThreadDetail, DmThreadMessage, DmThreadSummary } from "@/types/dm";
import { apiFetch, apiFetchPaginated, delay } from "./client";
import {
  getMockDmThread,
  getMockDmThreads,
  getMockUnreadDmCount,
  sendMockPaidDm,
  type DmSendResult,
} from "./mocks/dm";

/**
 * Wire shape of DirectMessage as returned by the real backend
 * (/workspace/projects/WAWU-Hub-API/src/direct-message — prisma model is the
 * wire shape verbatim, see src/common/types/direct-message.type.ts). This is
 * the FAN side: `senderWawuId` is always the signed-in caller here.
 *
 * GAP: the row carries only `creatorWawuId` — no creator name/handle/avatar.
 * There is no profile-join on this endpoint and no bulk creator-lookup route
 * in DirectMessage's contract. DmThreadSummary.creatorName/creatorHandle are
 * synthesized below as placeholders (see `creatorDisplay`) until a real
 * profile source is wired in from the caller side or the backend adds one.
 */
interface RawDirectMessage {
  id: string;
  creatorWawuId: string;
  senderWawuId: string;
  text: string;
  amount: number;
  status: DmStatus;
  sentAt: string;
  deadlineAt: string;
  respondedAt: string | null;
  responseText: string | null;
  flutterwaveTxRef: string;
}

/** HH:MM in 24h, or a short weekday/date for older messages — matches the mock's display style. */
function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: false });
  const daysAgo = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (daysAgo >= 0 && daysAgo < 6) return d.toLocaleDateString("en-NG", { weekday: "short" });
  return d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
}

/** "Tomorrow, 09:41" / "Today, 21:40" style label for a deadline, matching the mock's copy. */
function formatDeadline(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const time = d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit", hour12: false });
  const dayDiff = Math.round((new Date(d.toDateString()).getTime() - new Date(now.toDateString()).getTime()) / 86_400_000);
  const dayLabel = dayDiff === 0 ? "Today" : dayDiff === 1 ? "Tomorrow" : d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
  return `${dayLabel}, ${time}`;
}

/**
 * GAP: no creator profile available on the DM row (see RawDirectMessage
 * doc comment) — placeholder until a real name/handle source is wired in.
 */
function creatorDisplay(creatorWawuId: string): { creatorName: string; creatorHandle: string } {
  return { creatorName: "Creator", creatorHandle: creatorWawuId };
}

function toDmThreadSummary(dm: RawDirectMessage): DmThreadSummary {
  const { creatorName, creatorHandle } = creatorDisplay(dm.creatorWawuId);
  return {
    id: dm.id,
    creatorWawuId: dm.creatorWawuId,
    creatorName,
    creatorHandle,
    snippet: dm.responseText ?? dm.text,
    lastAt: formatWhen(dm.respondedAt ?? dm.sentAt),
    // GAP: DirectMessage has no read/unread flag for the sender — the
    // backend only tracks status, not fan-side read state. Always false
    // (never a false "you have unread replies" badge) until the backend
    // models this.
    unread: false,
    status: dm.status,
    amount: dm.amount,
  };
}

function toDmThreadMessages(dm: RawDirectMessage): DmThreadMessage[] {
  const messages: DmThreadMessage[] = [{ id: `${dm.id}-ask`, from: "me", text: dm.text, at: formatWhen(dm.sentAt) }];
  if (dm.responseText && dm.respondedAt) {
    messages.push({ id: `${dm.id}-reply`, from: "creator", text: dm.responseText, at: formatWhen(dm.respondedAt) });
  }
  return messages;
}

function toDmThreadDetail(dm: RawDirectMessage): DmThreadDetail {
  return {
    summary: toDmThreadSummary(dm),
    messages: toDmThreadMessages(dm),
    deadlineAt: dm.status === "awaiting_response" ? formatDeadline(dm.deadlineAt) : undefined,
    // GAP: DirectMessage has no `refundedAt` column (schema only tracks
    // `status`) — the deferred deadline-sweep cron that flips a thread to
    // `refunded` doesn't stamp a timestamp either. No refund date to show.
    refundedAt: undefined,
  };
}

export async function fetchUnreadDmCount(): Promise<number> {
  try {
    // GAP: no dedicated unread-count endpoint exists on DirectMessage — and
    // per the GAP above, DirectMessage has no read/unread flag at all, so
    // even summing over /dm/threads can't produce a real unread count.
    // Falls straight to mock; there is nothing real to compute this from.
    return await getMockUnreadDmCount();
  } catch {
    return getMockUnreadDmCount();
  }
}

// SEAM: replace with GET /api/hub/dm/inbox
export async function getDmThreads(): Promise<DmThreadSummary[]> {
  try {
    const { data } = await apiFetchPaginated<RawDirectMessage>("/api/hub/dm/threads", { authed: true });
    return data.map(toDmThreadSummary);
  } catch {
    return getMockDmThreads();
  }
}

// SEAM: replace with GET /api/hub/dm/:id
export async function getDmThread(threadId: string): Promise<DmThreadDetail | null> {
  try {
    const dm = await apiFetch<RawDirectMessage>(`/api/hub/dm/${threadId}`, { authed: true });
    return toDmThreadDetail(dm);
  } catch {
    return getMockDmThread(threadId);
  }
}

/**
 * Client-charge + server-verify, mirroring content.ts's unlock flow:
 * `POST /dm/:creatorWawuId/send` inits the Flutterwave charge (no DM row is
 * created yet), then `POST /dm/:messageId/send/verify` server-verifies it
 * and creates the real row. There is no Flutterwave inline-checkout SDK
 * wired into this client yet (same gap content/[id]/page.tsx's unlock flow
 * has) — the pause below stands in for the user completing payment in that
 * widget, exactly like that page does inline.
 */
export async function sendPaidDm(
  creator: { wawuId: string; name: string; handle: string },
  text: string,
  amount: number,
): Promise<{ threadId: string; result: DmSendResult }> {
  try {
    const init = await apiFetch<{
      flutterwaveConfig: { txRef: string; amount: number; currency: "NGN"; publicKey: string };
      threadId: string;
    }>(`/api/hub/dm/${creator.wawuId}/send`, { method: "POST", authed: true, body: { text } });

    await delay(1200);

    try {
      await apiFetch(`/api/hub/dm/${init.threadId}/send/verify`, {
        method: "POST",
        authed: true,
        body: { transaction_id: `txn-${Date.now()}`, tx_ref: init.flutterwaveConfig.txRef },
      });
      return { threadId: init.threadId, result: "success" };
    } catch {
      // Charge was initiated but never confirmed — a real payment failure,
      // not a reason to fall back to mock data.
      return { threadId: init.threadId, result: "payment_failed" };
    }
  } catch {
    // SEAM: replace with POST /api/hub/dm/:creatorId/send
    return sendMockPaidDm(creator, text, amount);
  }
}
