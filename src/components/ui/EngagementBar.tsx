"use client";
import { useState } from "react";
import { Icon, type IconName } from "./Icon";
import { cn } from "@/lib/cn";

/**
 * Comment, share, save, rate — the engagement row under a content piece.
 * Carried over from the retired post feed and re-parented to content.
 */
export function EngagementBar({
  comments = 0,
  rating,
  saved = false,
  onComment,
  onShare,
  onSave,
  onRate,
  className,
}: {
  comments?: number;
  rating?: number;
  saved?: boolean;
  onComment?: () => void;
  onShare?: () => void;
  onSave?: () => void;
  onRate?: () => void;
  className?: string;
}) {
  const [isSaved, setSaved] = useState(saved);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <Item icon="MessageCircle" label={String(comments)} onClick={onComment} />
      {rating !== undefined && (
        <Item icon="Star" label={rating.toFixed(1)} onClick={onRate} />
      )}
      <Item icon="Share2" onClick={onShare} />
      <Item
        icon="Bookmark"
        active={isSaved}
        onClick={() => {
          setSaved((v) => !v);
          onSave?.();
        }}
      />
    </div>
  );
}

function Item({
  icon,
  label,
  onClick,
  active,
}: {
  icon: IconName;
  label?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-[38px] items-center gap-[7px] rounded-full px-[13px]",
        "text-[13px] font-semibold transition-colors duration-[var(--dur-fast)]",
        active
          ? "bg-[var(--accent-tint)] text-[var(--accent-hover)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--surface-tag)]"
      )}
    >
      <Icon name={icon} size={17}  />
      {label && <span className="[font-variant-numeric:tabular-nums]">{label}</span>}
    </button>
  );
}
