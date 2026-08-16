"use client";

import { useState } from "react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/Button";
import { toggleFollow } from "@/lib/api/explore";

export function FollowButton({ wawuId, initial, size = "sm" }: { wawuId: string; initial: boolean; size?: ComponentProps<typeof Button>["size"] }) {
  const [following, setFollowing] = useState(initial);
  return (
    <Button
      size={size}
      variant={following ? "secondary" : "primary"}
      onClick={() => {
        const next = !following;
        setFollowing(next);
        void toggleFollow(wawuId, following).catch(() => setFollowing(!next));
      }}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}