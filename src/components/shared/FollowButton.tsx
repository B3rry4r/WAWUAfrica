"use client";

import { useState } from "react";
import type { ButtonProps } from "@/components/ui/Button";
import { Button } from "@/components/ui/Button";
import { toggleFollow } from "@/lib/api/explore";

export function FollowButton({ wawuId, initial, size = "sm" }: { wawuId: string; initial: boolean; size?: ButtonProps["size"] }) {
  const [following, setFollowing] = useState(initial);
  return (
    <Button
      size={size}
      variant={following ? "secondary" : "primary"}
      onClick={() => {
        const next = !following;
        setFollowing(next);
        void toggleFollow(wawuId).catch(() => setFollowing(!next));
      }}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}