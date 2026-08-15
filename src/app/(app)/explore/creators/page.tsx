import Link from "next/link";
import type { ExploreCategoryId } from "@/types/explore";
import type { VerificationLevel } from "@/types/account";
import { getCreators } from "@/lib/api/explore";
import { Icon } from "@/components/ui/Icon";
import { Avatar } from "@/components/ui/Avatar";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { FollowButton } from "@/components/shared/FollowButton";
import { CategoryFilterAside } from "../_components/CategoryFilterAside";
import { CreatorGridCard } from "../_components/CreatorGridCard";

const VALID_CATEGORIES: ExploreCategoryId[] = [
  "business",
  "agriculture",
  "finance",
  "trade",
  "entertainment",
  "career",
  "education",
  "health",
  "technology",
  "creative_arts",
  "culture",
];

export default async function CreatorsPage({ searchParams }: { searchParams: { category?: string } }) {
  const category = VALID_CATEGORIES.includes(searchParams.category as ExploreCategoryId)
    ? (searchParams.category as ExploreCategoryId)
    : "business";
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
          {VALID_CATEGORIES.map((id) => {
            const on = category === id;
            return (
              <Link
                key={id}
                href={id === "business" ? "/explore/creators" : `/explore/creators?category=${id}`}
                className={`inline-flex h-8 flex-shrink-0 items-center rounded-[var(--radius-chip)] border px-[14px] text-[13px] no-underline capitalize ${
                  on
                    ? "border-transparent bg-[var(--accent)] font-semibold text-[var(--text-on-accent)]"
                    : "border-[var(--border-hairline)] bg-[var(--surface-tag)] font-medium text-[var(--text-secondary)]"
                }`}
              >
                {id.replace("_", " ")}
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
    <Link
      href={`/profile/${wawuId}`}
      className="flex min-h-[86px] items-center gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[0_14px] no-underline"
    >
      <Avatar initial={name.charAt(0)} size={52} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
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
      <div className="flex flex-shrink-0">
        <FollowButton wawuId={wawuId} initial={following} />
      </div>
    </Link>
  );
}
