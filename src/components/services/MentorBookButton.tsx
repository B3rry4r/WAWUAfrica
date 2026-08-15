"use client";

import { useState } from "react";
import { Button } from "@/components/ui";
import { MentorRequestSheet } from "./MentorRequestSheet";

export function MentorBookButton({ mentor }: { mentor: { id: string; name: string; rate: number } }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button full size="lg" onClick={() => setOpen(true)}>
        Request a session
      </Button>
      <MentorRequestSheet open={open} onClose={() => setOpen(false)} mentor={mentor} />
    </>
  );
}
