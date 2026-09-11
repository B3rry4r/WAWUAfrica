/**
 * Events — the user-submitted, admin-moderated calendar.
 *
 * Reinstated 22 Aug 2026 by product-owner decision (CLAUDE.md § Non-negotiable
 * product rules).
 *
 * ── TICKETS EXIST NOW, AND THEY ARE NOT IN THIS FILE ─────────────────────────
 * This file said "event TICKETS stay cut" and that there must never be a price
 * near an event. That was true when it was written and stopped being true on
 * 29 Aug 2026, when the product owner asked for ticketing: WAWU takes its
 * standard cut, an organiser who cancels refunds every buyer, and any
 * subscriber may sell. See ./event-tickets.ts.
 *
 * The separation is deliberate rather than historical. An event still stands
 * on its own with nothing on sale, which is the common case — a meetup with a
 * date and a venue. `goingCount` is still an interest signal and NEVER a count
 * of sales; the two are different numbers and a screen that conflates them
 * tells an organiser they sold forty tickets when forty people clicked Going.
 * So no price, amount, order or ticket field belongs on `WawuEvent`: money
 * lives on the ticket types hanging off the event, where it can be absent.
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
export type EventStatus = "pending" | "published" | "rejected" | "removed" | "cancelled";

/**
 * Mirrors the Prisma `EventCategory` enum. A closed set rather than free text
 * so a browse-by-category filter cannot be defeated by a typo.
 */
export type EventCategory =
  | "music"
  | "business"
  | "training"
  | "conference"
  | "church"
  | "entertainment"
  | "fashion"
  | "community"
  | "lifestyle"
  | "other";

export const EVENT_CATEGORY_LABEL: Record<EventCategory, string> = {
  music: "Music",
  business: "Business",
  training: "Training",
  conference: "Conference",
  church: "Church",
  entertainment: "Entertainment",
  fashion: "Fashion",
  community: "Community",
  lifestyle: "Lifestyle",
  other: "Other",
};

export const EVENT_CATEGORIES = Object.keys(EVENT_CATEGORY_LABEL) as EventCategory[];

/** One speaker. `initials` is derived server-side from `name`, never stored. */
export interface EventSpeaker {
  name: string;
  title: string | null;
  /** Object-storage URL. Null renders as the initials chip instead. */
  photoUrl: string | null;
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

  /** Header image. Optional — an event with no banner still renders. */
  bannerUrl: string | null;
  /** What kind of thing it is, for discovery. Defaults to `other` server-side. */
  category: EventCategory;
  /** How to reach the organiser. Shown on the public page when given. */
  contactEmail: string | null;
  contactPhone: string | null;

  featured: boolean;
  status: EventStatus;

  /**
   * Set when the organiser calls the event off. Non-null means every ticket
   * is void and every buyer has been refunded — so any screen showing tickets
   * has to check this BEFORE showing a QR somebody would queue with.
   */
  cancelledAt: string | null;
  cancelReason: string | null;

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
  /** Object-storage URL from POST /uploads/presign (folder "event/speaker"). */
  photoUrl?: string;
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
  bannerUrl?: string;
  category?: EventCategory;
  contactEmail?: string;
  contactPhone?: string;
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
  category?: EventCategory;
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

/**
 * Timezone choices offered on the event form, as a dropdown rather than free
 * text ("WAT" typed by hand let in "wat", "West Africa Time", "GMT+1", every
 * one a different string next to the same time). Display only: `timezone` is
 * never used for date math, the actual instant is `startsAt`'s own ISO
 * string, computed from the browser's local clock when the host picks it,
 * and the server never guesses a zone. Nigeria first, since that is who this
 * app serves, then the rest of Africa, then the zones an overseas host is
 * most likely posting from.
 */
export const EVENT_TIMEZONES: { value: string; label: string }[] = [
  { value: "WAT", label: "WAT (West Africa, UTC+1)" },
  { value: "GMT", label: "GMT (Greenwich, UTC+0)" },
  { value: "CAT", label: "CAT (Central Africa, UTC+2)" },
  { value: "EAT", label: "EAT (East Africa, UTC+3)" },
  { value: "SAST", label: "SAST (South Africa, UTC+2)" },
  { value: "CET", label: "CET (Central Europe, UTC+1)" },
  { value: "BST", label: "BST (British Summer, UTC+1)" },
  { value: "EST", label: "EST (US Eastern, UTC-5)" },
  { value: "CST", label: "CST (US Central, UTC-6)" },
  { value: "PST", label: "PST (US Pacific, UTC-8)" },
  { value: "IST", label: "IST (India, UTC+5:30)" },
];
