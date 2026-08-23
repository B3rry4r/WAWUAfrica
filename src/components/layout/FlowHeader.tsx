"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Icon } from "../ui/Icon";

export interface FlowHeaderProps {
  title: string;
  right?: React.ReactNode;
  onBack?: () => void;
  backLabel?: string;
  /**
   * Stick to the top of the scroll container with the app's chrome blur —
   * what ScreenHeader used to be a whole second copy of this component for.
   */
  sticky?: boolean;
  /** Drop the back control (a screen that is a nav destination, not a sub-screen). */
  back?: boolean;
  /**
   * Navigate back to a known route instead of `router.back()`. Renders a real
   * link (so middle-click and right-click work), and lets a SERVER component
   * use this bar without needing a click handler.
   */
  backHref?: string;
  /** Extra classes on the bar itself — e.g. `hidden dt:flex` for a desktop-only header. */
  className?: string;
}

/**
 * The one back/title bar. Wizards, flows and sub-screens all use this.
 *
 * GEOMETRY IS DELIBERATE AND SHARED. Headers across the app were measured at
 * 68px (DesktopHeader), 65px (AppHeader), 63px (this), 61px (the inbox's own)
 * and 54px (the purchases tab strip), with title left edges landing anywhere
 * between 270px and 590px on the same 1280px screen. That is the "headers are
 * not in alignment" report. At `dt` this bar is now the same 68px tall with
 * the same 26px side padding as DesktopHeader, so a screen that swaps one for
 * the other does not move by 5px, and the title sits at the same inset as the
 * page content beneath it.
 *
 * The back control and the title share one flex row and are centred on the
 * same axis — `items-center` on the row, no vertical offsets on either child.
 * That is the fix for "left back buttons not in alignment with titles": the
 * screens that got it wrong were the ones drawing a standalone back pill in a
 * block ABOVE their title instead of using this.
 */
/**
 * 34px round control. Same box as ProfileBackButton's compact variant on
 * purpose — a title sitting beside either of them lands on the same axis.
 */
const backControl =
  "grid h-[34px] w-[34px] shrink-0 cursor-pointer place-items-center rounded-full border border-hairline bg-tag text-text-primary transition-colors hover:border-strong hover:bg-surface-hover active:bg-surface-press";

export function FlowHeader({
  title,
  right,
  onBack,
  backLabel = "Back",
  sticky = false,
  back = true,
  backHref,
  className = "",
}: FlowHeaderProps) {
  const router = useRouter();
  const goBack = onBack ?? (() => router.back());

  return (
    <header
      className={[
        "flex shrink-0 items-center gap-[12px] border-b border-b-hairline px-[16px] py-[14px]",
        "dt:h-[68px] dt:gap-[14px] dt:px-[26px] dt:py-0",
        sticky ? "sticky top-0 z-30 bg-[var(--surface-chrome)] [backdrop-filter:var(--blur-chrome)]" : "",
        className,
      ].join(" ")}
    >
      {back ? (
        backHref ? (
          <Link href={backHref} aria-label={backLabel} className={backControl}>
            <Icon name="ChevronLeft" size={18} strokeWidth={2.2} />
          </Link>
        ) : (
          <button type="button" onClick={goBack} aria-label={backLabel} className={backControl}>
            <Icon name="ChevronLeft" size={18} strokeWidth={2.2} />
          </button>
        )
      ) : null}
      <span className="min-w-0 flex-1 truncate text-[16px] font-semibold text-text-primary dt:text-[19px] dt:tracking-[-0.02em]">
        {title}
      </span>
      {right ?? (back ? <span className="w-[34px] shrink-0" /> : null)}
    </header>
  );
}
