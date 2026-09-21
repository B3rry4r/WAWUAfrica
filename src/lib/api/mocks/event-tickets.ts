import type {
  BuyTicketsBody,
  BuyTicketsResult,
  CancelEventResult,
  EventReferral,
  EventTicket,
  EventTicketDashboard,
  EventTicketType,
  EventTicketTypeDraft,
  ScanResult,
} from "@/types/event-tickets";
import { STANDARD_COMMISSION_RATE } from "@/types/event-tickets";

/**
 * DEV FIXTURES for event ticketing. Replaced wholesale by the real backend —
 * every read in ../event-tickets.ts is tagged with the endpoint that supersedes
 * it.
 *
 * The states here are chosen to be the ones that are hard to reach on demand
 * and easy to get wrong: a tier that has SOLD OUT, a ticket already CHECKED IN,
 * and an event that was CANCELLED with its tickets void. A fixture set where
 * everything is available and valid lets a screen ship having only ever been
 * looked at in its best state.
 *
 * Mutations are in-memory and last until reload, which is enough to walk a
 * flow end to end without a backend.
 */

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Same alphabet as the server: no confusable characters, readable aloud. */
const CODE_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
function mockCode(seed: number): string {
  let out = "";
  let x = seed * 2654435761;
  for (let i = 0; i < 16; i += 1) {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    out += CODE_ALPHABET[x % CODE_ALPHABET.length];
  }
  return `${out.slice(0, 4)}-${out.slice(4, 8)}-${out.slice(8, 12)}-${out.slice(12, 16)}`;
}

function inDays(days: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const TICKET_TYPES: Record<string, EventTicketType[]> = {
  "ev-creator-summit": [
    {
      id: "tt-summit-early",
      tier: "early_bird",
      name: "Early bird",
      priceNaira: 7500,
      quantity: 100,
      sold: 100,
      remaining: 0,
      soldOut: true,
      salesStartAt: null,
      salesEndAt: null,
    },
    {
      id: "tt-summit-regular",
      tier: "regular",
      name: "Regular",
      priceNaira: 12000,
      quantity: 400,
      sold: 268,
      remaining: 132,
      soldOut: false,
      salesStartAt: null,
      salesEndAt: null,
    },
    {
      id: "tt-summit-vip",
      tier: "vip",
      name: "VIP. Front rows and lunch",
      priceNaira: 35000,
      quantity: 60,
      sold: 41,
      remaining: 19,
      soldOut: false,
      salesStartAt: null,
      salesEndAt: null,
    },
  ],
  "ev-lagos-meetup": [
    {
      id: "tt-meetup-free",
      tier: "free",
      name: "No charge",
      priceNaira: 0,
      quantity: 80,
      sold: 52,
      remaining: 28,
      soldOut: false,
      salesStartAt: null,
      salesEndAt: null,
    },
  ],
  /*
    Tiers on the rest of the upcoming fixtures, so the calendar's cards have a
    real price to read. The calendar prices a card from the cheapest tier on
    the event (lowestTicketPrices), and with only two fixtures carrying tiers
    every other card fell back to no price at all — which is the correct
    rendering of "nothing on sale" and the wrong way to look at a screen whose
    design prices every card.
  */
  "ev-pricing-workshop": [
    {
      id: "tt-pricing-regular",
      tier: "regular",
      name: "Seat",
      priceNaira: 10000,
      quantity: 120,
      sold: 44,
      remaining: 76,
      soldOut: false,
      salesStartAt: null,
      salesEndAt: null,
    },
  ],
  "ev-export-clinic": [
    {
      id: "tt-export-early",
      tier: "early_bird",
      name: "Early bird",
      priceNaira: 5000,
      quantity: 40,
      sold: 40,
      remaining: 0,
      soldOut: true,
      salesStartAt: null,
      salesEndAt: null,
    },
    {
      id: "tt-export-regular",
      tier: "regular",
      name: "Regular",
      priceNaira: 8500,
      quantity: 100,
      sold: 31,
      remaining: 69,
      soldOut: false,
      salesStartAt: null,
      salesEndAt: null,
    },
  ],
  "ev-poultry-webinar": [
    {
      id: "tt-poultry-regular",
      tier: "regular",
      name: "Seat",
      priceNaira: 3500,
      quantity: 300,
      sold: 122,
      remaining: 178,
      soldOut: false,
      salesStartAt: null,
      salesEndAt: null,
    },
  ],
  "ev-textile-competition": [
    {
      id: "tt-textile-entry",
      tier: "regular",
      name: "Entry",
      priceNaira: 15000,
      quantity: 60,
      sold: 18,
      remaining: 42,
      soldOut: false,
      salesStartAt: null,
      salesEndAt: null,
    },
  ],
};

let ticketSeq = 100;
const TICKETS: EventTicket[] = [
  {
    id: "tk-1",
    code: mockCode(1),
    status: "valid",
    checkedInAt: null,
    ticketType: { name: "Regular", tier: "regular" },
    event: {
      id: "ev-creator-summit",
      name: "WAWU Creator Summit 2026",
      startsAt: inDays(5, 9),
      location: "Landmark Centre, Lagos",
      bannerUrl: null,
      status: "published",
      cancelledAt: null,
    },
  },
  {
    id: "tk-2",
    code: mockCode(2),
    status: "valid",
    checkedInAt: null,
    ticketType: { name: "VIP. Front rows and lunch", tier: "vip" },
    event: {
      id: "ev-creator-summit",
      name: "WAWU Creator Summit 2026",
      startsAt: inDays(5, 9),
      location: "Landmark Centre, Lagos",
      bannerUrl: null,
      status: "published",
      cancelledAt: null,
    },
  },
  {
    // Already through the door. The wallet must not offer this one as a QR to
    // queue with, and the scanner must answer ALREADY USED for it.
    id: "tk-3",
    code: mockCode(3),
    status: "checked_in",
    checkedInAt: inDays(-2, 19),
    ticketType: { name: "No charge", tier: "free" },
    event: {
      id: "ev-lagos-meetup",
      name: "Lagos creators meetup",
      startsAt: inDays(-2, 18),
      location: "Yaba, Lagos",
      bannerUrl: null,
      status: "published",
      cancelledAt: null,
    },
  },
  {
    // The event was called off. Money is back; the ticket is void. Showing this
    // as a scannable QR would send somebody to a door that is not open.
    id: "tk-4",
    code: mockCode(4),
    status: "void",
    checkedInAt: null,
    ticketType: { name: "Regular", tier: "regular" },
    event: {
      id: "ev-brand-workshop",
      name: "Brand workshop: your first ten posts",
      startsAt: inDays(9, 14),
      location: "Online",
      bannerUrl: null,
      status: "cancelled",
      cancelledAt: inDays(-1),
    },
  },
];

const REFERRALS: Record<string, EventReferral[]> = {
  "ev-creator-summit": [
    { code: "SUMMIT-IG", label: "Instagram bio", revenueNaira: 684000 },
    { code: "SUMMIT-PARTNER", label: "Partner newsletter", revenueNaira: 175000 },
  ],
};

const CANCELLED = new Set<string>(["ev-brand-workshop"]);

// SEAM: replace with GET /api/hub/events/:id/tickets
export async function getMockTicketTypes(eventId: string): Promise<EventTicketType[]> {
  await delay(260);
  return TICKET_TYPES[eventId] ?? [];
}

// SEAM: replace with PUT /api/hub/events/:id/tickets
export async function setMockTicketTypes(
  eventId: string,
  drafts: EventTicketTypeDraft[],
): Promise<EventTicketType[]> {
  await delay(380);
  const existing = TICKET_TYPES[eventId] ?? [];
  const next = drafts.map((d, i) => {
    // Carry the sold count across, matching the backend: a tier that has sold
    // keeps its sales, and the count is what makes it un-removable there.
    const prior = existing.find((e) => e.name === d.name);
    const sold = prior?.sold ?? 0;
    return {
      id: prior?.id ?? `tt-${eventId}-${i}-${Date.now()}`,
      tier: d.tier,
      name: d.name,
      priceNaira: d.priceNaira,
      quantity: d.quantity,
      sold,
      remaining: Math.max(0, d.quantity - sold),
      soldOut: sold >= d.quantity,
      salesStartAt: d.salesStartAt ?? null,
      salesEndAt: d.salesEndAt ?? null,
    };
  });
  TICKET_TYPES[eventId] = next;
  return next;
}

// SEAM: replace with POST /api/hub/events/:id/orders
export async function buyMockTickets(eventId: string, body: BuyTicketsBody): Promise<BuyTicketsResult> {
  await delay(420);
  const type = (TICKET_TYPES[eventId] ?? []).find((t) => t.id === body.ticketTypeId);
  if (!type) throw new Error("That ticket is no longer on sale.");
  if (type.remaining < body.quantity) throw new Error("This ticket is sold out.");
  const orderId = `ord-${Date.now()}`;
  PENDING.set(orderId, { eventId, typeId: type.id, quantity: body.quantity });

  // A free tier issues immediately and never opens a checkout, exactly as the
  // server does. Sending ₦0 to a payment provider is the bug this prevents.
  if (type.priceNaira === 0) {
    issue(orderId);
    return { free: true, orderId };
  }
  return {
    free: false,
    orderId,
    flutterwaveConfig: {
      txRef: `mock-event-${orderId}`,
      amount: type.priceNaira * body.quantity,
      currency: "NGN",
      publicKey: "FLWPUBK_TEST-mock0000000000000000000000-X",
    },
  };
}

const PENDING = new Map<string, { eventId: string; typeId: string; quantity: number }>();

function issue(orderId: string): EventTicket[] {
  const pending = PENDING.get(orderId);
  if (!pending) return [];
  const types = TICKET_TYPES[pending.eventId] ?? [];
  const type = types.find((t) => t.id === pending.typeId);
  if (!type) return [];
  type.sold += pending.quantity;
  type.remaining = Math.max(0, type.quantity - type.sold);
  type.soldOut = type.sold >= type.quantity;

  const made: EventTicket[] = [];
  for (let i = 0; i < pending.quantity; i += 1) {
    ticketSeq += 1;
    const ticket: EventTicket = {
      id: `tk-${ticketSeq}`,
      code: mockCode(ticketSeq),
      status: "valid",
      checkedInAt: null,
      ticketType: { name: type.name, tier: type.tier },
      event: {
        id: pending.eventId,
        name: EVENT_NAMES[pending.eventId] ?? "Event",
        startsAt: inDays(5, 9),
        location: "Lagos",
        bannerUrl: null,
        status: "published",
        cancelledAt: null,
      },
    };
    TICKETS.unshift(ticket);
    made.push(ticket);
  }
  PENDING.delete(orderId);
  return made;
}

const EVENT_NAMES: Record<string, string> = {
  "ev-creator-summit": "WAWU Creator Summit 2026",
  "ev-lagos-meetup": "Lagos creators meetup",
  "ev-brand-workshop": "Brand workshop: your first ten posts",
};

// SEAM: replace with POST /api/hub/events/orders/:orderId/verify
export async function verifyMockOrder(orderId: string): Promise<EventTicket[]> {
  await delay(600);
  return issue(orderId);
}

// SEAM: replace with GET /api/hub/events/tickets/mine
export async function getMockTickets(): Promise<EventTicket[]> {
  await delay(300);
  return [...TICKETS];
}

// SEAM: replace with POST /api/hub/events/:id/check-in
export async function scanMockTicket(eventId: string, code: string): Promise<ScanResult> {
  await delay(280);
  const normalised = code.trim().toUpperCase();
  const ticket = TICKETS.find((t) => t.code === normalised && t.event.id === eventId);
  const totals = totalsFor(eventId);
  if (!ticket || ticket.status === "void") return { outcome: "invalid", totals };
  if (ticket.status === "checked_in") {
    return {
      outcome: "already_used",
      ticket: {
        code: ticket.code,
        tierName: ticket.ticketType.name,
        buyerWawuId: "wawu-buyer",
        checkedInAt: ticket.checkedInAt,
      },
      totals,
    };
  }
  ticket.status = "checked_in";
  ticket.checkedInAt = new Date().toISOString();
  return {
    outcome: "valid",
    ticket: {
      code: ticket.code,
      tierName: ticket.ticketType.name,
      buyerWawuId: "wawu-buyer",
      checkedInAt: ticket.checkedInAt,
    },
    totals: totalsFor(eventId),
  };
}

function totalsFor(eventId: string) {
  const types = TICKET_TYPES[eventId] ?? [];
  const sold = types.reduce((n, t) => n + t.sold, 0);
  const capacity = types.reduce((n, t) => n + t.quantity, 0);
  const checkedIn = TICKETS.filter((t) => t.event.id === eventId && t.status === "checked_in").length;
  return { sold, checkedIn, remaining: Math.max(0, capacity - sold) };
}

// SEAM: replace with GET /api/hub/events/:id/dashboard
export async function getMockDashboard(eventId: string): Promise<EventTicketDashboard> {
  await delay(340);
  const types = TICKET_TYPES[eventId] ?? [];
  const totals = totalsFor(eventId);
  const gross = types.reduce((n, t) => n + t.sold * t.priceNaira, 0);
  return {
    eventId,
    eventName: EVENT_NAMES[eventId] ?? "Event",
    ticketsSold: totals.sold,
    checkedIn: totals.checkedIn,
    remaining: totals.remaining,
    attendees: totals.sold,
    grossNaira: gross,
    netNaira: Math.round(gross * (1 - STANDARD_COMMISSION_RATE)),
    referrals: REFERRALS[eventId] ?? [],
  };
}

// SEAM: replace with POST /api/hub/events/:id/referrals
export async function createMockReferral(eventId: string, label: string): Promise<EventReferral> {
  await delay(320);
  const made: EventReferral = {
    code: `REF-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    label,
    revenueNaira: 0,
  };
  REFERRALS[eventId] = [...(REFERRALS[eventId] ?? []), made];
  return made;
}

// SEAM: replace with POST /api/hub/events/:id/cancel
export async function cancelMockEvent(eventId: string, _reason: string): Promise<CancelEventResult> {
  await delay(900);
  CANCELLED.add(eventId);
  let refunded = 0;
  for (const t of TICKETS) {
    if (t.event.id !== eventId) continue;
    t.status = "void";
    t.event.cancelledAt = new Date().toISOString();
    t.event.status = "cancelled";
    refunded += 1;
  }
  return { cancelled: true, ordersRefunded: refunded, refundsNeedingAttention: 0 };
}

/** Dev-only: whether this fixture event has been called off. */
export function isMockCancelled(eventId: string): boolean {
  return CANCELLED.has(eventId);
}
