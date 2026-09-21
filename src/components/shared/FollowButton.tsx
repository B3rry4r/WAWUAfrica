"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/Button";
import { sessionStorage } from "@/lib/auth/session-storage";
import { toggleFollow } from "@/lib/api/explore";
import { isFollowing } from "@/lib/api/profile";

/**
 * `initial` is the owner's follow state, not a one-time seed: the button keeps
 * its own optimistic state (so a tap is instant and rolls back if the call
 * fails) but re-syncs whenever the prop changes. Without that sync, a page
 * rendering this twice — a header and a rail, say — had one copy stuck on
 * "Follow" while the other said "Following".
 *
 * `initial` is ALSO not the whole truth: several owners hand it a default of
 * false (home rail suggestions, search results) without asking the backend.
 * To stop those surfaces disagreeing with the real state, the button asks
 * `isFollowing()` itself on mount. A `touched` ref keeps a late-arriving
 * answer from clobbering a follow the user already tapped — the moment they
 * do, whatever the user sees is what they get.
 */
export function FollowButton({ wawuId, initial, size = "sm" }: { wawuId: string; initial: boolean; size?: ComponentProps<typeof Button>["size"] }) {
  const [following, setFollowing] = useState(initial);
  const router = useRouter();
  const touched = useRef(false);

  useEffect(() => {
    let alive = true;
    isFollowing(wawuId)
      .then((real) => {
        if (alive && !touched.current) setFollowing(real);
      })
      .catch(() => {
        // Non-mock read failure — keep the owner's `initial` rather than
        // flipping a button on guesswork.
      });
    return () => {
      alive = false;
    };
    // Sync once per creator; `initial` is handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wawuId]);

  useEffect(() => {
    if (!touched.current) setFollowing(initial);
  }, [initial]);

  return (
    <Button
      size={size}
      variant={following ? "secondary" : "primary"}
      onClick={() => {
        /*
          A visitor with no session is sent to sign up rather than shown a
          follow that did not happen.

          This button now appears on the PUBLIC store link (build brief C3),
          where there may be nobody signed in. Optimistically flipping to
          "Following" and then silently rolling back on a 401 tells somebody
          they followed a creator when they did not, and in a fixture build
          the mock path made it look like it worked.
        */
        if (!sessionStorage.getToken()) {
          router.push(`/sign-up?next=${encodeURIComponent(window.location.pathname)}`);
          return;
        }
        touched.current = true;
        const next = !following;
        setFollowing(next);
        void toggleFollow(wawuId, following).catch(() => setFollowing(!next));
      }}
    >
      {following ? "Following" : "Follow"}
    </Button>
  );
}
