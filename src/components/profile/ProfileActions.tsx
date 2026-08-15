"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { DmPaySheet, type DmCreator } from "@/components/dm/DmPaySheet";
import { TipSheet } from "@/components/dm/TipSheet";

/**
 * Fan-side action row under the header: Message (paid DM entry) + Tip.
 * DMs off → disabled "Messages off" with a hint, exactly per the design.
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
  if (!dmEnabled) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 7, padding: "0 18px 4px" }}>
        <Button full variant="secondary" disabled>
          Messages off
        </Button>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>This creator has not switched paid messages on. Comment on their work instead.</span>
      </div>
    );
  }
  return (
    <>
      <div style={{ display: "flex", gap: 8, padding: "0 18px 4px" }}>
        <div style={{ flex: 1, display: "flex" }}>
          <Button full variant="secondary" onClick={() => setDmOpen(true)}>
            Message {creator.dmPrice > 0 ? `₦${creator.dmPrice}` : ""}
          </Button>
        </div>
        <div style={{ width: 48, display: "flex" }}>
          <Button full variant="secondary" icon="HandCoins" style={{ padding: 0 }} aria-label="Tip" onClick={() => setTipOpen(true)} />
        </div>
      </div>
      <DmPaySheet open={dmOpen} onClose={() => setDmOpen(false)} creator={creator} />
      <TipSheet open={tipOpen} onClose={() => setTipOpen(false)} creator={{ wawuId: creator.wawuId, name: creator.name }} />
    </>
  );
}