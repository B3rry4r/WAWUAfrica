import type { ReactNode } from "react";

/** The three widths the desktop designs use for the list pane (D8, D14, D17). */
export type ThreePaneListWidth = 320 | 340 | 360;

const LIST_WIDTH_CLASS: Record<ThreePaneListWidth, string> = {
  320: "xl:w-[320px]",
  340: "xl:w-[340px]",
  360: "xl:w-[360px]",
};

interface ThreePaneLayoutProps {
  /** Width of the middle list pane. Defaults to 360 (design D8/D14/D17 vary this per screen). */
  listWidth?: ThreePaneListWidth;
  /** Optional content pinned above the scrolling list (e.g. a filter row or tab strip). */
  listHeader?: ReactNode;
  /** The list pane's items — the calling screen owns its own item renderer and states. */
  list: ReactNode;
  /** The right-hand detail pane — the calling screen owns loading/empty/error/selected states. */
  detail: ReactNode;
  /** Extra classes on the outer row (e.g. to control visibility together with a mobile-only sibling). */
  className?: string;
}

/**
 * Reusable "list beside detail" desktop pattern (design D8 Paid questions
 * inbox, D14 Communities, D17 Settings — sidebar-nav is handled by AppShell,
 * this only lays out the two panes to its right). Desktop-only by default
 * (`hidden … xl:flex`): render it alongside a screen's existing mobile JSX,
 * unconditionally — it stays invisible below the xl breakpoint on its own,
 * no extra wrapper needed.
 *
 * The calling screen supplies its own list-item renderer via `list` and its
 * own detail content via `detail`, including that pane's loading/empty/error
 * states — this component only owns the two-column shell and scroll
 * containers, never the content inside them.
 */
export function ThreePaneLayout({ listWidth = 360, listHeader, list, detail, className = "" }: ThreePaneLayoutProps) {
  return (
    <div className={`hidden min-h-0 xl:flex xl:flex-1 ${className}`}>
      <div className={`flex shrink-0 flex-col border-r border-hairline ${LIST_WIDTH_CLASS[listWidth]}`}>
        {listHeader}
        <div className="min-h-0 flex-1 overflow-y-auto">{list}</div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{detail}</div>
    </div>
  );
}
