import Link from "next/link";
import { EventForm } from "@/components/events/EventForm";
import { HostEventGate } from "@/components/events/HostEventGate";
import { Icon } from "@/components/ui";

/**
 * /events/new — submit an event.
 *
 * VERIFIED ACCOUNTS ONLY (build brief B3). This used to be open to every
 * signed-in account, on the reasoning that an event earned nobody anything.
 * Events sell tickets now, so hosting one is a paid-seller capability and the
 * brief makes it verified-only.
 *
 * The gate is NOT a hidden button. Every "Submit an event" link in the app
 * still points here; HostEventGate is what an ineligible visitor meets, and
 * it explains which tick they need and what it costs instead of refusing
 * them. The server enforces the rule for real; if it refuses a POST anyway,
 * EventForm renders the server's own reason rather than inventing one.
 *
 * There is still deliberately no `creatorGates()` check here: KYC is the
 * earning gate and has nothing to do with hosting.
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
          Verified creators and professionals can put an event on the calendar. Fill this in and an admin will read
          it before it goes live.
        </p>
      </div>

      <HostEventGate>
        <EventForm mode="create" />
      </HostEventGate>
    </div>
  );
}
