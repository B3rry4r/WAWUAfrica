"use client";

import { useRouter } from "next/navigation";
import { Icon } from "./Icon";

/**
 * A back control for any screen reached from somewhere else.
 *
 * Most sub-screens had no way back at all: the bottom bar only covers its five
 * destinations, and on desktop there is no bottom bar, so screens like
 * Earnings, Purchases and the creator Dashboard were dead ends unless you used
 * the browser's own button.
 *
 * `label` names where you are going back to when that is knowable; otherwise
 * it just says Back, which is honest about `router.back()` returning to
 * whatever you came from.
 */
export function BackLink({ label = "Back", className = "" }: { label?: string; className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={`inline-flex h-9 items-center gap-1.5 self-start rounded-full border border-hairline bg-card pl-2 pr-3.5 text-[13.5px] font-medium text-text-secondary transition-colors hover:bg-[rgba(255,255,255,0.06)] hover:text-text-primary ${className}`}
    >
      <Icon name="ChevronLeft" size={17} color="currentColor" strokeWidth={2.2} />
      {label}
    </button>
  );
}
