"use client";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
}

const VARIANT: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--text-on-accent)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-press)]",
  secondary:
    "bg-[var(--surface-elevated)] text-[var(--text-primary)] border border-[var(--border-hairline)]",
  ghost: "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
  danger: "bg-[var(--danger)] text-[var(--text-on-accent)]",
};

const SIZE: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px]",
  md: "h-11 px-4 text-[15px]",
  lg: "h-[var(--control-h)] px-5 text-[16px]",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth,
  loading,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] font-semibold",
        "transition-colors duration-[var(--dur-fast)] disabled:opacity-45 disabled:pointer-events-none",
        VARIANT[variant],
        SIZE[size],
        fullWidth && "w-full",
        className
      )}
    >
      {loading ? "…" : children}
    </button>
  );
}
