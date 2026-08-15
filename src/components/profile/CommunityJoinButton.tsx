"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { toggleCommunityJoin } from "@/lib/api/profile";

/** Join/Request toggle for a community row on a creator's profile. */
export function CommunityJoinButton({ wawuId, communityId, initial, kind }: { wawuId: string; communityId: string; initial: boolean; kind: "open" | "private" }) {
  const [joined, setJoined] = useState(initial);
  const label = joined ? "Joined" : kind === "private" ? "Request" : "Join";
  return (
    <Button
      size="sm"
      variant={joined ? "secondary" : "primary"}
      onClick={() => {
        const next = !joined;
        setJoined(next);
        void toggleCommunityJoin(wawuId, communityId).catch(() => setJoined(!next));
      }}
    >
      {label}
    </Button>
  );
}