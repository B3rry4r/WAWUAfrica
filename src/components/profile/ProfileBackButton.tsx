"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

/**
 * Back control for screens that put their title in the page body rather than
 * in a FlowHeader bar: the profile cover, and the settings-style screens
 * (/privacy, /about, /terms, the service detail pages).
 *
 * Two things were wrong with it and both are fixed here.
 *
 * 1. It was drawn entirely with `style={{}}` and two hardcoded rgba colours,
 *    which CLAUDE.md rules out — `rgba(11,10,13,0.62)` is already a token
 *    (`--locked-veil`), and the compact variant's surface is `--surface-tag`.
 * 2. Its 34px box matches FlowHeader's back control exactly, which is what
 *    makes a title sitting beside it land on the same axis as a title in a
 *    FlowHeader bar. Keep those two in step; they are the same control in two
 *    places, and drifting them apart is how the back-vs-title alignment
 *    complaints started.
 *
 * The caller is responsible for `items-center` on the row it sits in — that,
 * plus the identical 34px box, is the whole alignment contract.
 *
 * WHICH VARIANT. The default one is absolutely positioned at the top-left of
 * its container, which is right for the profile screen, where it floats over
 * a cover photo. A screen with no cover has nothing for it to float over, so
 * it lands on whatever is at the top of the page: the services screens put
 * their eyebrow there and it covered the first few letters, so "BILLS
 * PAYMENT" read as "S PAYMENT" and "LEGAL" as "GAL". Those screens pass
 * `compact` and put it in the eyebrow row. Floating is for a cover image;
 * everything else takes the compact one.
 */
export function ProfileBackButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      aria-label="Back"
      className={
        compact
          ? "grid h-[34px] w-[34px] shrink-0 cursor-pointer place-items-center rounded-full border border-hairline bg-tag text-text-primary transition-colors hover:border-strong hover:bg-surface-hover active:bg-surface-press"
          : "absolute left-[14px] top-[14px] z-[5] grid h-[34px] w-[34px] cursor-pointer place-items-center rounded-full border border-strong bg-[var(--locked-veil)] text-on-accent [backdrop-filter:var(--blur-chrome)]"
      }
    >
      <Icon name="ChevronLeft" size={18} color="currentColor" strokeWidth={2.2} />
    </button>
  );
}
