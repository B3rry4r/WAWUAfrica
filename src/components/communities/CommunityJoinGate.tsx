"use client";

import type { Community } from "@/types/credits";
import { Button } from "@/components/ui/Button";
import { CommunityImage } from "@/components/ui/CommunityImage";
import { Icon } from "@/components/ui/Icon";

/**
 * What someone standing outside a room sees.
 *
 * THREE states, not two — the third is the one that was missing. A private
 * community's join writes `status: "pending"`: the request is filed and the
 * host has to approve it before the server will let them read or post. The
 * UI showed those people the same "Join community" button they had already
 * pressed, so the only feedback for asking was nothing changing. Now they
 * see that they asked, and that someone has to answer.
 *
 * Shared by the mobile room screen and the desktop three-pane thread rather
 * than written twice — the pending copy has to say the same thing on both,
 * and a forked version of this is how one of them ends up still lying.
 */
export function CommunityJoinGate({
  community,
  onJoin,
  joinError,
  joining = false,
}: {
  community: Community;
  onJoin: () => void;
  joinError?: string | null;
  joining?: boolean;
}) {
  const isPrivate = community.kind === "private";

  if (community.pending) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-7 py-[60px] text-center">
        <span className="mb-2 grid h-16 w-16 place-items-center rounded-full border border-[var(--border-decor)] bg-[var(--decor-tint)]">
          <Icon name="Clock" size={26} color="var(--accent)" strokeWidth={1.9} />
        </span>
        <span className="text-[18px] font-bold text-text-primary">Waiting for the host</span>
        <p className="m-0 max-w-[320px] text-[14px] leading-[1.5] text-text-secondary">
          You asked to join {community.name}. {community.host.name} reviews every request, and the room opens here as
          soon as yours is approved. Nothing is charged while you wait.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-7 py-[60px] text-center">
      <CommunityImage
        src={community.imageUrl}
        icon={isPrivate ? "Lock" : "Users"}
        iconSize={26}
        className="mb-2 h-16 w-16 rounded-full border border-[var(--border-decor)] bg-[var(--decor-tint)]"
      />
      <span className="text-[18px] font-bold text-text-primary">
        {isPrivate ? "Private community" : "Join to read and post"}
      </span>
      <p className="m-0 max-w-[320px] text-[14px] leading-[1.5] text-text-secondary">
        {isPrivate
          ? // Says what actually happens next. "Join" on a private room does
            // not admit you — it files a request the host answers.
            `${community.name} is a closed circle. Ask to join and the host decides — you'll get in once they approve. Reading costs nothing, sending costs one credit.`
          : `${community.name} is open to everyone. Join to read and post. Reading costs nothing, sending costs one credit.`}
      </p>
      <Button onClick={onJoin} disabled={joining} className="mt-3.5">
        {isPrivate ? "Ask to join" : "Join community"}
      </Button>
      {joinError && <p className="m-0 text-[13px] text-[var(--danger)]">{joinError}</p>}
    </div>
  );
}
