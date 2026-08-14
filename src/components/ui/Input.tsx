"use client";
import { cn } from "@/lib/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export function Input({ label, hint, error, className, id, ...rest }: InputProps) {
  const inputId = id ?? rest.name;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-medium text-[var(--text-secondary)]">
          {label}
        </label>
      )}
      <input
        {...rest}
        id={inputId}
        aria-invalid={!!error}
        className={cn(
          "h-[var(--control-h)] w-full rounded-[var(--radius-input)] bg-[var(--surface-input)] px-3",
          "text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
          "border outline-none transition-colors duration-[var(--dur-fast)]",
          error
            ? "border-[var(--danger)]"
            : "border-[var(--border-hairline)] focus:border-[var(--border-accent)]",
          className
        )}
      />
      {error ? (
        <p className="text-[12px] text-[var(--danger)]">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-[var(--text-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}
