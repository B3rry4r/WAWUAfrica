"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { DmPaySheet, type DmCreator } from "@/components/dm/DmPaySheet";
import { TipSheet } from "@/components/dm/TipSheet";
import { formatNaira } from "@/lib/format";

/**
 * Fan-side action row under the header: Message (paid DM entry) + Tip.
 * Tipping has no dependency on the creator's paid-DM setting, so the Tip
 * entry point always renders. DMs off → the Message slot becomes a disabled
 * "Messages off" state with a hint, exactly per the design.
 */
export function ProfileActions({
  creator,
  dmEnabled,
}: {
  creator: DmCreator;
  dmEnabled: boolean;
}) {
  const [dmOpen, setDmOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  return (
    <>
      <div className="flex flex-col gap-[7px] p-[0_18px_4px]">
        <div className="flex gap-2">
          <div className="flex flex-1">
            {dmEnabled ? (
              <Button full variant="secondary" onClick={() => setDmOpen(true)}>
                Message {creator.dmPrice > 0 ? formatNaira(creator.dmPrice) : ""}
              </Button>
            ) : (
              <Button full variant="secondary" disabled>
                Messages off
              </Button>
            )}
          </div>
          <div className="flex w-12">
            <Button full variant="secondary" size="sm" icon="HandCoins" aria-label="Tip" onClick={() => setTipOpen(true)} />
          </div>
        </div>
        {!dmEnabled && (
          <span className="text-[12px] text-[var(--text-muted)]">This creator has not switched paid messages on. Comment on their work instead.</span>
        )}
      </div>
      <DmPaySheet open={dmOpen} onClose={() => setDmOpen(false)} creator={creator} />
      <TipSheet open={tipOpen} onClose={() => setTipOpen(false)} creator={{ wawuId: creator.wawuId, name: creator.name }} />
    </>
  );
}
