"use client";

import { useParams } from "next/navigation";
import { EventDetailView } from "@/components/events/EventDetailView";

export default function EventDetailPage() {
  const params = useParams<{ id: string }>();
  return <EventDetailView id={params.id} />;
}
