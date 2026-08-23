import type { ReactNode } from "react";

export type PageColumnWidth = "reading" | "wide" | "full";

const WIDTH: Record<PageColumnWidth, string> = {
  /** Prose, forms, settings lists — anything read left-to-right one line at a time. */
  reading: "xl:mx-auto xl:w-full xl:max-w-[860px]",
  /** Card grids and dashboards that genuinely use the extra width. */
  wide: "xl:mx-auto xl:w-full xl:max-w-[1120px]",
  /** Opt out. For a screen that manages its own desktop composition. */
  full: "",
};

export interface PageColumnProps {
  children: ReactNode;
  width?: PageColumnWidth;
  /** Extra classes for the column itself (gap, extra padding). */
  className?: string;
  /** Vertical rhythm between children. Defaults to the app's 18px stack. */
  gap?: string;
}

/**
 * The content column every routed screen sits in.
 *
 * WHY THIS EXISTS. Screens were each hand-writing
 * `p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[860px] xl:p-[30px_28px_64px]`
 * on their outer div. That string is long, it is easy to get right on the
 * loading branch and forget on the success branch, and that is exactly what
 * kept happening: /privacy and /services/cac both cap their skeleton and then
 * render the real screen full-bleed. At 1280px the sidebar leaves a 1036px
 * column, so "forgot the cap" means a phone layout stretched across a
 * thousand pixels — list rows with the toggle a thousand pixels from its
 * label, a primary button a thousand pixels wide. Every "why is this a
 * stretched mobile view on desktop" report in this project has been that.
 *
 * One component, one place to change the measure, and no way to apply it to
 * three branches out of four.
 *
 * Mobile is untouched: the padding below is the same 14/16/96 every screen
 * already used, and the cap only exists at `xl` (1024px here — see
 * tailwind.config.ts).
 */
export function PageColumn({ children, width = "reading", className = "", gap = "gap-[18px]" }: PageColumnProps) {
  return (
    <div className={`flex flex-col ${gap} p-[14px_16px_96px] ${WIDTH[width]} xl:p-[30px_28px_64px] ${className}`}>
      {children}
    </div>
  );
}
