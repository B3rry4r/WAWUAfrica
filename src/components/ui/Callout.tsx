import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export type CalloutTone = "neutral" | "info" | "warning" | "danger" | "success";

export interface CalloutProps {
  /** Leading icon. Defaults to the tone's own icon. */
  icon?: IconName;
  /** Optional bold first line. Omit for a single-sentence notice. */
  title?: string;
  children: ReactNode;
  tone?: CalloutTone;
  /**
   * Let the notice run the full width of its container.
   *
   * Off by default, and deliberately so: this shape is a short sentence, and a
   * short sentence stretched across a 1000px desktop column reads as an empty
   * bar, not as a notice. The cap is a MEASURE (characters of text), not a
   * pixel width, so it keeps the same reading rhythm at every breakpoint and
   * still fills a phone. Pass this only when the notice genuinely sits inside
   * a narrow rail or a form column that is already capped.
   */
  full?: boolean;
  className?: string;
}

const TONES: Record<CalloutTone, { icon: IconName; surface: string; iconColor: string }> = {
  neutral: { icon: "Info", surface: "border-hairline bg-card", iconColor: "var(--text-muted)" },
  info: { icon: "Info", surface: "border-info bg-[var(--info-tint)]", iconColor: "var(--info)" },
  warning: { icon: "TriangleAlert", surface: "border-warning bg-[var(--warning-tint)]", iconColor: "var(--warning)" },
  danger: { icon: "TriangleAlert", surface: "border-danger bg-[var(--danger-tint)]", iconColor: "var(--danger)" },
  success: { icon: "Check", surface: "border-success bg-[var(--success-tint)]", iconColor: "var(--success)" },
};

/**
 * The short standing notice that sits beside content: "this is not switched on
 * yet", "your BVN is never shown", "paying happens in the other app".
 *
 * This existed as hand-written markup in a dozen screens, each repeating the
 * same row (icon, then one or two lines) and several inventing their own
 * `rgba(...)` border to tint it — both of which CLAUDE.md rules out. It is one
 * component with a `tone` prop instead, and every tint comes from a token.
 *
 * It is capped by default. Every reported "stretched full-width bar on
 * desktop" in this app was one of these: forty words of copy laid across the
 * whole content column, which at 1280px is a 1000px-wide, 47px-tall rectangle
 * with a sentence floating in the middle of it. See `full` for the exception.
 */
export function Callout({ icon, title, children, tone = "neutral", full = false, className = "" }: CalloutProps) {
  const t = TONES[tone];
  return (
    <div
      className={`flex items-start gap-[10px] rounded-input border px-[14px] py-[13px] ${t.surface} ${
        full ? "" : "max-w-[76ch]"
      } ${className}`}
    >
      <span className="mt-[1px] shrink-0">
        <Icon name={icon ?? t.icon} size={15} color={t.iconColor} strokeWidth={2} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
        {title ? <span className="text-[13px] font-semibold text-text-primary">{title}</span> : null}
        <span className="text-[12.5px] leading-[1.5] text-text-secondary">{children}</span>
      </span>
    </div>
  );
}
