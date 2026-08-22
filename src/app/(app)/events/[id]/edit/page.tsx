"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getEvent } from "@/lib/api/events";
import { useSession } from "@/lib/auth/session-provider";
import type { WawuEvent } from "@/types/events";
import { EventForm } from "@/components/events/EventForm";
import { EmptyState, ErrorState, Icon, Skeleton } from "@/components/ui";

/**
 * /events/:id/edit — edit an event you submitted.
 *
 * The check below is a courtesy, not the enforcement: the backend refuses a
 * PATCH from anyone who is not the host, and a non-published event is a 404 to
 * everyone but its host in the first place. This exists so somebody who lands
 * here on someone else's event reads a sentence instead of a failed save.
 */
export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const { user, hydrated } = useSession();
  const wawuId = user?.wawuId ?? "";

  const [event, setEvent] = useState<WawuEvent | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!hydrated) return;
    let active = true;
    setEvent(null);
    setMissing(false);
    setError(null);
    getEvent(params.id, wawuId)
      .then((found) => {
        if (!active) return;
        if (!found) setMissing(true);
        else setEvent(found);
      })
      .catch((e) => {
        if (active) setError(e);
      });
    return () => {
      active = false;
    };
  }, [params.id, wawuId, hydrated, reloadKey]);

  const notMine = event !== null && Boolean(wawuId) && event.hostWawuId !== wawuId;

  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[760px] xl:p-[30px_28px_64px]">
      <Link
        href={`/events/${params.id}`}
        className="inline-flex w-fit items-center gap-[8px] text-[13.5px] font-semibold text-[var(--text-secondary)] no-underline hover:text-text-primary"
      >
        <Icon name="ArrowLeft" size={17} color="currentColor" />
        Back to the event
      </Link>

      {error ? (
        <ErrorState error={error} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : missing ? (
        <EmptyState
          icon="CalendarX"
          title="We couldn't find that event"
          caption="It may have been taken down."
          action="Back to Events"
          actionHref="/events"
        />
      ) : notMine ? (
        <EmptyState
          icon="Lock"
          title="This isn't your event to edit"
          caption="Only the account that submitted an event can change it."
          action="Back to Events"
          actionHref="/events"
        />
      ) : !event ? (
        <div className="flex flex-col gap-[12px]">
          <Skeleton className="h-[52px] rounded-input" />
          <Skeleton className="h-[124px] rounded-input" />
          <Skeleton className="h-[52px] rounded-input" />
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-[4px]">
            <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-[var(--text-primary)] xl:text-[26px]">
              Edit your event
            </h1>
            <p className="m-0 max-w-[62ch] text-[13.5px] leading-[1.55] text-[var(--text-secondary)]">
              Saving sends this back for review. Every edit does — there is no small change that skips it.
            </p>
          </div>
          <EventForm mode="edit" event={event} />
        </>
      )}
    </div>
  );
}
