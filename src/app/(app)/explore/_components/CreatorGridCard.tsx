import type { CreatorDiscovery } from "@/types/explore";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { FollowButton } from "@/components/shared/FollowButton";

/**
 * Desktop 4-up creator discovery card (design D10). Shared by the Explore
 * landing's "Creators to watch" row and /explore/creators' xl grid so both
 * stay identical without forking the card.
 */
export function CreatorGridCard({ creator }: { creator: CreatorDiscovery }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-5">
      <Avatar initial={creator.name.charAt(0)} size={56} />
      <div className="flex items-center gap-[7px]">
        <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">{creator.name}</span>
        {creator.verification ? <VerificationBadge tier={creator.verification} size={16} /> : null}
      </div>
      <span className="text-[12.5px] text-[var(--text-muted)]">
        {creator.field} · {creator.pieceCount} {creator.pieceCount === 1 ? "piece" : "pieces"}
      </span>
      <div className="flex w-full [&>button]:w-full">
        <FollowButton wawuId={creator.wawuId} initial={creator.following} size="sm" />
      </div>
    </div>
  );
}
