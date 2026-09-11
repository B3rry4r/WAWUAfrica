"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FollowButton } from "@/components/shared/FollowButton";
import { DmPaySheet, type DmCreator } from "@/components/dm/DmPaySheet";
import { TipSheet } from "@/components/dm/TipSheet";
import { formatNaira } from "@/lib/format";

/**
 * Desktop-only top-right action row for the wide identity block (design
 * D16): Follow, Ask (paid DM) and Tip grouped together where a desktop
 * reader looks for them. This wraps the exact same DmPaySheet/TipSheet
 * mobile's ProfileActions and CompactHeaderActions already use — a third
 * composition of those shared sheets for the wide-row context, not a fork
 * of either mobile component (neither of which lays out as a compact
 * top-right row).
 */
export function DesktopProfileActions({
  creator,
  dmEnabled,
  following,
}: {
  creator: DmCreator;
  dmEnabled: boolean;
  following: boolean;
}) {
  const [dmOpen, setDmOpen] = useState(false);
  const [tipOpen, setTipOpen] = useState(false);
  // Same rule as mobile's ProfileActions: no real price, no paid-ask entry.
  const canAsk = dmEnabled && creator.dmPrice > 0;

  return (
    <div className="flex items-center gap-[10px]">
      <FollowButton wawuId={creator.wawuId} initial={following} size="md" />
      <Button
        size="md"
        variant="secondary"
        icon="MessageCircleQuestion"
        disabled={!canAsk}
        onClick={() => setDmOpen(true)}
      >
        {canAsk ? `Ask · ${formatNaira(creator.dmPrice)}` : "Messages off"}
      </Button>
      <Button size="md" variant="secondary" icon="HandCoins" onClick={() => setTipOpen(true)}>
        Tip
      </Button>
      <DmPaySheet open={dmOpen} onClose={() => setDmOpen(false)} creator={creator} />
      <TipSheet
        open={tipOpen}
        onClose={() => setTipOpen(false)}
        creator={{ wawuId: creator.wawuId, name: creator.name, avatarUrl: creator.avatarUrl }}
      />
    </div>
  );
}
