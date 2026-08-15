"use client";

import { useState } from "react";
import { UnlockCourseSheet } from "./UnlockCourseSheet";
import { Button } from "@/components/ui/Button";

/** Sticky bottom bar: free → "Start learning", paid → unlocks via sheet. */
export function CourseUnlockBar({ title, price }: { title: string; price: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        padding: "12px 16px calc(12px + env(safe-area-inset-bottom))",
        background: "var(--surface-elevated)",
        borderTop: "1px solid var(--border-hairline)",
      }}
    >
      {price === 0 ? (
        <Button full size="lg">
          Start learning · Free
        </Button>
      ) : (
        <>
          <Button full size="lg" onClick={() => setOpen(true)}>
            Unlock course · ₦{price.toLocaleString("en-NG")}
          </Button>
          <UnlockCourseSheet open={open} onClose={() => setOpen(false)} title={title} price={price} />
        </>
      )}
    </div>
  );
}