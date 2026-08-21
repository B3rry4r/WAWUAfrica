"use client";

import { useRouter } from "next/navigation";
import { Icon } from "../ui/Icon";

export interface FlowHeaderProps {
  title: string;
  right?: React.ReactNode;
  onBack?: () => void;
  backLabel?: string;
}

/** Wizard/flow header: round back control, title, optional right slot. */
export function FlowHeader({ title, right, onBack, backLabel = "Back" }: FlowHeaderProps) {
  const router = useRouter();
  const back = onBack ?? (() => router.back());

  return (
    <header
      className="flex items-center gap-[12px] py-[14px] px-[16px] border-b border-b-[var(--border-hairline)]"
    >
      <button
        type="button"
        onClick={back}
        aria-label={backLabel}
        className="grid place-items-center w-[34px] h-[34px] rounded-[999px] bg-[var(--surface-tag)] border border-[var(--border-hairline)] text-[var(--text-primary)] cursor-pointer shrink-0 hover:bg-surface-hover hover:border-strong active:bg-surface-press"
      >
        <Icon name="ChevronLeft" size={18} strokeWidth={2.2} />
      </button>
      <span
        className="flex-1 min-w-0 text-[16px] font-semibold text-[var(--text-primary)] whitespace-nowrap overflow-hidden text-ellipsis"
      >
        {title}
      </span>
      {right ?? <span className="w-[34px]" />}
    </header>
  );
}
