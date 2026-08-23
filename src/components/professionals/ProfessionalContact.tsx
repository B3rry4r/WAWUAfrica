"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { DmPaySheet, type DmCreator } from "@/components/dm/DmPaySheet";
import { formatNaira } from "@/lib/format";

/** "24 hours" / "3 days" — never a bare hour count once past a day. */
function windowLabel(hours: number): string {
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"}`;
  if (hours % 168 === 0) {
    const weeks = hours / 168;
    return `${weeks} week${weeks === 1 ? "" : "s"}`;
  }
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"}`;
}

/**
 * The one transaction on a professional's page: pay to send the first
 * message.
 *
 * Reuses DmPaySheet rather than building a professional-specific checkout.
 * There is nothing different about this payment — same charge, same locked
 * reply window, same automatic refund if they never answer — and a second
 * sheet would be a second place for those rules to drift out of step.
 */
export function ProfessionalContact({
  creator,
  dmEnabled,
  responseHours,
}: {
  creator: DmCreator;
  dmEnabled: boolean;
  responseHours: number;
}) {
  const [open, setOpen] = useState(false);
  const canAsk = dmEnabled && creator.dmPrice > 0;

  return (
    <>
      <div className="flex flex-col gap-[8px]">
        {canAsk ? (
          <>
            <Button full onClick={() => setOpen(true)} icon="MessageCircle">
              Ask a question · {formatNaira(creator.dmPrice)}
            </Button>
            <span className="text-center text-[12.5px] leading-[1.45] text-[var(--text-muted)]">
              {creator.name.split(" ")[0]} has {windowLabel(responseHours)} to
              reply. If they do not, you are refunded automatically.
            </span>
          </>
        ) : (
          <>
            <Button full variant="secondary" disabled>
              Not taking messages
            </Button>
            <span className="flex items-center justify-center gap-[6px] text-center text-[12.5px] text-[var(--text-muted)]">
              <Icon name="Clock" size={13} color="var(--text-muted)" strokeWidth={2} />
              They have paused new enquiries. Nothing is charged.
            </span>
          </>
        )}
      </div>

      <DmPaySheet open={open} onClose={() => setOpen(false)} creator={creator} />
    </>
  );
}
