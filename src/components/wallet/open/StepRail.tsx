import { Icon } from "@/components/ui";
import type { StepLabel } from "@/lib/wallet-opening";

export interface StepRailProps {
  steps: StepLabel[];
  /** The step the person is on, as an index into `steps`. */
  current: number;
}

/**
 * Where the person is in opening a wallet.
 *
 * On a phone it is one thin segmented bar over a line that names the step
 * ("Step 2 of 4, Documents"). From `xl` up the same steps are drawn as a row
 * with a numbered dot each, finished ones ticked, so the whole route can be
 * read at once. Both draw the same facts; nothing here is a control.
 */
export function StepRail({ steps, current }: StepRailProps) {
  const at = Math.min(Math.max(current, 0), steps.length - 1);
  return (
    <nav aria-label="Steps to open your wallet" className="px-[20px] pt-[16px] xl:px-0 xl:pt-[24px]">
      <div className="flex flex-col gap-[8px] xl:hidden">
        <div className="flex gap-[5px]" aria-hidden="true">
          {steps.map((s, i) => (
            <span
              key={s.id}
              className={`h-[4px] flex-1 rounded-full ${i <= at ? "bg-[var(--accent)]" : "bg-[var(--surface-tag)]"}`}
            />
          ))}
        </div>
        <span className="text-[12.5px] font-semibold text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">
          Step {at + 1} of {steps.length}
          <span className="text-[var(--text-secondary)]"> · {steps[at].label}</span>
        </span>
      </div>

      <ol className="hidden items-center xl:flex">
        {steps.map((s, i) => {
          const done = i < at;
          const here = i === at;
          return (
            <li key={s.id} className="flex flex-1 items-center last:flex-none" aria-current={here ? "step" : undefined}>
              <span className="flex items-center gap-[10px]">
                <span
                  className={[
                    "grid h-[28px] w-[28px] shrink-0 place-items-center rounded-full border text-[12.5px] font-bold [font-feature-settings:var(--font-feature-tabular)]",
                    done
                      ? "border-transparent bg-[var(--accent)] text-[var(--text-on-accent)]"
                      : here
                        ? "border-[var(--border-selected)] bg-[var(--selected-tint)] text-[var(--selected-text)]"
                        : "border-hairline bg-[var(--surface-tag)] text-[var(--text-muted)]",
                  ].join(" ")}
                >
                  {done ? <Icon name="Check" size={14} strokeWidth={3} /> : i + 1}
                </span>
                <span
                  className={`text-[13.5px] font-semibold ${here ? "text-[var(--text-primary)]" : done ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"}`}
                >
                  {s.label}
                </span>
              </span>
              {i < steps.length - 1 ? (
                <span className={`mx-[14px] h-[2px] flex-1 rounded-full ${done ? "bg-[var(--accent)]" : "bg-[var(--surface-tag)]"}`} aria-hidden="true" />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
