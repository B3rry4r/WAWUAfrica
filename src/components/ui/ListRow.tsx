import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export interface ListRowProps {
  title: string;
  subtitle?: ReactNode;
  icon?: IconName;
  iconColor?: string;
  meta?: ReactNode;
  onClick?: () => void;
  showChevron?: boolean;
}

export function ListRow({
  title,
  subtitle,
  icon,
  iconColor = "var(--text-secondary)",
  meta,
  onClick,
  showChevron = false,
}: ListRowProps) {
  const row = (
    <div
      className="flex items-center gap-[12px] py-[14px] px-[16px] bg-[var(--surface-card)] border border-[var(--border-hairline)] rounded-[var(--radius-card)]"
    >
      {icon ? (
        <span
          className="grid place-items-center w-[42px] h-[42px] rounded-[13] bg-[var(--surface-tag)] border border-[var(--border-hairline)] shrink-0"
        >
          <Icon name={icon} size={18} stroke={2} color={iconColor} />
        </span>
      ) : null}
      <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
        <span className="text-[14.5px] font-semibold text-[var(--text-primary)] leading-[1.3]">
          {title}
        </span>
        {subtitle ? (
          <span className="text-[12.5px] text-[var(--text-muted)] leading-[1.4]">{subtitle}</span>
        ) : null}
      </div>
      {meta ? (
        <span className="text-[13px] font-semibold text-[var(--accent)] shrink-0">{meta}</span>
      ) : null}
      {showChevron ? <Icon name="ChevronRight" size={18} stroke={2} color="var(--text-muted)" /> : null}
    </div>
  );

  if (!onClick) return row;

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full p-0 border-[none] bg-transparent cursor-pointer text-left" style={{fontFamily: "var(--font-sans)"}}
    >
      {row}
    </button>
  );
}
