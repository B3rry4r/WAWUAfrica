import { MyEventsList } from "@/components/events/MyEventsList";

/**
 * /events/mine — the host's own submissions at every status, with the
 * reviewer's reason attached when there is one.
 *
 * Declared as a static segment so it can never be swallowed by /events/[id].
 */
export default function MyEventsPage() {
  return <MyEventsList />;
}
