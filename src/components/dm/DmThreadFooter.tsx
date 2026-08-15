"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DmStatus } from "@/types/dm";
import { DmPaySheet } from "./DmPaySheet";
import { Button, Icon } from "@/components/ui";

export function DmThreadFooter({
  creator,
  status,
}: {
  creator: { wawuId: string; name: string; handle: string; dmPrice: number };
  status: DmStatus;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <footer className="sticky bottom-0 border-t border-[var(--border-hairline)] bg-[var(--surface-elevated)] p-[10px_16px_calc(10px+env(safe-area-inset-bottom))]">
      {status === "awaiting_response" ? (
        <div className="flex h-[46px] items-center gap-[9px] rounded-[var(--radius-chip)] border border-[var(--border-hairline)] bg-[var(--surface-tag)] px-[14px] text-[13.5px] text-[var(--text-muted)]">
          <Icon name="Clock" size={16} color="var(--text-muted)" />
          Waiting for {creator.name.split(" ")[0]} to reply…
        </div>
      ) : status === "refunded" ? (
        <div className="flex h-[46px] items-center gap-[9px] rounded-[var(--radius-chip)] border border-[var(--border-hairline)] bg-[var(--surface-tag)] px-[14px] text-[13.5px] text-[var(--text-muted)]">
          <Icon name="Lock" size={15} color="var(--text-muted)" />
          This conversation is closed.
        </div>
      ) : (
        <Button full onClick={() => setOpen(true)}>
          Send another message · ₦{creator.dmPrice.toLocaleString("en-NG")}
        </Button>
      )}
      <DmPaySheet
        open={open}
        onClose={() => setOpen(false)}
        creator={creator}
      />
    </footer>
  );
}
