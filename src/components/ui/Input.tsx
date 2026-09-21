import { forwardRef, useId } from "react";
import type { InputHTMLAttributes } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: IconName;
  /**
   * Field radius. "input" (default) is the 14px form field every wizard and
   * settings screen uses. "pill" is the fully rounded SEARCH field the
   * approved Services design draws over its hero banner
   * (refs/mobile/ref-services.png), where a 14px box inside a rounded card
   * reads as a form the person has to fill in rather than a search they can
   * type into. A prop rather than a second component: see CLAUDE.md, never
   * fork a component.
   */
  shape?: "input" | "pill";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, shape = "input", className = "", id, ...rest },
  ref,
) {
  // Falls back to a generated id when neither `id` nor `name` is passed —
  // without this, <label htmlFor> had nothing to point at and every such
  // field lost its accessible-name association (screen readers, and
  // Playwright/Testing-Library's getByLabel, couldn't find the input).
  const generatedId = useId();
  const inputId = id ?? rest.name ?? generatedId;
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label ? (
        <label htmlFor={inputId} className="text-[13px] font-semibold text-text-secondary">
          {label}
        </label>
      ) : null}
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
            <Icon name={icon} size={16} color="var(--text-muted)" />
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={[
            "h-[52px] w-full border bg-input text-text-primary placeholder:text-text-disabled",
            shape === "pill" ? "rounded-[var(--radius-chip)]" : "rounded-input",
            "px-4 text-[15px] outline-none transition-colors",
            "focus:border-accent focus:ring-2 focus:ring-accent/20",
            icon ? "pl-11" : "",
            error ? "border-danger" : "border-hairline",
          ].join(" ")}
          {...rest}
        />
      </div>
      {error ? <span className="text-[12.5px] text-danger">{error}</span> : null}
      {!error && hint ? <span className="text-[12px] text-text-muted">{hint}</span> : null}
    </div>
  );
});