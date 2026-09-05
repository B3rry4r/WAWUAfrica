import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Icon } from "@/components/ui/Icon";
import { PriceChip } from "@/components/ui/PriceChip";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import type { IconName } from "@/components/ui/Icon";
import type { ContentPiece, ContentState, ContentType } from "@/types/content";
import { ContentThumb } from "@/components/ui/ContentThumb";

const typeVisual: Record<ContentType, IconName> = {
  video: "Play",
  course: "GraduationCap",
  audio: "Headphones",
  pdf: "FileText",
  image: "Image",
  template: "LayoutTemplate",
};

const typeLabel: Record<ContentType, string> = {
  video: "Video",
  course: "Course",
  audio: "Audio",
  pdf: "PDF",
  image: "Image",
  template: "Template",
};

interface ContentCardProps {
  content: ContentPiece;
  state?: ContentState;
  ratio?: string;
  href?: string;
  /** Renders the design's author row (avatar, name, badge, time) above the media. */
  authorRow?: boolean;
}

function timeAgo(iso: string): string {
  const secs = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  const m = Math.floor(secs / 60);
  if (m < 1) return "now";
  const h = Math.floor(m / 60);
  if (h < 1) return `${m}m`;
  const d = Math.floor(h / 24);
  if (d < 1) return `${h}h`;
  const w = Math.floor(d / 7);
  if (w < 1) return `${d}d`;
  return `${w}w`;
}

/**
 * The ONE content card, shared across feed, profile, search and purchases
 * (docs/05_CONVENTIONS.md; shared rule in docs/06_DEV_ASSIGNMENTS.md).
 * Do not fork a second one.
 */
export function ContentCard({ content, state, ratio = "4 / 3", href, authorRow = false }: ContentCardProps) {
  const resolvedState: ContentState = state ?? (content.fullAssetLocked ? "locked" : content.purchased ? "unlocked" : "free");
  const locked = resolvedState === "locked";

  const meta =
    content.pageCount && content.pageCount > 0
      ? `${content.pageCount} pages`
      : content.lessonCount && content.lessonCount > 0
        ? `${content.lessonCount} lessons`
        : content.durationLabel;

  return (
    <Link
      href={href ?? `/content/${content.id}`}
      className="flex flex-col overflow-hidden rounded-card border border-hairline bg-card transition-transform duration-200 hover:scale-[0.99]"
    >
      {authorRow ? (
        <div className="flex items-center gap-2.5 p-3 pb-2.5">
          <Avatar initial={content.creator.fullName} size={36} />
          <div className="flex min-w-0 flex-1 items-center gap-1.5">
            <span className="truncate text-[14.5px] font-semibold text-text-primary">{content.creator.fullName}</span>
            <VerificationBadge tier={content.creator.verificationLevel} size={16} />
            <span className="shrink-0 text-[12.5px] text-text-muted">· {timeAgo(content.createdAt)}</span>
          </div>
          <Icon name="Ellipsis" size={18} color="var(--text-muted)" />
        </div>
      ) : null}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: ratio }}>
        {/* The real cover, with the placeholder behind it for anything that
            has none. This card drew only the gradient, so every piece in the
            feed looked identical whatever its creator had uploaded. */}
        <ContentThumb
          src={content.previewAssetUrl}
          alt=""
          rounded="0"
          className="absolute inset-0 h-full w-full !border-0"
        />
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-12 w-12 place-items-center rounded-full border border-strong bg-[rgba(11,10,13,0.55)] text-text-primary backdrop-blur">
            <Icon name={typeVisual[content.contentType]} size={20} strokeWidth={2} />
          </span>
        </span>

        {locked ? (
          <span className="absolute inset-0 grid place-items-center bg-locked-veil">
            <Icon name="Lock" size={20} color="var(--text-on-accent)" strokeWidth={2} />
          </span>
        ) : null}

        <span className="absolute right-2.5 top-2.5">
          {content.accessType === "free" ? (
            <PriceChip free />
          ) : (
            <PriceChip amount={content.price} tone={locked ? "glass" : "accent"} />
          )}
        </span>

        <span className="absolute left-2.5 top-2.5 inline-flex h-[24px] items-center rounded-full border border-strong bg-locked-veil px-[10px] text-[11.5px] font-semibold text-text-primary backdrop-blur">
          {typeLabel[content.contentType]}
        </span>

        {content.contentType === "course" || content.contentType === "video" || content.contentType === "audio" ? (
          <span className="absolute bottom-2.5 left-2.5 inline-flex h-[24px] items-center rounded-full border border-strong bg-locked-veil px-[10px] text-[11.5px] font-semibold text-text-primary backdrop-blur">
            {content.durationLabel}
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-[5px] p-3">
        <span className="line-clamp-2 text-[15px] font-semibold leading-snug text-text-primary">{content.title}</span>
        {authorRow ? (
          <span className="truncate text-[12.5px] text-text-muted">{meta}</span>
        ) : (
          <span className="truncate text-[12.5px] text-text-muted">
            {content.creator.fullName}
            {meta ? ` · ${meta}` : ""}
          </span>
        )}
      </div>
    </Link>
  );
}