import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export interface SectionHeaderProps {
  title: string;
  /** Eyebrow line above the title (the design file calls it "caption"). */
  caption?: string;
  eyebrow?: string;
  action?: ReactNode | string;
  onAction?: () => void;
  icon?: IconName;
}

export function SectionHeader({ title, caption, eyebrow, action, onAction, icon }: SectionHeaderProps) {
  const label = eyebrow ?? caption;
  return (
    <div className="flex items-center gap-[12px] mb-[12px]">
      {icon ? (
        <span
          className="grid place-items-center w-[34px] h-[34px] rounded-[10] bg-[var(--accent-tint)] border border-[var(--border-accent)] shrink-0"
        >
          <Icon name={icon} size={16} stroke={2} color="var(--accent)" />
        </span>
      ) : null}
      <div className="flex-1 min-w-0 flex flex-col gap-[2px]">
        {label ? (
          <span
            className="text-[11px] font-bold tracking-[0.06em] uppercase text-[var(--text-muted)]"
          >
            {label}
          </span>
        ) : null}
        <h2
          className="m-0 text-[17px] font-bold tracking-[-0.01em] text-[var(--text-primary)]"
        >
          {title}
        </h2>
      </div>
      {typeof action === "string" ? (
        <button
          type="button"
          onClick={onAction}
          className="bg-transparent border-[none] p-0 text-[13.5px] font-semibold text-[var(--accent)] cursor-pointer" style={{fontFamily: "var(--font-sans)"}}
        >
          {action}
        </button>
      ) : (
        action
      )}
    </div>
  );
}
