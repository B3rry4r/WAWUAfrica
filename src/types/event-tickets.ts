/**
 * Event ticketing — buy a seat, hold it, get scanned at the door.
 *
 * Built 29 Aug 2026 on product-owner instruction, reversing the original
 * "Cut entirely: Event Tickets" in docs/01_SPEC.md. Three decisions came with
 * the ask and are load-bearing here:
 *
 *   - WAWU takes its EXISTING cut: 15%, or 10% on a paid creator tier. There
 *     is no events-specific rate. The organiser sees the net, because that is
 *     the number they are owed.
 *   - An organiser who cancels REFUNDS every buyer. Not a status flip — real
 *     money back through Flutterwave.
 *   - Any subscriber may sell.
 *
 * Every shape below is read off the real backend at WAWU-Hub-API
 * `src/event-ticketing/` (service return shapes + dto/), not guessed. Dates
 * cross the wire as ISO 8601 strings, so they are typed `string`.
 *
 * ── WHERE THE MONEY IS, AND WHERE IT IS NOT ─────────────────────────────────
 * `WawuEvent` still carries no price. Money hangs off the TICKET TYPES on an
 * event, which is what lets an event have none — a meetup with a date and a
 * venue and nothing on sale is still the common case. `goingCount` on the
 * event remains an interest signal and is never a sales count; an organiser
 * told they sold forty tickets because forty people clicked Going is an
 * organiser who ordered forty chairs.
 *
 * There is still NO WALLET. Ticket revenue reaches an organiser the way
 * creator earnings do; a cashable balance is a CBN licensing trigger.
 */

import type { EventStatus } from "./events";

/**
 * Mirrors the Prisma `TicketTier` enum. A closed set so the buyer-facing sort
 * order is stable and a typo cannot create a tier nobody can filter.
 */
export type TicketTier = "regular" | "vip" | "vvip" | "early_bird" | "group" | "free";

export const TICKET_TIER_LABEL: Record<TicketTier, string> = {
  regular: "Regular",
  vip: "VIP",
  vvip: "VVIP",
  early_bird: "Early bird",
  group: "Group",
  // Not "Free": this app's copy rules ban that word in user-visible text
  // (scripts/check-copy.mjs). "No charge" is the house phrasing.
  free: "No charge",
};

export const TICKET_TIERS = Object.keys(TICKET_TIER_LABEL) as TicketTier[];

/** Where one ticket is. An order is paid or not; each ticket in it is separate. */
export type EventTicketStatus = "valid" | "checked_in" | "void";

/** One tier on sale, with what is left of it. `GET /events/:id/tickets`. */
export interface EventTicketType {
  id: string;
  tier: TicketTier;
  name: string;
  priceNaira: number;
  quantity: number;
  sold: number;
  remaining: number;
  soldOut: boolean;
  /** ISO 8601, or null for "on sale from the moment it exists". */
  salesStartAt: string | null;
  salesEndAt: string | null;
}

/**
 * One tier as the organiser submits it. `PUT /events/:id/tickets` replaces the
 * whole set, so this is the entire tier and not a patch.
 *
 * A tier that has already sold cannot be repriced or removed — the backend
 * refuses it. The price is snapshotted per order so an edit would not change
 * what anybody paid, but it WOULD change what the ticket in their hand claims
 * to be.
 */
export interface EventTicketTypeDraft {
  tier: TicketTier;
  name: string;
  priceNaira: number;
  quantity: number;
  salesStartAt?: string;
  salesEndAt?: string;
}

/** What the inline Flutterwave checkout needs. Mirrors the DM purchase shape. */
export interface TicketFlutterwaveConfig {
  txRef: string;
  amount: number;
  currency: string;
  publicKey: string;
}

/**
 * `POST /events/:id/orders`.
 *
 * A free tier issues immediately and NEVER touches Flutterwave — routing ₦0
 * through a payment provider is either rejected outright or, worse, accepted
 * as a zero charge that looks real in a reconciliation report. So the response
 * is a discriminated union and the caller must branch on `free`.
 */
export type BuyTicketsResult =
  | { free: true; orderId: string }
  | { free: false; orderId: string; flutterwaveConfig: TicketFlutterwaveConfig };

export interface BuyTicketsBody {
  ticketTypeId: string;
  quantity: number;
  /** Attributes the sale to whoever shared the link. Optional. */
  referralCode?: string;
}

/** One held ticket. What the wallet renders and what the QR carries. */
export interface EventTicket {
  id: string;
  /** The QR payload. Unguessable, and readable aloud when a screen is cracked. */
  code: string;
  status: EventTicketStatus;
  checkedInAt: string | null;
  ticketType: { name: string; tier: TicketTier };
  event: {
    id: string;
    name: string;
    startsAt: string;
    location: string;
    /** Present on the wallet read, absent on the post-purchase read. */
    bannerUrl?: string | null;
    status?: EventStatus;
    /** Non-null means this ticket is void and the money has been sent back. */
    cancelledAt?: string | null;
  };
}

/** What the door gets back. Exactly three outcomes, nothing in between. */
export type ScanOutcome = "valid" | "already_used" | "invalid";

export interface ScanTotals {
  sold: number;
  checkedIn: number;
  remaining: number;
}

export interface ScanResult {
  outcome: ScanOutcome;
  ticket?: {
    code: string;
    tierName: string;
    buyerWawuId: string;
    checkedInAt: string | null;
  };
  /** Live, so a scanner needs one call rather than two. */
  totals?: ScanTotals;
}

/** One shareable link, and what it brought in. */
export interface EventReferral {
  code: string;
  label: string;
  revenueNaira: number;
}

/**
 * `GET /events/:id/dashboard` — the organiser's numbers.
 *
 * `netNaira` is what they are actually owed, after WAWU's cut. It is the
 * headline figure on the screen because gross is the number that gets an
 * organiser's hopes up and then disappoints them at payout.
 */
export interface EventTicketDashboard {
  eventId: string;
  eventName: string;
  ticketsSold: number;
  checkedIn: number;
  remaining: number;
  attendees: number;
  grossNaira: number;
  netNaira: number;
  referrals: EventReferral[];
}

/** `POST /events/:id/cancel`. */
export interface CancelEventResult {
  cancelled: true;
  ordersRefunded: number;
  /**
   * Refunds Flutterwave would not accept. NOT zero means a human has to finish
   * them by hand, and the screen says so rather than reporting a clean
   * cancellation — one silent failure here is somebody out of pocket.
   */
  refundsNeedingAttention: number;
}

/** The backend's ceiling on one order. A group tier sells N times, not N×1000. */
export const MAX_TICKETS_PER_ORDER = 50;

/**
 * WAWU's cut, for the organiser-facing estimate only.
 *
 * The SERVER decides the real rate and snapshots it per order — this is a
 * preview so an organiser setting a price can see what reaches them, and it
 * must never be used to compute anything that is stored or paid.
 */
export const STANDARD_COMMISSION_RATE = 0.15;
export const PAID_TIER_COMMISSION_RATE = 0.1;
