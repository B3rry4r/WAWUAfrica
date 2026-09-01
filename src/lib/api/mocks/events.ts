import type {
  EventDraft,
  EventEdit,
  EventGoing,
  EventPage,
  ListEventsParams,
  WawuEvent,
} from "@/types/events";
import { delay } from "../client";

/**
 * Mock calendar for the frontend-only build.
 *
 * NO MONEY LIVES HERE, and none may be added: there is no price, amount,
 * currency, ticket or credit field on any fixture below, matching the backend
 * contract (WAWU-Hub-API `src/event/event-view.type.ts`). `goingCount` is a
 * count of interested people. An organiser who charges for entry does it on
 * their own page behind `externalUrl`.
 *
 * Dates are computed relative to load time rather than hardcoded, so the
 * upcoming/past split is never empty on one side and stale on the other.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function inDays(days: number, hour = 10): string {
  const d = new Date(Date.now() + days * DAY_MS);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  const first = words[0][0] ?? "";
  const last = words.length > 1 ? (words[words.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

function speakers(entries: Array<[string, string]>) {
  return entries.map(([name, title], i) => ({ name, title, initials: initials(name), order: i }));
}

/**
 * DEV ONLY. These two ids are treated as belonging to whoever is signed in, so
 * the `pending` and `rejected` host states — and the rejection reason a host
 * has to be able to read — are reachable without a backend. Remove with the
 * rest of the mock layer.
 */
const SEEDED_AS_MINE = new Set(["ev-pending-lagos", "ev-rejected-abuja"]);

const MOCK_EVENTS: WawuEvent[] = [
  {
    id: "ev-creator-summit",
    hostWawuId: "wawu-adaeze",
    name: "WAWU Creator Summit 2026",
    description:
      "A full day on what actually earns: pricing your work, writing a listing someone finishes reading, and keeping a catalogue alive after the launch week. Two tracks, one for people who have not published yet and one for people whose first ten pieces sold.",
    hostOrg: "WAWUAfrica",
    hostOrgBio:
      "The team behind WAWU. We run one summit a year and spend the rest of it talking to creators about what is not working.",
    format: "in_person",
    type: "summit",
    startsAt: inDays(5, 9),
    endsAt: inDays(5, 17),
    timeLabel: "9:00 AM",
    timezone: "WAT",
    location: "Landmark Centre, Lagos",
    address: "Water Corporation Road, Victoria Island, Lagos",
    externalUrl: "https://wawuafrica.com/summit",
    hasRecap: false,
    recapUrl: null,
    recapText: null,
    bannerUrl: null,
    category: "business",
    contactEmail: null,
    contactPhone: null,
    featured: true,
    status: "published",
    cancelledAt: null,
    cancelReason: null,
    goingCount: 214,
    userGoing: false,
    speakers: speakers([
      ["Adaeze Okonkwo", "Founder, WAWUAfrica"],
      ["Funmi Adeyemi", "Chartered accountant"],
      ["Obinna Eze", "Produce exporter"],
    ]),
    createdAt: inDays(-30),
    lastDecisionReason: null,
  },
  {
    id: "ev-pricing-workshop",
    hostWawuId: "wawu-funmi",
    name: "Pricing your work without guessing",
    description:
      "Three hours on the numbers behind a price: what your time costs, what the market will carry, and how to raise a price on people who already bought from you. Bring your last three invoices.",
    hostOrg: "Adeyemi & Co",
    hostOrgBio: "Small-business books and tax, eleven years of it.",
    format: "online",
    type: "workshop",
    startsAt: inDays(3, 18),
    endsAt: inDays(3, 21),
    timeLabel: "6:00 PM",
    timezone: "WAT",
    location: "Online (Zoom)",
    address: null,
    externalUrl: "https://adeyemi.example.com/pricing-workshop",
    hasRecap: false,
    recapUrl: null,
    recapText: null,
    bannerUrl: null,
    category: "training",
    contactEmail: null,
    contactPhone: null,
    featured: false,
    status: "published",
    cancelledAt: null,
    cancelReason: null,
    goingCount: 87,
    userGoing: true,
    speakers: speakers([["Funmi Adeyemi", "Chartered accountant"]]),
    createdAt: inDays(-14),
    lastDecisionReason: null,
  },
  {
    id: "ev-export-clinic",
    hostWawuId: "wawu-obinna",
    name: "Export paperwork clinic",
    description:
      "Bring one shipment you are stuck on. We go through the documents line by line. NEPC registration, certificate of origin, phytosanitary, and the buyer contract clauses that decide who eats a delay.",
    hostOrg: "Eze Export Partners",
    hostOrgBio: null,
    format: "in_person",
    type: "meetup",
    startsAt: inDays(11, 14),
    endsAt: null,
    timeLabel: "2:00 PM",
    timezone: "WAT",
    location: "Ikeja, Lagos",
    address: "18 Oba Akran Avenue, Ikeja, Lagos",
    externalUrl: null,
    hasRecap: false,
    recapUrl: null,
    recapText: null,
    bannerUrl: null,
    category: "other",
    contactEmail: null,
    contactPhone: null,
    featured: false,
    status: "published",
    cancelledAt: null,
    cancelReason: null,
    goingCount: 31,
    userGoing: false,
    speakers: speakers([["Obinna Eze", "Produce exporter"]]),
    createdAt: inDays(-9),
    lastDecisionReason: null,
  },
  {
    id: "ev-poultry-webinar",
    hostWawuId: "wawu-hauwa",
    name: "Feed costs and cold chain on bad roads",
    description:
      "What a poultry operation actually spends, where the money leaks, and how to keep a cold chain intact between Kano and a buyer four hours away.",
    hostOrg: "Sule Farms",
    hostOrgBio: "Poultry at scale, fourteen years.",
    format: "online",
    type: "webinar",
    startsAt: inDays(19, 16),
    endsAt: inDays(19, 17),
    timeLabel: "4:00 PM",
    timezone: "WAT",
    location: "Online",
    address: null,
    externalUrl: "https://sulefarms.example.com/webinar",
    hasRecap: false,
    recapUrl: null,
    recapText: null,
    bannerUrl: null,
    category: "other",
    contactEmail: null,
    contactPhone: null,
    featured: false,
    status: "published",
    cancelledAt: null,
    cancelReason: null,
    goingCount: 58,
    userGoing: false,
    speakers: speakers([["Hauwa Sule", "Poultry farmer"]]),
    createdAt: inDays(-6),
    lastDecisionReason: null,
  },
  {
    id: "ev-textile-competition",
    hostWawuId: "wawu-zainab",
    name: "Adire and aso-oke design competition",
    description:
      "Submit one finished piece and one process sketch. Judged on craft and on whether the piece could be made twice. Entry is at no charge and submissions close the week before.",
    hostOrg: "Kaduna Textile Collective",
    hostOrgBio: "A collective of forty weavers and dyers across Kaduna and Zaria.",
    format: "in_person",
    type: "competition",
    startsAt: inDays(34, 11),
    endsAt: inDays(35, 18),
    timeLabel: "11:00 AM",
    timezone: "WAT",
    location: "Kaduna",
    address: "Murtala Square, Kaduna",
    externalUrl: "https://ktc.example.com/competition",
    hasRecap: false,
    recapUrl: null,
    recapText: null,
    bannerUrl: null,
    category: "other",
    contactEmail: null,
    contactPhone: null,
    featured: false,
    status: "published",
    cancelledAt: null,
    cancelReason: null,
    goingCount: 12,
    userGoing: false,
    speakers: [],
    createdAt: inDays(-4),
    lastDecisionReason: null,
  },
  {
    id: "ev-past-catalogue",
    hostWawuId: "wawu-adaeze",
    name: "Building a catalogue that keeps selling",
    description:
      "A working session on what to publish after the first piece, and how to keep the earlier ones from going quiet.",
    hostOrg: "WAWUAfrica",
    hostOrgBio: null,
    format: "online",
    type: "workshop",
    startsAt: inDays(-12, 17),
    endsAt: inDays(-12, 19),
    timeLabel: "5:00 PM",
    timezone: "WAT",
    location: "Online",
    address: null,
    externalUrl: null,
    hasRecap: true,
    recapUrl: "https://wawuafrica.com/recaps/catalogue",
    recapText:
      "Ninety-one people came. The question that took up half the session: what to do with a piece that sold well for a month and then stopped. Short answer from the room. Re-list it against a different search term before you rewrite it.",
    bannerUrl: null,
    category: "other",
    contactEmail: null,
    contactPhone: null,
    featured: false,
    status: "published",
    cancelledAt: null,
    cancelReason: null,
    goingCount: 91,
    userGoing: false,
    speakers: speakers([["Adaeze Okonkwo", "Founder, WAWUAfrica"]]),
    createdAt: inDays(-40),
    lastDecisionReason: null,
  },
  {
    id: "ev-past-market",
    hostWawuId: "wawu-musa",
    name: "Northern makers market",
    description: "A one-day market for leatherwork, textiles and preserved foods.",
    hostOrg: "Musa Ibrahim",
    hostOrgBio: null,
    format: "in_person",
    type: "meetup",
    startsAt: inDays(-33, 10),
    endsAt: inDays(-33, 18),
    timeLabel: "10:00 AM",
    timezone: "WAT",
    location: "Kano",
    address: "Sabon Gari, Kano",
    externalUrl: null,
    hasRecap: false,
    recapUrl: null,
    recapText: null,
    bannerUrl: null,
    category: "other",
    contactEmail: null,
    contactPhone: null,
    featured: false,
    status: "published",
    cancelledAt: null,
    cancelReason: null,
    goingCount: 44,
    userGoing: false,
    speakers: [],
    createdAt: inDays(-60),
    lastDecisionReason: null,
  },
  {
    id: "ev-pending-lagos",
    hostWawuId: "wawu-me",
    name: "Lagos food creators meetup",
    description:
      "An evening for people selling cooked food, spice blends and preserves. Two short talks, then an hour of people swapping supplier names.",
    hostOrg: "Lagos Food Creators",
    hostOrgBio: null,
    format: "in_person",
    type: "meetup",
    startsAt: inDays(22, 17),
    endsAt: inDays(22, 20),
    timeLabel: "5:00 PM",
    timezone: "WAT",
    location: "Yaba, Lagos",
    address: "12 Herbert Macaulay Way, Yaba, Lagos",
    externalUrl: null,
    hasRecap: false,
    recapUrl: null,
    recapText: null,
    bannerUrl: null,
    category: "community",
    contactEmail: null,
    contactPhone: null,
    featured: false,
    status: "pending",
    cancelledAt: null,
    cancelReason: null,
    goingCount: 0,
    userGoing: false,
    speakers: [],
    createdAt: inDays(-2),
    lastDecisionReason: null,
  },
  {
    id: "ev-rejected-abuja",
    hostWawuId: "wawu-me",
    name: "Abuja creators mixer",
    description: "An evening mixer for creators in Abuja.",
    hostOrg: "Abuja Creators",
    hostOrgBio: null,
    format: "in_person",
    type: "meetup",
    startsAt: inDays(15, 18),
    endsAt: null,
    timeLabel: "6:00 PM",
    timezone: "WAT",
    location: "Abuja",
    address: null,
    externalUrl: null,
    hasRecap: false,
    recapUrl: null,
    recapText: null,
    bannerUrl: null,
    category: "community",
    contactEmail: null,
    contactPhone: null,
    featured: false,
    status: "rejected",
    cancelledAt: null,
    cancelReason: null,
    goingCount: 0,
    userGoing: false,
    speakers: [],
    createdAt: inDays(-8),
    lastDecisionReason:
      "The venue is only given as \"Abuja\". We need a street address or a named venue before this can go on the calendar. Add one and resubmit.",
  },
];

/** `endsAt ?? startsAt` decides the window — a two-day summit is still upcoming on its second morning. */
function isUpcoming(event: WawuEvent): boolean {
  return new Date(event.endsAt ?? event.startsAt).getTime() >= Date.now();
}

function page(events: WawuEvent[], params: ListEventsParams): EventPage {
  const currentPage = params.page ?? 1;
  const perPage = params.perPage ?? 20;
  const start = (currentPage - 1) * perPage;
  const slice = events.slice(start, start + perPage);
  return {
    events: slice,
    total: events.length,
    currentPage,
    nextPage: currentPage * perPage < events.length ? currentPage + 1 : null,
  };
}

// SEAM: replace with GET /api/hub/events
export async function getMockEvents(params: ListEventsParams): Promise<EventPage> {
  await delay(280);
  const view = params.view ?? "upcoming";
  const matched = MOCK_EVENTS.filter(
    (e) =>
      e.status === "published" &&
      (view === "past" ? !isUpcoming(e) : isUpcoming(e)) &&
      (params.format === undefined || e.format === params.format) &&
      (params.type === undefined || e.type === params.type) &&
      (params.category === undefined || e.category === params.category) &&
      (params.featured === undefined || e.featured === params.featured),
  ).sort((a, b) =>
    view === "past"
      ? new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime()
      : new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
  );
  return page(matched, params);
}

/**
 * The host's own submissions at every status, newest first.
 *
 * SEEDED_AS_MINE is why `pending` and `rejected` are reachable in a build with
 * no backend — see its comment.
 */
// SEAM: replace with GET /api/hub/events/mine
export async function getMockMyEvents(hostWawuId: string, params: ListEventsParams): Promise<EventPage> {
  await delay(280);
  const mine = MOCK_EVENTS.filter((e) => e.hostWawuId === hostWawuId || SEEDED_AS_MINE.has(e.id)).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return page(mine, params);
}

// SEAM: replace with GET /api/hub/events/:id
export async function getMockEvent(id: string, viewerWawuId: string): Promise<WawuEvent | null> {
  await delay(240);
  const event = MOCK_EVENTS.find((e) => e.id === id);
  if (!event) return null;
  // Mirrors the backend: a non-published event is a 404 to anyone but its host,
  // and the moderator's reason is host-only.
  const isHost = event.hostWawuId === viewerWawuId || SEEDED_AS_MINE.has(event.id);
  if (event.status !== "published" && !isHost) return null;
  return isHost ? event : { ...event, lastDecisionReason: null };
}

// SEAM: replace with POST /api/hub/events
export async function createMockEvent(hostWawuId: string, draft: EventDraft): Promise<WawuEvent> {
  await delay(420);
  const created: WawuEvent = {
    id: `ev-${Date.now()}`,
    hostWawuId,
    name: draft.name,
    description: draft.description,
    hostOrg: draft.hostOrg,
    hostOrgBio: draft.hostOrgBio ?? null,
    format: draft.format,
    type: draft.type,
    startsAt: draft.startsAt,
    endsAt: draft.endsAt ?? null,
    bannerUrl: draft.bannerUrl ?? null,
    category: draft.category ?? "other",
    contactEmail: draft.contactEmail ?? null,
    contactPhone: draft.contactPhone ?? null,
    cancelledAt: null,
    cancelReason: null,
    timeLabel: draft.timeLabel ?? null,
    timezone: draft.timezone ?? null,
    location: draft.location,
    address: draft.address ?? null,
    externalUrl: draft.externalUrl ?? null,
    hasRecap: false,
    recapUrl: null,
    recapText: null,
    featured: false,
    // Always pending. There is no path in the mock that publishes either.
    status: "pending",
    goingCount: 0,
    userGoing: false,
    speakers: (draft.speakers ?? []).map((s, i) => ({
      name: s.name,
      title: s.title ?? null,
      initials: initials(s.name),
      order: s.order ?? i,
    })),
    createdAt: new Date().toISOString(),
    lastDecisionReason: null,
  };
  MOCK_EVENTS.push(created);
  return created;
}

// SEAM: replace with PATCH /api/hub/events/:id
export async function updateMockEvent(id: string, edit: EventEdit): Promise<WawuEvent | null> {
  await delay(420);
  const index = MOCK_EVENTS.findIndex((e) => e.id === id);
  if (index === -1) return null;
  const current = MOCK_EVENTS[index];
  const next: WawuEvent = {
    ...current,
    ...(edit.name === undefined ? {} : { name: edit.name }),
    ...(edit.description === undefined ? {} : { description: edit.description }),
    ...(edit.hostOrg === undefined ? {} : { hostOrg: edit.hostOrg }),
    ...(edit.hostOrgBio === undefined ? {} : { hostOrgBio: edit.hostOrgBio }),
    ...(edit.format === undefined ? {} : { format: edit.format }),
    ...(edit.type === undefined ? {} : { type: edit.type }),
    ...(edit.startsAt === undefined ? {} : { startsAt: edit.startsAt }),
    ...(edit.endsAt === undefined ? {} : { endsAt: edit.endsAt }),
    ...(edit.timeLabel === undefined ? {} : { timeLabel: edit.timeLabel }),
    ...(edit.timezone === undefined ? {} : { timezone: edit.timezone }),
    ...(edit.location === undefined ? {} : { location: edit.location }),
    ...(edit.address === undefined ? {} : { address: edit.address }),
    ...(edit.externalUrl === undefined ? {} : { externalUrl: edit.externalUrl }),
    ...(edit.recapUrl === undefined ? {} : { recapUrl: edit.recapUrl, hasRecap: true }),
    ...(edit.recapText === undefined ? {} : { recapText: edit.recapText, hasRecap: true }),
    ...(edit.speakers === undefined
      ? {}
      : {
          speakers: edit.speakers.map((s, i) => ({
            name: s.name,
            title: s.title ?? null,
            initials: initials(s.name),
            order: s.order ?? i,
          })),
        }),
    // A host edit always re-enters review — one rule, no "material field"
    // carve-outs, because a carve-out is a bypass.
    status: "pending",
    lastDecisionReason: null,
  };
  MOCK_EVENTS[index] = next;
  return next;
}

/** Idempotent both ways, exactly like the real endpoints. */
// SEAM: replace with POST / DELETE /api/hub/events/:id/going
export async function setMockGoing(id: string, going: boolean): Promise<EventGoing | null> {
  await delay(240);
  const event = MOCK_EVENTS.find((e) => e.id === id);
  if (!event) return null;
  if (going && !event.userGoing) {
    event.userGoing = true;
    event.goingCount += 1;
  } else if (!going && event.userGoing) {
    event.userGoing = false;
    event.goingCount = Math.max(0, event.goingCount - 1);
  }
  return { eventId: event.id, userGoing: event.userGoing, goingCount: event.goingCount };
}
