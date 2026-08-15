"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { MentorRequestSheet } from "./MentorRequestSheet";

interface BookableMentor {
  id: string;
  name: string;
  topics: string[];
  openForRequests: boolean;
  fullUntil?: string;
}

export function MentorBookButton({ mentor }: { mentor: BookableMentor }) {
  const [open, setOpen] = useState(false);

  if (!mentor.openForRequests) {
    return (
      <Button full size="lg" variant="secondary" disabled>
        {mentor.fullUntil ? `Full until ${mentor.fullUntil}` : "Not taking requests right now"}
      </Button>
    );
  }

  return (
    <>
      <Button full size="lg" onClick={() => setOpen(true)}>
        Request a session
      </Button>
      <MentorRequestSheet open={open} onClose={() => setOpen(false)} mentor={mentor} />
    </>
  );
}
