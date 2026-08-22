import { EventsBrowser } from "@/components/events/EventsBrowser";

/**
 * /events — the public calendar.
 *
 * Events is NOT a bottom-nav slot. The bar is locked at five for every account
 * type (CLAUDE.md § Navigation) and the Create FAB is creator-only, which an
 * event is not. The way in is Explore, which is a slot on both shells, plus
 * the "My submissions" link this screen carries for hosts.
 */
export default function EventsPage() {
  return <EventsBrowser />;
}
