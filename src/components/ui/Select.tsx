import { forwardRef, useId } from "react";
import type { SelectHTMLAttributes } from "react";
import { Icon } from "./Icon";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  hint?: string;
  options: readonly SelectOption[];
  /** The line shown while nothing is chosen. Leave out when the value always holds a choice. */
  placeholder?: string;
}

/**
 * A native `<select>` drawn like an Input: the same height, radius, border,
 * label, hint and error line. The browser's own list opens on tap, which is
 * the right control on a phone and still fine with a keyboard.
 *
 * This is the markup the verification flow and the sign-up form each wrote
 * out by hand; it is one component now so a wallet form does not write a
 * third copy.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, options, placeholder, className = "", id, ...rest },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? rest.name ?? generatedId;
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label ? (
        <label htmlFor={selectId} className="text-[13px] font-semibold text-text-secondary">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          className={[
            "h-[52px] w-full cursor-pointer appearance-none border bg-input pl-4 pr-[42px] text-[15px] text-text-primary",
            "rounded-input outline-none transition-colors",
            "focus:border-accent focus:ring-2 focus:ring-accent/20",
            error ? "border-danger" : "border-hairline",
          ].join(" ")}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
          <Icon name="ChevronDown" size={16} strokeWidth={2.2} color="var(--text-muted)" />
        </span>
      </div>
      {error ? <span className="text-[12.5px] text-danger">{error}</span> : null}
      {!error && hint ? <span className="text-[12px] text-text-muted">{hint}</span> : null}
    </div>
  );
});
