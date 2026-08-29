"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getEvent } from "@/lib/api/events";
import { TicketTypeEditor } from "@/components/events/TicketTypeEditor";
import type { WawuEvent } from "@/types/events";

/**
 * /events/[id]/tickets — the organiser sets what is on sale.
 *
 * Ownership is enforced by the backend, which 403s a PUT from anyone who is
 * not the host. This screen does not re-check it: a second, client-side gate
 * that disagrees with the server is how a screen ends up hiding a control from
 * somebody who is allowed to use it.
 */
export default function EventTicketSetupPage() {
  const params = useParams<{ id: string }>();
  const [event, setEvent] = useState<WawuEvent | null>(null);

  useEffect(() => {
    let active = true;
    getEvent(params.id)
      .then((e) => active && setEvent(e))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [params.id]);

  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[860px] xl:p-[30px_28px_64px]">
      <TicketTypeEditor eventId={params.id} eventName={event?.name ?? "Back to the event"} />
    </div>
  );
}
