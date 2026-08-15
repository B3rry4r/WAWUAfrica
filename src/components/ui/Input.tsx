import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: IconName;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, className = "", id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name;
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
            "h-[52px] w-full rounded-input border bg-input text-text-primary placeholder:text-text-disabled",
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