"use client";

import { useParams } from "next/navigation";
import { EventOrganiserDashboard } from "@/components/events/EventOrganiserDashboard";

/** /events/[id]/manage — sold, revenue, check-ins, shared links, cancel. */
export default function EventManagePage() {
  const params = useParams<{ id: string }>();
  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[1000px] xl:p-[30px_28px_64px]">
      <EventOrganiserDashboard eventId={params.id} />
    </div>
  );
}
