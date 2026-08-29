"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getEvent } from "@/lib/api/events";
import { TicketScanner } from "@/components/events/TicketScanner";

/**
 * /events/[id]/scan — the door.
 *
 * Narrow on desktop on purpose. This is used one-handed on a phone at an
 * entrance, and a scanner laid out across a 1200px column would put the
 * outcome and the keypad at opposite ends of the screen.
 */
export default function EventScanPage() {
  const params = useParams<{ id: string }>();
  const [name, setName] = useState("Back to sales");

  useEffect(() => {
    let active = true;
    getEvent(params.id)
      .then((e) => active && e && setName(e.name))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [params.id]);

  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[560px] xl:p-[30px_28px_64px]">
      <TicketScanner eventId={params.id} eventName={name} />
    </div>
  );
}
