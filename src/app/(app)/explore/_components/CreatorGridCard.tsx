import type { CreatorDiscovery } from "@/types/explore";
import { Avatar, MediaCard, VerificationTicks } from "@/components/ui";
import { FollowButton } from "@/components/shared/FollowButton";

/**
 * The creator card, built to the reference
 * (refs/target-explore-desktop-structure.jpg, "Featured Creators").
 *
 * WHAT THE REFERENCE DRAWS. A portrait photograph IS the card. The name with
 * its tick, the role line and a full-width purple Follow pill sit over the
 * bottom of that photograph behind a scrim. Nothing else: no piece count, no
 * handle, no separate panel under the picture.
 *
 * WHAT WAS THERE BEFORE, twice. First a 56px avatar circle on a dark card
 * with "field - N pieces" under it, which on real data is a coloured circle
 * with a letter in it and tells a visitor nothing about the person. Then a
 * photo on top with the body in a panel below, which is the EVENT card's
 * shape, not this one. This is the reference's shape.
 *
 * FollowButton stays outside MediaCard's link on purpose: nesting a button
 * inside an anchor makes pressing Follow navigate instead of following.
 */
export function CreatorGridCard({ creator }: { creator: CreatorDiscovery }) {
  const display = creator.handle ? `@${creator.handle}` : creator.name;

  return (
    <div className="relative w-[168px] shrink-0 dt:w-[188px]">
      <MediaCard
        href={`/profile/${creator.wawuId}`}
        imageUrl={creator.avatarUrl}
        aspect="aspect-[3/4]"
        className="w-full"
        fallback={<Avatar src={null} initial={creator.name.charAt(0)} size={64} />}
        title={display}
        titleBadge={<VerificationTicks verification={creator.verification} size="xs" />}
        caption={creator.field || undefined}
        // The Follow pill's own space, reserved inside the scrim so the name
        // and role are never pushed behind the button laid over them.
        action={<span className="block h-[32px]" />}
      />
      <div className="absolute inset-x-[11px] bottom-[11px] [&>button]:w-full">
        <FollowButton wawuId={creator.wawuId} initial={creator.following} size="sm" />
      </div>
    </div>
  );
}
