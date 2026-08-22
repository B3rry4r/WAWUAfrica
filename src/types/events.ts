/**
 * Events — the user-submitted, admin-moderated calendar.
 *
 * Reinstated 22 Aug 2026 by product-owner decision (CLAUDE.md § Non-negotiable
 * product rules). What the spec cut was event TICKETS, and that stays cut.
 *
 * ── WHAT IS DELIBERATELY ABSENT ──────────────────────────────────────────────
 * There is no price, amount, currency, ticket, order, purchase or credit field
 * on any shape in this file, and there must never be one. The backend's
 * `event-view.type.ts` draws exactly the same line, and its DTOs run under
 * `forbidNonWhitelisted`, so a body carrying `price` is a 400 before the
 * service is reached. `goingCount` is a count of interested people, never a
 * count of sales. An organiser who charges for entry does it on their own page
 * behind `externalUrl`. Anything that would put a naira figure on an event is a
 * conflict with docs/01_SPEC.md — stop and flag it rather than building it.
 *
 * Every shape below is declared against the real backend contract at
 * WAWU-Hub-API `src/event/` (event-view.type.ts + dto/), not hand-guessed.
 * `Date` fields cross the wire as ISO 8601 strings, so they are typed `string`.
 */

/** In-person or online. Mirrors the Prisma `EventFormat` enum. */
export type EventFormat = "in_person" | "online";

/** Mirrors the Prisma `EventType` enum. */
export type EventType = "workshop" | "summit" | "webinar" | "meetup" | "competition";

/**
 * Mirrors the Prisma `EventStatus` enum. Only `published` is ever visible on
 * the public calendar; a host sees their own at every status via /events/mine.
 */
export type EventStatus = "pending" | "published" | "rejected" | "removed";

/** One speaker. `initials` is derived server-side from `name`, never stored. */
export interface EventSpeaker {
  name: string;
  title: string | null;
  initials: string;
  order: number;
}

/** One event as any signed-in user sees it — the backend's `EventView`. */
export interface WawuEvent {
  id: string;
  hostWawuId: string;
  name: string;
  description: string;
  hostOrg: string;
  hostOrgBio: string | null;

  format: EventFormat;
  type: EventType;

  /** ISO 8601. The authoritative instant — the client formats it, the server never guesses a zone. */
  startsAt: string;
  endsAt: string | null;
  /** Host-supplied display strings, e.g. "10:00 AM" and "WAT". */
  timeLabel: string | null;
  timezone: string | null;

  location: string;
  address: string | null;
  /** The organiser's own page. Any registration happens THERE, not here. */
  externalUrl: string | null;

  hasRecap: boolean;
  recapUrl: string | null;
  recapText: string | null;

  featured: boolean;
  status: EventStatus;

  /** How many people signalled interest. Never a ticket count, never money. */
  goingCount: number;
  /** Whether the CALLING user is one of them. */
  userGoing: boolean;

  speakers: EventSpeaker[];
  createdAt: string;
  /**
   * Why the last rejection or takedown happened. The backend sends this to the
   * HOST ONLY and nulls it for everyone else — a moderator's note is written
   * for the person who has to act on it. A rejection nobody can read is a dead
   * end, which is why the host-side screens surface it verbatim.
   */
  lastDecisionReason: string | null;
}

/** What POST/DELETE /events/:id/going return — the whole signal state. */
export interface EventGoing {
  eventId: string;
  userGoing: boolean;
  goingCount: number;
}

/** One speaker as submitted. `initials` is NOT accepted — it is derived on the way out. */
export interface EventSpeakerDraft {
  name: string;
  title?: string;
  order?: number;
}

/** POST /events body. Always lands `pending`; there is no path here that publishes. */
export interface EventDraft {
  name: string;
  description: string;
  hostOrg: string;
  hostOrgBio?: string;
  format: EventFormat;
  type: EventType;
  /** ISO 8601. */
  startsAt: string;
  endsAt?: string;
  timeLabel?: string;
  timezone?: string;
  location: string;
  address?: string;
  externalUrl?: string;
  speakers?: EventSpeakerDraft[];
}

/**
 * PATCH /events/:id body. Every field optional.
 *
 * `featured` and `status` are absent on purpose and cannot be added: a host
 * pinning or publishing their own event is the whole moderation gate handed to
 * the submitter. Both belong to the admin surface alone.
 */
export interface EventEdit extends Partial<EventDraft> {
  /** The post-event write-up. Update-only — a recap exists after the event. */
  recapUrl?: string;
  recapText?: string;
}

/** `upcoming` reads forwards from now, `past` reads backwards. */
export type EventView = "upcoming" | "past";

export interface ListEventsParams {
  view?: EventView;
  format?: EventFormat;
  type?: EventType;
  featured?: boolean;
  page?: number;
  perPage?: number;
}

export interface EventPage {
  events: WawuEvent[];
  total: number;
  currentPage: number;
  nextPage: number | null;
}

/**
 * The filter chips, ported from the old app's `EVENT_FILTERS`
 * (WAWUAfrica-new src/lib/ev-data.ts) with the same labels and the same order.
 *
 * The old app sent ONE `filter` string whose value was either a format or a
 * type and had a `matchEv` helper to work out which. The backend splits them
 * into two query parameters, so each chip carries the parameter it actually
 * sets — same chip row on screen, no client-side guessing.
 */
export interface EventFilterChip {
  id: string;
  label: string;
  format?: EventFormat;
  type?: EventType;
}

export const EVENT_FILTERS: readonly EventFilterChip[] = [
  { id: "all", label: "All" },
  { id: "in_person", label: "In-Person", format: "in_person" },
  { id: "online", label: "Online", format: "online" },
  { id: "workshop", label: "Workshop", type: "workshop" },
  { id: "summit", label: "Summit", type: "summit" },
  { id: "webinar", label: "Webinar", type: "webinar" },
  { id: "meetup", label: "Meetup", type: "meetup" },
  { id: "competition", label: "Competition", type: "competition" },
];

export const EVENT_FORMAT_LABEL: Record<EventFormat, string> = {
  in_person: "In-Person",
  online: "Online",
};

export const EVENT_TYPE_LABEL: Record<EventType, string> = {
  workshop: "Workshop",
  summit: "Summit",
  webinar: "Webinar",
  meetup: "Meetup",
  competition: "Competition",
};

export const EVENT_FORMATS = Object.keys(EVENT_FORMAT_LABEL) as EventFormat[];
export const EVENT_TYPES = Object.keys(EVENT_TYPE_LABEL) as EventType[];
