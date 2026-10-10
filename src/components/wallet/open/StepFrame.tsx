import type { ReactNode } from "react";

export interface StepFrameProps {
  children: ReactNode;
  /** The actions under the step: its one primary button, then any quieter ones. */
  footer?: ReactNode;
  /** The bottom bar sticks to the foot of the window on a phone while a long form scrolls under it. */
  stickyFooter?: boolean;
}

/**
 * The body and the foot of one step, the same shape the verification flow
 * uses: a padded column, then a hairline-topped bar holding the actions.
 */
export function StepFrame({ children, footer, stickyFooter = false }: StepFrameProps) {
  return (
    <>
      <div className="flex flex-1 flex-col gap-[18px] px-[20px] pb-[32px] pt-[20px] xl:px-0">{children}</div>
      {footer ? (
        <div
          className={[
            "flex flex-col gap-[10px] border-t border-t-[var(--border-hairline)] px-[16px] pb-[24px] pt-[14px] xl:px-0",
            stickyFooter ? "sticky bottom-0 z-20 bg-[var(--surface-chrome)] [backdrop-filter:var(--blur-chrome)]" : "",
          ].join(" ")}
        >
          {footer}
        </div>
      ) : null}
    </>
  );
}
