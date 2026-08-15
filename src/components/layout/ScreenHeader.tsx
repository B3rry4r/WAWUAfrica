"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

/** Sub-screen header: back chevron + centered title + optional right slot. */
export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-30 flex items-center gap-[12px] border-b border-[var(--border-hairline)] bg-[rgba(19,19,22,0.86)] p-[14px_16px] [backdrop-filter:var(--blur-chrome)]">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Back"
        className="grid h-[34px] w-[34px] shrink-0 cursor-pointer place-items-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface-tag)]"
      >
        <Icon name="ChevronLeft" size={18} color="var(--text-primary)" strokeWidth={2.2} />
      </button>
      <span className="flex-1 text-[16px] font-semibold text-[var(--text-primary)]">{title}</span>
      {right}
    </div>
  );
}
