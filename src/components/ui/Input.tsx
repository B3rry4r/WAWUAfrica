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
   * Fixed text shown inside the field, before what the person types, e.g.
   * "instagram.com/". It is a LABEL, not a value: it is never submitted and
   * never selectable, so the field still holds only the handle.
   *
   * The point is that somebody looking at the field can see it wants a
   * username, without reading a hint underneath it.
   */
  prefix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, prefix, className = "", id, ...rest },
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
      {/*
        With a prefix the BORDER moves to the wrapper and the input keeps none
        of its own, so the fixed text and the field read as one control rather
        than a label sitting beside a box. Focus is mirrored onto the wrapper
        with focus-within for the same reason.
      */}
      <div
        className={[
          "relative flex items-center",
          prefix
            ? [
                "h-[52px] w-full rounded-input border bg-input transition-colors",
                "focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20",
                error ? "border-danger" : "border-hairline",
              ].join(" ")
            : "",
        ].join(" ")}
      >
        {icon ? (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
            <Icon name={icon} size={16} color="var(--text-muted)" />
          </span>
        ) : null}
        {prefix ? (
          <span
            aria-hidden="true"
            className={`pointer-events-none shrink-0 select-none text-[15px] text-text-muted ${icon ? "pl-11" : "pl-4"}`}
          >
            {prefix}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          className={
            prefix
              ? "h-full min-w-0 flex-1 border-0 bg-transparent pl-1 pr-4 text-[15px] text-text-primary outline-none placeholder:text-text-disabled"
              : [
                  "h-[52px] w-full rounded-input border bg-input text-text-primary placeholder:text-text-disabled",
                  "px-4 text-[15px] outline-none transition-colors",
                  "focus:border-accent focus:ring-2 focus:ring-accent/20",
                  icon ? "pl-11" : "",
                  error ? "border-danger" : "border-hairline",
                ].join(" ")
          }
          {...rest}
        />
      </div>
      {error ? <span className="text-[12.5px] text-danger">{error}</span> : null}
      {!error && hint ? <span className="text-[12px] text-text-muted">{hint}</span> : null}
    </div>
  );
});