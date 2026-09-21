import type {
  EventDraft,
  EventEdit,
  EventGoing,
  EventPage,
  ListEventsParams,
  WawuEvent,
} from "@/types/events";
import { ApiError, apiFetch, apiFetchPaginated, isMockModeError } from "./client";
import {
  createMockEvent,
  getMockEvent,
  getMockEvents,
  getMockMyEvents,
  setMockGoing,
  updateMockEvent,
} from "./mocks/events";

/**
 * Events — `/api/hub/events/*`.
 *
 * The backend for this is DONE (WAWU-Hub-API `src/event/`), so every shape
 * here is read off the real contract rather than a target guess: `EventView`
 * and `EventGoingView` in `event-view.type.ts`, and the create/update/list
 * DTOs beside them. The list endpoints return the canonical paginated envelope
 * ({statusCode, message, data: [], pagination}), which is why they go through
 * `apiFetchPaginated`; the single-event and going endpoints return the plain
 * envelope and go through `apiFetch`.
 *
 * ── TICKETING IS A SEPARATE MODULE, ON PURPOSE ───────────────────────────────
 * Tickets exist (29 Aug 2026) and live in ./event-tickets.ts. Nothing below
 * sends or reads a price, and nothing should: an event stands on its own with
 * nothing on sale, which is still the common case. `goingCount` here is an
 * interest signal — people, not sales — and the two numbers must not be
 * merged. The backend keeps the same split, with ticketing on its own
 * controller.
 *
 * ── FAILURE DISCIPLINE ───────────────────────────────────────────────────────
 * Mock fallback is gated on `isMockModeError` in every function. A real
 * refusal (400/403/404, a rejected submission) is rethrown so the screen can
 * say what actually happened — swallowing it into fixture data would turn a
 * rejected submission into a fake success, which is the incident auth.ts
 * documents.
 */

function listQuery(params: ListEventsParams): string {
  const query = new URLSearchParams();
  query.set("view", params.view ?? "upcoming");
  if (params.format) query.set("format", params.format);
  if (params.type) query.set("type", params.type);
  if (params.category) query.set("category", params.category);
  if (params.featured !== undefined) query.set("featured", String(params.featured));
  if (params.host) query.set("host", params.host);
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.perPage !== undefined) query.set("perPage", String(params.perPage));
  return query.toString();
}

/**
 * The public calendar. Published events only, whoever is asking — the backend
 * filters on `status: 'published'` and there is no client-side equivalent.
 */
// SEAM: replace with GET /api/hub/events
export async function listEvents(params: ListEventsParams = {}): Promise<EventPage> {
  try {
    const { data, pagination } = await apiFetchPaginated<WawuEvent>(`/api/hub/events?${listQuery(params)}`, {
      authed: true,
    });
    return {
      events: data,
      total: pagination.total,
      currentPage: pagination.currentPage,
      nextPage: pagination.nextPage,
    };
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return getMockEvents(params);
  }
}

/**
 * The one admin-pinned event for the top of the calendar.
 *
 * `?featured=true&perPage=1` and not a second endpoint: the backend renders
 * exactly one canonical list envelope, and a bespoke `featured` sibling on it
 * would be a second one (its ListEventsQueryDto says so explicitly).
 */
// SEAM: replace with GET /api/hub/events?featured=true&perPage=1
export async function getFeaturedEvent(params: ListEventsParams = {}): Promise<WawuEvent | null> {
  const featured = await listEvents({ ...params, featured: true, page: 1, perPage: 1 });
  return featured.events[0] ?? null;
}

/**
 * The signed-in user's own submissions, at EVERY status, with the reason for
 * the last rejection or takedown attached.
 *
 * This endpoint is why `pending` is not a dead end from the submitter's side.
 * The server derives the host from the bearer token; `hostWawuId` is passed
 * only so the mock layer can filter the same way (see getHostedCommunities in
 * communities.ts for the same arrangement).
 */
// SEAM: replace with GET /api/hub/events/mine
/**
 * One host's PUBLISHED events, for the Events tab on a profile.
 *
 * THE BUG THIS REPLACES. The profile called `listMyEvents(hostWawuId)`, which
 * hits GET /events/mine - the CALLER's events. The `hostWawuId` argument was
 * only ever used by the mock, so against a real backend a visitor opening
 * somebody's profile saw THEIR OWN events listed under that person's name.
 *
 * /events/mine cannot serve this even filtered: it deliberately returns every
 * status, including pending and rejected submissions, which belong to the
 * host alone. This reads the PUBLIC list with `?host=`, so it inherits
 * `status: published` and shows exactly what the calendar shows.
 */
export async function listEventsByHost(
  hostWawuId: string,
  params: ListEventsParams = {},
): Promise<EventPage> {
  if (!hostWawuId) return { events: [], total: 0, currentPage: 1, nextPage: null };
  return listEvents({ ...params, host: hostWawuId });
}

export async function listMyEvents(hostWawuId: string, params: ListEventsParams = {}): Promise<EventPage> {
  const query = new URLSearchParams();
  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.perPage !== undefined) query.set("perPage", String(params.perPage));
  const suffix = query.toString() ? `?${query}` : "";
  try {
    const { data, pagination } = await apiFetchPaginated<WawuEvent>(`/api/hub/events/mine${suffix}`, {
      authed: true,
    });
    return {
      events: data,
      total: pagination.total,
      currentPage: pagination.currentPage,
      nextPage: pagination.nextPage,
    };
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    if (!hostWawuId) return { events: [], total: 0, currentPage: 1, nextPage: null };
    return getMockMyEvents(hostWawuId, params);
  }
}

/**
 * One event. Published to anyone; anything else to its host alone.
 *
 * A 404 for a non-published event a stranger asks for is the backend's
 * deliberate choice over a 403 — a 403 would confirm the id exists and turn
 * this into an oracle for what is sitting in the moderation queue. Returning
 * null here (rather than throwing) keeps "no such event" a renderable state;
 * every other refusal is rethrown.
 */
// SEAM: replace with GET /api/hub/events/:id
export async function getEvent(id: string, viewerWawuId = ""): Promise<WawuEvent | null> {
  try {
    return await apiFetch<WawuEvent>(`/api/hub/events/${id}`, { authed: true });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    if (!isMockModeError(e)) throw e;
    return getMockEvent(id, viewerWawuId);
  }
}

/**
 * Submit an event. It always lands `pending` — an admin decides whether anyone
 * else ever sees it, and nothing in this module can publish one.
 *
 * Open to any signed-in account, with no creator gate: an event costs no
 * upload slot and earns nobody anything, so there is no gate for a paid
 * subscription to be. The moderation queue is the gate. Do not wrap this in
 * `creatorGates()`.
 */
// SEAM: replace with POST /api/hub/events
export async function createEvent(hostWawuId: string, draft: EventDraft): Promise<WawuEvent> {
  try {
    return await apiFetch<WawuEvent>("/api/hub/events", { method: "POST", authed: true, body: draft });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    return createMockEvent(hostWawuId, draft);
  }
}

/**
 * Edit your own event. Every edit sends it back to `pending`, with no
 * carve-out for "small" changes — a carve-out is a bypass: submit something
 * benign, get approved, then edit it into whatever you actually wanted.
 */
// SEAM: replace with PATCH /api/hub/events/:id
export async function updateEvent(id: string, edit: EventEdit): Promise<WawuEvent> {
  try {
    return await apiFetch<WawuEvent>(`/api/hub/events/${id}`, { method: "PATCH", authed: true, body: edit });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    const updated = await updateMockEvent(id, edit);
    if (!updated) throw new ApiError("We couldn't find that event.", 404);
    return updated;
  }
}

/**
 * "I'm going" — an interest signal and nothing else. Idempotent in both
 * directions, and the response carries the whole state so a client never has
 * to guess at the count it should now show.
 */
// SEAM: replace with POST / DELETE /api/hub/events/:id/going
export async function setGoing(id: string, going: boolean): Promise<EventGoing> {
  try {
    return await apiFetch<EventGoing>(`/api/hub/events/${id}/going`, {
      method: going ? "POST" : "DELETE",
      authed: true,
    });
  } catch (e) {
    if (!isMockModeError(e)) throw e;
    const result = await setMockGoing(id, going);
    if (!result) throw new ApiError("We couldn't find that event.", 404);
    return result;
  }
}
