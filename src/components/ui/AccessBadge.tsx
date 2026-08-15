import type { ReactNode } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

interface AccessBadgeProps {
  icon?: IconName;
  children: ReactNode;
}

export function AccessBadge({ icon = "TrendingUp", children }: AccessBadgeProps) {
  return (
    <span className="inline-flex h-[30px] items-center gap-1.5 rounded-full border border-accent bg-accent-tint px-[13px] text-[12px] font-semibold text-accent-hover">
      <Icon name={icon} size={14} strokeWidth={2.2} />
      {children}
    </span>
  );
}