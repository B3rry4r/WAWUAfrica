import Link from "next/link";
import type { CreatorDiscovery } from "@/types/explore";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { FollowButton } from "@/components/shared/FollowButton";

/**
 * Desktop 4-up creator discovery card (design D10). Shared by the Explore
 * landing's "Creators to watch" row and /explore/creators' xl grid so both
 * stay identical without forking the card.
 *
 * The identity half is a link to the creator's profile. It used to be inert:
 * the card offered Follow and nothing else, so Explore let you follow someone
 * you had no way of opening. FollowButton stays OUTSIDE the link — nesting it
 * would make tapping Follow navigate instead (same rule as the row card in
 * /explore/creators).
 */
export function CreatorGridCard({ creator }: { creator: CreatorDiscovery }) {
  return (
    // The hover belongs to the whole card, but it is driven by the identity
    // link only: `has-[a:hover]` keeps FollowButton (a <button>, deliberately
    // outside the link) from lighting the card it does not navigate.
    <div className="flex flex-col items-start gap-3 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-5 has-[a:hover]:border-strong has-[a:hover]:bg-surface-hover">
      <Link
        href={`/profile/${creator.wawuId}`}
        className="flex w-full flex-col items-start gap-3 no-underline"
      >
        <Avatar src={creator.avatarUrl} initial={creator.name.charAt(0)} size={56} />
        <div className="flex items-center gap-[7px]">
          <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">
            {creator.handle ? `@${creator.handle}` : creator.name}
          </span>
          {creator.verification ? <VerificationBadge tier={creator.verification} size={16} /> : null}
        </div>
        <span className="text-[12.5px] text-[var(--text-muted)]">
          {creator.field} · {creator.pieceCount} {creator.pieceCount === 1 ? "piece" : "pieces"}
        </span>
      </Link>
      <div className="flex w-full [&>button]:w-full">
        <FollowButton wawuId={creator.wawuId} initial={creator.following} size="sm" />
      </div>
    </div>
  );
}
