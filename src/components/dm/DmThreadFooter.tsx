"use client";

import { useState } from "react";
import type { DmStatus } from "@/types/dm";
import { DmPaySheet } from "./DmPaySheet";
import { Button, Icon } from "@/components/ui";
import { formatNaira } from "@/lib/format";

// SEAM: replace with POST /api/hub/dm/:threadId/report — no report/flag endpoint
// exists yet anywhere in the API layer, so this simulates the round trip.
async function reportMockDmIssue(threadId: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  // eslint-disable-next-line no-console
  console.info(`[mock] reported DM thread ${threadId} for review`);
}

export function DmThreadFooter({
  threadId,
  creator,
  status,
}: {
  threadId: string;
  creator: { wawuId: string; name: string; handle: string; dmPrice: number };
  status: DmStatus;
}) {
  const [open, setOpen] = useState(false);
  const [reportState, setReportState] = useState<"idle" | "sending" | "sent">("idle");
  const firstName = creator.name.split(" ")[0];

  const reportIssue = async () => {
    if (reportState !== "idle") return;
    setReportState("sending");
    try {
      await reportMockDmIssue(threadId);
    } finally {
      setReportState("sent");
    }
  };

  return (
    <footer className="sticky bottom-0 border-t border-[var(--border-hairline)] bg-[var(--surface-elevated)] p-[10px_16px_calc(10px+env(safe-area-inset-bottom))]">
      {status === "awaiting_response" ? (
        <div className="flex h-[46px] items-center gap-[9px] rounded-[var(--radius-chip)] border border-[var(--border-hairline)] bg-[var(--surface-tag)] px-[14px] text-[13.5px] text-[var(--text-muted)]">
          <Icon name="Clock" size={16} color="var(--text-muted)" />
          Waiting for {firstName} to reply…
        </div>
      ) : status === "refunded" ? (
        <div className="flex flex-col gap-[12px]">
          <div className="flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px_16px]">
            <span className="text-[14px] font-semibold text-[var(--text-primary)]">Still need an answer?</span>
            <span className="text-[13px] leading-[1.5] text-[var(--text-secondary)]">
              Comment on {firstName}&rsquo;s content — that&rsquo;s always free — or try another creator.
            </span>
            <div className="flex gap-[10px]">
              <Button size="sm" variant="secondary" className="flex-1" href={`/profile/${creator.wawuId}`}>
                Comment instead
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={reportIssue}
                disabled={reportState !== "idle"}
              >
                {reportState === "sent" ? "Reported" : "Report an issue"}
              </Button>
            </div>
          </div>
          <Button full onClick={() => setOpen(true)}>
            Try again — {formatNaira(creator.dmPrice)}
          </Button>
        </div>
      ) : (
        <Button full onClick={() => setOpen(true)}>
          Send another message · {formatNaira(creator.dmPrice)}
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
