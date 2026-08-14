import Link from "next/link";
import { Avatar, PriceChip, Skeleton } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ContentItem, ContentType } from "@/types/content";

const TYPE_LABEL: Record<ContentType, string> = {
  video: "Video",
  course: "Course",
  audio: "Audio",
  pdf: "Book",
  image: "Art",
  template: "Template",
};

/**
 * The most reused component in the app — feed, creator profile, search, purchases,
 * saved. Do not fork it. If a surface needs a variant, add a prop here.
 */
export function ContentCard({ item }: { item: ContentItem }) {
  const locked = item.fullAssetLocked;

  return (
    <article className="overflow-hidden rounded-[var(--radius-card)] bg-[var(--surface-card)] shadow-[var(--shadow-card)]">
      <Link href={`/content/${item.id}`} className="block">
        <div className="relative aspect-[16/10] bg-[var(--surface-elevated)]">
          {item.thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
          )}
          {locked && <div className="absolute inset-0 bg-[var(--locked-veil)]" aria-hidden="true" />}
          <div className="absolute left-3 top-3">
            <span className="rounded-[var(--radius-chip)] bg-[var(--surface-scrim)] px-2 py-1 text-[11px] font-medium text-[var(--text-primary)]">
              {TYPE_LABEL[item.contentType]}
            </span>
          </div>
          <div className="absolute right-3 top-3">
            <PriceChip price={item.price} locked={locked} />
          </div>
        </div>
      </Link>

      <div className="flex flex-col gap-2 p-[var(--card-pad)]">
        <Link href={`/content/${item.id}`}>
          <h3
            className={cn(
              "text-[var(--text-card)] font-semibold leading-[var(--leading-snug)]",
              "text-[var(--text-primary)]"
            )}
          >
            {item.title}
          </h3>
        </Link>
        <Link
          href={`/creator/${item.creator.wawuId}`}
          className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]"
        >
          <Avatar src={item.creator.avatarUrl} name={item.creator.name} size={22} />
          <span className="truncate">{item.creator.name}</span>
        </Link>
      </div>
    </article>
  );
}

export function ContentCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] bg-[var(--surface-card)]">
      <Skeleton className="aspect-[16/10] rounded-none" />
      <div className="flex flex-col gap-2 p-[var(--card-pad)]">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}
