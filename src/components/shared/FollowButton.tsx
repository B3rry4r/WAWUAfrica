"use client";

import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/Button";
import { toggleFollow } from "@/lib/api/explore";

/**
 * `initial` is the owner's follow state, not a one-time seed: the button keeps
 * its own optimistic state (so a tap is instant and rolls back if the call
 * fails) but re-syncs whenever the prop changes. Without that sync, a page
 * rendering this twice — a header and a rail, say — had one copy stuck on
 * "Follow" while the other said "Following", and a late-arriving isFollowing()
 * fetch never reached the button at all.
 */
export function FollowButton({ wawuId, initial, size = "sm" }: { wawuId: string; initial: boolean; size?: ComponentProps<typeof Button>["size"] }) {
  const [following, setFollowing] = useState(initial);

  useEffect(() => {
    setFollowing(initial);
  }, [initial]);

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
