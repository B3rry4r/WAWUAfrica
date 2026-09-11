"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { DmPaySheet, type DmCreator } from "@/components/dm/DmPaySheet";
import { TipSheet } from "@/components/dm/TipSheet";

/**
 * Message + Tip triggers for the collapsed sticky header (Shop/About tabs).
 * Opens the same DmPaySheet/TipSheet as ProfileActions on the full header —
 * same mechanism, just the compact icon-only chrome the collapsed bar uses.
 */
export function CompactHeaderActions({ creator, dmEnabled }: { creator: DmCreator; dmEnabled: boolean }) {
  const [dmOpen, setDmOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        icon="MessageCircle"
        aria-label="Message"
        className="w-[38px] !px-0"
        disabled={!dmEnabled}
        onClick={() => setDmOpen(true)}
      />
      <Button
        size="sm"
        variant="secondary"
        icon="HandCoins"
        aria-label="Tip"
        className="w-[38px] !px-0"
        onClick={() => setTipOpen(true)}
      />
      <DmPaySheet open={dmOpen} onClose={() => setDmOpen(false)} creator={creator} />
      <TipSheet
        open={tipOpen}
        onClose={() => setTipOpen(false)}
        creator={{ wawuId: creator.wawuId, name: creator.name, avatarUrl: creator.avatarUrl }}
      />
    </>
  );
}
