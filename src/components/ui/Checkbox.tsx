import { useId } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Icon } from "./Icon";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> {
  /** The sentence beside the box. May hold links; the rest of the line still toggles. */
  label: ReactNode;
  /** Shown in red under the sentence. Also turns the empty box's outline red. */
  error?: string;
}

/**
 * A real checkbox with a drawn box.
 *
 * The input is visually hidden but stays in the tab order and the accessibility
 * tree (so a screen reader says "checkbox, checked", and Playwright's
 * `getByRole("checkbox")` finds it); the box beside it is the picture. The
 * whole line is the label, so the tap target is the full width, while a link
 * inside the label keeps its own tap.
 */
export function Checkbox({ label, error, checked, className = "", id, ...rest }: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* The row is at least 44px tall: a thumb has to hit it without care. */}
      <label htmlFor={inputId} className="flex min-h-[44px] cursor-pointer items-start gap-[11px] py-[9px] text-left">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? messageId : undefined}
          className="peer sr-only"
          {...rest}
        />
        <span
          aria-hidden="true"
          className={[
            "grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[7px]",
            "peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus-ring)]",
            checked ? "bg-accent" : error ? "border-[1.5px] border-danger bg-transparent" : "border-[1.5px] border-strong bg-transparent",
          ].join(" ")}
        >
          {checked ? <Icon name="Check" size={14} color="var(--text-on-accent)" strokeWidth={3} /> : null}
        </span>
        <span className="text-[13.5px] leading-normal text-text-secondary">{label}</span>
      </label>
      {error ? (
        <span id={messageId} className="pl-[33px] text-[12.5px] text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
