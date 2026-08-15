import { Button } from "./Button";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  /** Optional action on the right (e.g. "Follow", "Join", "Watch"). */
  meta?: string;
  onAction?: () => void;
  trailing?: "none" | "chevron";
  onClick?: () => void;
}

/** One-line list row used across search, purchases and empty-state suggestions. */
export function ListRow({ title, subtitle, icon, meta, onAction, trailing = "chevron", onClick }: ListRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-tag/40"
    >
      {icon ? (
        <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[13px] bg-tag text-text-secondary">
          <Icon name={icon} size={18} strokeWidth={2} />
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-semibold text-text-primary">{title}</span>
        {subtitle ? <span className="mt-0.5 block truncate text-[12.5px] text-text-muted">{subtitle}</span> : null}
      </span>
      {meta ? (
        <span onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="secondary" onClick={onAction}>
            {meta}
          </Button>
        </span>
      ) : trailing === "chevron" ? (
        <Icon name="ChevronRight" size={17} color="var(--text-muted)" />
      ) : null}
    </button>
  );
}