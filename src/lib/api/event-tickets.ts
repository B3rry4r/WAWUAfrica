import type {
  BuyTicketsBody,
  BuyTicketsResult,
  CancelEventResult,
  EventTicket,
  EventTicketDashboard,
  EventTicketType,
  EventTicketTypeDraft,
  EventReferral,
  ScanResult,
} from "@/types/event-tickets";
import { apiFetch, isMockModeError } from "./client";
import {
  buyMockTickets,
  cancelMockEvent,
  createMockReferral,
  getMockDashboard,
  getMockTicketTypes,
  getMockTickets,
  scanMockTicket,
  setMockTicketTypes,
  verifyMockOrder,
} from "./mocks/event-tickets";

/**
 * Event ticketing — `/api/hub/events/*`.
 *
 * The backend is DONE (WAWU-Hub-API `src/event-ticketing/`), so every shape
 * here is read off the real controller and service returns rather than a
 * target guess.
 *
 * ── THE ONE THING TO GET RIGHT ─────────────────────────────────────────────
 * `buyTickets` returns a DISCRIMINATED UNION. A free tier issues immediately
 * and never touches Flutterwave; a paid one comes back with a charge config
 * that the caller must complete and then `verifyOrder`. A caller that ignores
 * `free` and reaches for `flutterwaveConfig` gets undefined and shows a
 * checkout for nothing, so the type makes that unreachable rather than
 * documenting it.
 *
 * ── FAILURE DISCIPLINE ─────────────────────────────────────────────────────
 * Mock fallback is gated on `isMockModeError` everywhere, as in events.ts. A
 * real refusal — sold out (409), not yours (403), payment not verified (400)
 * — is rethrown so the screen can say what actually happened. Swallowing a
 * sold-out into fixture data would hand somebody a ticket that does not
 * exist.
 *
 * `verifyOrder` is deliberately NOT given a mock fallback path that invents
 * success: it is the call that runs AFTER money has moved.
 */

/** Public. A ticket page a stranger cannot open sells nothing. */
// SEAM: replace with GET /api/hub/events/:id/tickets
export async function listTicketTypes(eventId: string): Promise<EventTicketType[]> {
  try {
    return await apiFetch<EventTicketType[]>(`/api/hub/events/${eventId}/tickets`, { authed: true });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return getMockTicketTypes(eventId);
  }
}

/**
 * Organiser. Replaces the WHOLE set of tiers, which is why the screen sends
 * every row back rather than the one that changed.
 *
 * The backend refuses to remove or reprice a tier that has already sold. That
 * is a 409 and it is rethrown — the organiser needs to know which tier is
 * frozen, not to watch their edit silently not happen.
 */
// SEAM: replace with PUT /api/hub/events/:id/tickets
export async function setTicketTypes(
  eventId: string,
  types: EventTicketTypeDraft[],
): Promise<EventTicketType[]> {
  try {
    return await apiFetch<EventTicketType[]>(`/api/hub/events/${eventId}/tickets`, {
      method: "PUT",
      authed: true,
      body: { types },
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return setMockTicketTypes(eventId, types);
  }
}

/**
 * Open an order.
 *
 * Nothing is charged here and no ticket exists yet unless the tier is free.
 * The pending order holds the price the SERVER calculated, so a client that
 * edits the amount it hands the inline SDK buys nothing.
 */
// SEAM: replace with POST /api/hub/events/:id/orders
export async function buyTickets(eventId: string, body: BuyTicketsBody): Promise<BuyTicketsResult> {
  try {
    return await apiFetch<BuyTicketsResult>(`/api/hub/events/${eventId}/orders`, {
      method: "POST",
      authed: true,
      body,
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return buyMockTickets(eventId, body);
  }
}

/**
 * Confirm the money and receive the tickets.
 *
 * Called only AFTER the charge completed on Flutterwave's own surface. It is
 * idempotent server-side — the browser's verify and the webhook can settle the
 * same charge, and the second caller gets the tickets that exist rather than a
 * duplicate set — so a screen may retry it safely.
 */
// SEAM: replace with POST /api/hub/events/orders/:orderId/verify
export async function verifyOrder(
  orderId: string,
  charge: { transaction_id: string; tx_ref: string },
): Promise<EventTicket[]> {
  try {
    return await apiFetch<EventTicket[]>(`/api/hub/events/orders/${orderId}/verify`, {
      method: "POST",
      authed: true,
      body: charge,
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return verifyMockOrder(orderId);
  }
}

/** The wallet. Every ticket this person holds. */
// SEAM: replace with GET /api/hub/events/tickets/mine
export async function myTickets(): Promise<EventTicket[]> {
  try {
    return await apiFetch<EventTicket[]>(`/api/hub/events/tickets/mine`, { authed: true });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return getMockTickets();
  }
}

/**
 * The door.
 *
 * Returns VALID / ALREADY USED / INVALID and the live counts in one call.
 * ALREADY USED is a normal answer, not an error — the same person queueing
 * twice is the ordinary case — so it comes back 200 and the screen renders it
 * as a state rather than a failure.
 */
// SEAM: replace with POST /api/hub/events/:id/check-in
export async function scanTicket(eventId: string, code: string): Promise<ScanResult> {
  try {
    return await apiFetch<ScanResult>(`/api/hub/events/${eventId}/check-in`, {
      method: "POST",
      authed: true,
      body: { code },
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return scanMockTicket(eventId, code);
  }
}

/** Sold, revenue, check-ins, referrals. Organiser only — 403 otherwise. */
// SEAM: replace with GET /api/hub/events/:id/dashboard
export async function ticketDashboard(eventId: string): Promise<EventTicketDashboard> {
  try {
    return await apiFetch<EventTicketDashboard>(`/api/hub/events/${eventId}/dashboard`, { authed: true });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return getMockDashboard(eventId);
  }
}

/** A shareable link that attributes the sales it brings in. */
// SEAM: replace with POST /api/hub/events/:id/referrals
export async function createReferral(eventId: string, label: string): Promise<EventReferral> {
  try {
    return await apiFetch<EventReferral>(`/api/hub/events/${eventId}/referrals`, {
      method: "POST",
      authed: true,
      body: { label },
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return createMockReferral(eventId, label);
  }
}

/**
 * Call it off.
 *
 * Voids every ticket and refunds every buyer — a real Flutterwave refund per
 * order. `refundsNeedingAttention` is the number Flutterwave would not accept,
 * and it is NOT an error: the cancellation happened. The screen has to report
 * it plainly, because a non-zero there is somebody out of pocket until a human
 * finishes the job by hand.
 */
// SEAM: replace with POST /api/hub/events/:id/cancel
export async function cancelEvent(eventId: string, reason: string): Promise<CancelEventResult> {
  try {
    return await apiFetch<CancelEventResult>(`/api/hub/events/${eventId}/cancel`, {
      method: "POST",
      authed: true,
      body: { reason },
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return cancelMockEvent(eventId, reason);
  }
}
