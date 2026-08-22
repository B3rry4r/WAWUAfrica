import Link from "next/link";
import { EventForm } from "@/components/events/EventForm";
import { Icon } from "@/components/ui";

/**
 * /events/new — submit an event.
 *
 * Open to every signed-in account. There is deliberately no `creatorGates()`
 * check on this route: an event costs no upload slot and earns nobody
 * anything, so there is no gate for a paid subscription to be. The moderation
 * queue is the gate, and the form says so before the button.
 */
export default function NewEventPage() {
  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[760px] xl:p-[30px_28px_64px]">
      <Link
        href="/events"
        className="inline-flex w-fit items-center gap-[8px] text-[13.5px] font-semibold text-[var(--text-secondary)] no-underline hover:text-text-primary"
      >
        <Icon name="ArrowLeft" size={17} color="currentColor" />
        Events
      </Link>

      <div className="flex flex-col gap-[4px]">
        <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-[var(--text-primary)] xl:text-[26px]">
          Submit an event
        </h1>
        <p className="m-0 max-w-[62ch] text-[13.5px] leading-[1.55] text-[var(--text-secondary)]">
          Anyone with a WAWU account can put an event on the calendar. Fill this in and an admin will read it before
          it goes live.
        </p>
      </div>

      <EventForm mode="create" />
    </div>
  );
}
