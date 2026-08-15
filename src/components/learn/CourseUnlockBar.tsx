"use client";

import { useState } from "react";
import { UnlockCourseSheet } from "./UnlockCourseSheet";
import { Button } from "@/components/ui/Button";
import { formatNaira } from "@/lib/format";

/** Sticky bottom bar: free → "Start learning", paid → unlocks via sheet. */
export function CourseUnlockBar({ title, price }: { title: string; price: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="sticky bottom-0 border-t border-[var(--border-hairline)] bg-[var(--surface-elevated)] p-[12px_16px_calc(12px_+_env(safe-area-inset-bottom))]">
      {price === 0 ? (
        <Button full size="lg">
          Start learning · Free
        </Button>
      ) : (
        <>
          <Button full size="lg" onClick={() => setOpen(true)}>
            Unlock course · {formatNaira(price)}
          </Button>
          <UnlockCourseSheet open={open} onClose={() => setOpen(false)} title={title} price={price} />
        </>
      )}
    </div>
  );
}
