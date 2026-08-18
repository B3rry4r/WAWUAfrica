import { formatNaira } from "@/lib/format";
import type { ContentItem } from "@/types/content";
import { Icon } from "./Icon";
import { PriceChip } from "./PriceChip";
import { StatusPill, type StatusKind } from "./StatusPill";

const statusPill: Record<ContentItem["status"], { kind: StatusKind; label: string }> = {
  live: { kind: "success", label: "Live" },
  review: { kind: "warning", label: "In review" },
  rejected: { kind: "error", label: "Rejected" },
};

const borderClass: Record<ContentItem["status"], string> = {
  live: "border-hairline",
  review: "border-[rgba(255,183,3,0.28)]",
  rejected: "border-[rgba(255,92,92,0.28)]",
};

export interface CreatorUploadCardProps {
  item: ContentItem;
  onClick?: () => void;
  onFix?: () => void;
}

/** Creator dashboard upload-list row (status pill, earnings, fix-and-resubmit). */
export function CreatorUploadCard({ item, onClick, onFix }: CreatorUploadCardProps) {
  const pill = statusPill[item.status];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex gap-[13px] p-[14px] rounded-[var(--radius-card)] bg-[var(--surface-card)] text-left w-full border [font-family:var(--font-sans)] ${borderClass[item.status]} ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <span
        className="w-[56px] h-[70px] rounded-[10px] shrink-0 bg-[repeating-linear-gradient(135deg,_var(--surface-tag)_0_12px,_var(--surface-card)_12px_24px)] border border-[var(--border-hairline)]"
      />
      <span className="flex-1 min-w-0 flex flex-col gap-[6px]">
        <span className="flex items-start gap-[8px]">
          <span
            className="flex-1 min-w-0 text-[14.5px] font-semibold leading-[1.3] text-[var(--text-primary)]"
          >
            {item.title}
          </span>
          <span className="flex shrink-0">
            <StatusPill kind={pill.kind} size="xs">
              {pill.label}
            </StatusPill>
          </span>
        </span>

        <span
          className="text-[12.5px] text-[var(--text-secondary)] leading-[1.4] [font-feature-settings:var(--font-feature-tabular)]"
        >
          {item.meta}
        </span>

        {item.status === "rejected" && item.rejectionReason ? (
          <span className="text-[12.5px] leading-[1.45] text-[var(--text-secondary)]">
            {item.rejectionReason}
          </span>
        ) : null}

        {item.status === "rejected" && onFix ? (
          <span className="text-[12.5px] font-semibold text-[var(--accent)]">Fix and resubmit</span>
        ) : null}

        {item.status === "live" && item.earned !== undefined ? (
          <span
            className="text-[13.5px] font-bold text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]"
          >
            {formatNaira(item.earned)} earned
          </span>
        ) : null}

        {item.isFirstUpload ? (
          <span className="text-[13px] text-[var(--text-muted)]">Your first upload</span>
        ) : null}
      </span>
    </button>
  );
}

export interface ContentGridCardProps {
  state: "locked" | "free";
  title: string;
  price?: number;
  contentType: string;
  count?: string;
  ratio?: string;
  onClick?: () => void;
}

/** Fan-facing grid tile: square art with lock veil, title, type + price. */
export function ContentGridCard({
  state,
  title,
  price,
  contentType,
  count,
  ratio = "1 / 1",
  onClick,
}: ContentGridCardProps) {
  const locked = state === "locked";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col gap-[10px] p-0 border-[none] bg-transparent text-left [font-family:var(--font-sans)] ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <span
        className="relative rounded-[var(--radius-media)] bg-[repeating-linear-gradient(135deg,_var(--surface-tag)_0_12px,_var(--surface-card)_12px_24px)] border border-[var(--border-hairline)] overflow-hidden w-full" style={{aspectRatio: ratio}}
      >
        {locked ? (
          <span
            className="absolute inset-0 bg-[var(--locked-veil)] grid place-items-center"
          >
            <Icon name="Lock" size={16} strokeWidth={2.2} color="#fff" />
          </span>
        ) : null}
      </span>
      <span className="flex flex-col gap-[3px]">
        <span
          className="text-[14.5px] font-semibold leading-[1.3] text-[var(--text-primary)] whitespace-nowrap overflow-hidden text-ellipsis"
        >
          {title}
        </span>
        <span className="flex items-center gap-[7px]">
          <span className="text-[12.5px] text-[var(--text-muted)] font-medium">
            {count ?? contentType}
          </span>
          <PriceChip amount={price} free={!locked && price === undefined} />
        </span>
      </span>
    </button>
  );
}
