"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DmStatus } from "@/types/dm";
import { DmPaySheet } from "./DmPaySheet";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

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
    <footer
      style={{
        position: "sticky",
        bottom: 0,
        padding: "10px 16px calc(10px + env(safe-area-inset-bottom))",
        background: "var(--surface-elevated)",
        borderTop: "1px solid var(--border-hairline)",
      }}
    >
      {status === "awaiting_response" ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            height: 46,
            padding: "0 14px",
            borderRadius: "var(--radius-chip)",
            background: "var(--surface-tag)",
            border: "1px solid var(--border-hairline)",
            color: "var(--text-muted)",
            fontSize: 13.5,
          }}
        >
          <Icon name="Clock" size={16} color="var(--text-muted)" stroke={2} />
          Waiting for {creator.name.split(" ")[0]} to reply…
        </div>
      ) : status === "refunded" ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            height: 46,
            padding: "0 14px",
            borderRadius: "var(--radius-chip)",
            background: "var(--surface-tag)",
            border: "1px solid var(--border-hairline)",
            color: "var(--text-muted)",
            fontSize: 13.5,
          }}
        >
          <Icon name="Lock" size={15} color="var(--text-muted)" stroke={2} />
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