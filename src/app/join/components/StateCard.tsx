import type { ReactNode } from "react";
import { Icon } from "@/components/ui";
import type { IconName } from "@/components/ui";

type Tone = "neutral" | "success" | "warning" | "danger" | "info";

const TONES: Record<Tone, { tile: string; color: string }> = {
  neutral: { tile: "bg-tag", color: "var(--text-secondary)" },
  success: { tile: "bg-success-tint", color: "var(--success)" },
  warning: { tile: "bg-warning-tint", color: "var(--warning)" },
  danger: { tile: "bg-danger-tint", color: "var(--danger)" },
  info: { tile: "bg-info-tint", color: "var(--info)" },
};

interface StateCardProps {
  icon: IconName;
  tone?: Tone;
  /** Turns the icon, for "working on it" screens. */
  spin?: boolean;
  title: string;
  children?: ReactNode;
  /** The way out: buttons or a link. Every state that stops the person has one. */
  actions?: ReactNode;
  /** Lets the body run the card's full width instead of a short line length (the launch access code screen). */
  wide?: boolean;
}

/**
 * One screen of /join that is not the form: an icon, a heading, a few plain
 * words and the way forward. Every refusal and every wait on this page is one
 * of these, so they read the same and none of them is a dead end.
 *
 * `role="status"` makes a screen reader announce the change when the page
 * swaps from the form to "Checking your payment" or "You're registered".
 */
export function StateCard({ icon, tone = "neutral", spin = false, title, children, actions, wide = false }: StateCardProps) {
  const t = TONES[tone];
  return (
    <section
      role="status"
      aria-live="polite"
      className="flex flex-col items-center gap-4 rounded-card border border-hairline bg-card px-6 py-9 text-center dt:px-9 dt:py-11"
    >
      <span className={`grid h-[60px] w-[60px] place-items-center rounded-full ${t.tile}`}>
        <Icon
          name={icon}
          size={26}
          strokeWidth={2}
          color={t.color}
          className={spin ? "[animation:wawuSpin_900ms_linear_infinite]" : undefined}
        />
      </span>
      <h1 className="m-0 max-w-full break-words text-[22px] font-bold leading-tight tracking-[-0.02em] text-text-primary [overflow-wrap:anywhere] dt:text-[26px]">
        {title}
      </h1>
      {children ? (
        <div
          className={`flex ${wide ? "w-full" : "max-w-[40ch]"} flex-col gap-3 break-words text-[14.5px] leading-[1.55] text-text-secondary`}
        >
          {children}
        </div>
      ) : null}
      {actions ? <div className="mt-2 flex w-full flex-col gap-2.5">{actions}</div> : null}
    </section>
  );
}
