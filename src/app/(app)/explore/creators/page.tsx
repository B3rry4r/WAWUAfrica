import Link from "next/link";
import type { ExploreCategoryId } from "@/types/explore";
import { CATEGORY_IDS, categoryName, isCategoryId } from "@/lib/categories";
import type { VerificationLevel } from "@/types/account";
import { getCreators } from "@/lib/api/explore";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { FollowButton } from "@/components/shared/FollowButton";
import { CategoryFilterAside } from "../_components/CategoryFilterAside";
import { CreatorGridCard } from "../_components/CreatorGridCard";


export default async function CreatorsPage({ searchParams }: { searchParams: { category?: string } }) {
  // No (or unrecognised) category means genuinely unfiltered browsing —
  // getCreators() takes an optional category, so `undefined` returns every
  // creator. CategoryFilterAside already reads a missing category as
  // "All creators" active.
  const raw = searchParams.category;
  const category: ExploreCategoryId | undefined = raw && isCategoryId(raw) ? raw : undefined;
  const creators = await getCreators(category);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <div className="xl:hidden">
        <ScreenHeader
          title="Creators"
          right={
            <Link href="/search" aria-label="Search" className="grid place-items-center">
              <Icon name="Search" size={19} color="var(--text-secondary)" />
            </Link>
          }
        />
        <div className="flex gap-2 overflow-x-auto border-b border-[var(--border-hairline)] px-4 py-3 [scrollbar-width:none]">
          {[undefined, ...CATEGORY_IDS].map((id) => {
            const on = category === id;
            return (
              <Link
                key={id ?? "all"}
                href={id ? `/explore/creators?category=${id}` : "/explore/creators"}
                className={`inline-flex h-8 flex-shrink-0 items-center whitespace-nowrap rounded-[var(--radius-chip)] border px-[14px] text-[13px] no-underline ${
                  on
                    ? "border-transparent bg-[var(--accent)] font-semibold text-[var(--text-on-accent)]"
                    : "border-[var(--border-hairline)] bg-[var(--surface-tag)] font-medium text-[var(--text-secondary)]"
                }`}
              >
                {id ? categoryName(id) : "All"}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-[10px] p-[14px_16px_96px] xl:hidden">
        {creators.map((creator) => (
          <CreatorRow
            key={creator.wawuId}
            wawuId={creator.wawuId}
            name={creator.name}
            field={creator.field}
            pieceCount={creator.pieceCount}
            verification={creator.verification}
            following={creator.following}
          />
        ))}
      </div>

      {/* xl: category filter moves into a permanent left aside (design D10)
          and the list becomes a 4-up discovery grid instead of rows. */}
      <div className="hidden xl:flex xl:items-start xl:gap-10 xl:p-[26px]">
        <CategoryFilterAside activeCategory={category} />
        <div className="grid min-w-0 flex-1 grid-cols-4 gap-[18px]">
          {creators.map((creator) => (
            <CreatorGridCard key={creator.wawuId} creator={creator} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface CreatorRowProps {
  wawuId: string;
  name: string;
  field: string;
  pieceCount: number;
  verification?: VerificationLevel;
  following: boolean;
}

function CreatorRow({ wawuId, name, field, pieceCount, verification, following }: CreatorRowProps) {
  return (
    // The row navigates via a stretched overlay link rather than wrapping its
    // contents: FollowButton must stay outside the link, or tapping Follow
    // also navigates to the profile.
    <div className="relative flex min-h-[86px] items-center gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[0_14px]">
      <Link
        href={`/profile/${wawuId}`}
        aria-label={`${name}, ${field}`}
        className="absolute inset-0 rounded-[var(--radius-card)] no-underline"
      />
      <Avatar initial={name.charAt(0)} size={52} />
      <div className="pointer-events-none flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-[6px]">
          <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[15px] font-semibold text-[var(--text-primary)]">
            {name}
          </span>
          {verification && <VerificationBadge tier={verification} size={15} />}
        </div>
        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-[12.5px] text-[var(--text-muted)]">
          {field} · {pieceCount} {pieceCount === 1 ? "piece" : "pieces"}
        </span>
      </div>
      <div className="relative flex flex-shrink-0">
        <FollowButton wawuId={wawuId} initial={following} />
      </div>
    </div>
  );
}
