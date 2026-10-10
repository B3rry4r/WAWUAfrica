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
  /**
   * 16px text below the desktop breakpoint. iPhone Safari zooms the whole page
   * when a field under 16px takes focus, which on a payment form throws the
   * person off the field they were typing in. Off by default: the design's
   * 15px field is unchanged for every existing screen.
   */
  noZoom?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, shape = "input", noZoom = false, className = "", id, "aria-describedby": describedBy, ...rest },
  ref,
) {
  // Falls back to a generated id when neither `id` nor `name` is passed —
  // without this, <label htmlFor> had nothing to point at and every such
  // field lost its accessible-name association (screen readers, and
  // Playwright/Testing-Library's getByLabel, couldn't find the input).
  const generatedId = useId();
  const inputId = id ?? rest.name ?? generatedId;
  // The message under the field is tied to the field itself, so a screen reader
  // reads it with the field and the field reports itself as invalid.
  const messageId = `${inputId}-message`;
  const described = [describedBy, error || hint ? messageId : undefined].filter(Boolean).join(" ") || undefined;
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
            noZoom ? "px-4 text-[16px] dt:text-[15px] outline-none transition-colors" : "px-4 text-[15px] outline-none transition-colors",
            "focus:border-accent focus:ring-2 focus:ring-accent/20",
            icon ? "pl-11" : "",
            error ? "border-danger" : "border-hairline",
          ].join(" ")}
          aria-invalid={error ? true : undefined}
          aria-describedby={described}
          {...rest}
        />
      </div>
      {error ? (
        <span id={messageId} className="text-[12.5px] text-danger">
          {error}
        </span>
      ) : null}
      {!error && hint ? (
        <span id={messageId} className="text-[12px] text-text-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
});