import { forwardRef, useId } from "react";
import type { SelectHTMLAttributes } from "react";
import { Icon } from "./Icon";

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  hint?: string;
  /** The choices, as plain strings (value and label are the same). */
  options: readonly string[];
  /** Shown as the first, empty choice. Leave out when a value is always required. */
  placeholder?: string;
}

/**
 * A native select drawn like Input: same height, radius, border and label.
 *
 * Native on purpose. On a phone the operating system's own picker is the best
 * list control there is (big rows, search by typing, no custom scroll), and a
 * custom dropdown would have to earn all of that back. The chevron is the only
 * thing drawn by hand, because `appearance-none` removes the browser's.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, hint, options, placeholder, className = "", id, ...rest },
  ref,
) {
  const generatedId = useId();
  const selectId = id ?? rest.name ?? generatedId;
  const empty = rest.value === "" || rest.value === undefined;
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
          className={[
            "h-[52px] w-full appearance-none rounded-input border bg-input pl-4 pr-11 text-[15px] outline-none transition-colors",
            "focus:border-accent focus:ring-2 focus:ring-accent/20",
            empty && placeholder ? "text-text-muted" : "text-text-primary",
            error ? "border-danger" : "border-hairline",
          ].join(" ")}
          {...rest}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <Icon
          name="ChevronDown"
          size={16}
          strokeWidth={2.2}
          color="var(--text-muted)"
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2"
        />
      </div>
      {error ? <span className="text-[12.5px] text-danger">{error}</span> : null}
      {!error && hint ? <span className="text-[12px] text-text-muted">{hint}</span> : null}
    </div>
  );
});
