"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

type ButtonSize = "sm" | "md" | "lg";
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const sizes: Record<ButtonSize, { height: number; fontSize: number; padding: string }> = {
  sm: { height: 38, fontSize: 13, padding: "0 18px" },
  md: { height: 52, fontSize: 14.5, padding: "0 24px" },
  lg: { height: 56, fontSize: 15, padding: "0 24px" },
};

const variants: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "var(--accent)",
    color: "var(--text-on-accent)",
    border: "1px solid transparent",
  },
  secondary: {
    background: "var(--surface-tag)",
    color: "var(--text-primary)",
    border: "1px solid var(--border-hairline)",
  },
  ghost: {
    background: "transparent",
    color: "var(--accent)",
    border: "1px solid transparent",
  },
  danger: {
    background: "var(--danger)",
    color: "var(--text-on-light)",
    border: "1px solid transparent",
  },
};

export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  size?: ButtonSize;
  variant?: ButtonVariant;
  full?: boolean;
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  children?: ReactNode;
}

export function Button({
  size = "md",
  variant = "primary",
  full = false,
  icon,
  iconRight,
  loading = false,
  disabled,
  children,
  style,
  ...rest
}: ButtonProps) {
  const v = variants[variant];
  const s = sizes[size];
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      disabled={isDisabled}
      className="inline-flex items-center justify-center gap-[9px] rounded-[var(--radius-button)] font-semibold leading-[1] whitespace-nowrap"
      style={{
        height: s.height,
        padding: s.padding,
        fontSize: s.fontSize,
        fontFamily: "var(--font-sans)",
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.55 : 1,
        transition: "background var(--dur-base) var(--ease-soft), transform var(--dur-fast) var(--ease-soft)",
        ...(full ? { width: "100%" } : {}),
        ...v,
        ...style,
      }}
      onMouseDown={(e) => {
        if (!isDisabled) {
          e.currentTarget.style.transform = "scale(var(--press-scale))";
        }
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "";
      }}
      {...rest}
    >
      {loading ? (
        <Icon name="Loader" size={Math.round(s.fontSize * 1.3)} stroke={2.2} color="currentColor" />
      ) : (
        <>
          {icon ? <Icon name={icon} size={Math.round(s.fontSize * 1.3)} stroke={2.2} color="currentColor" /> : null}
          {children}
          {iconRight ? <Icon name={iconRight} size={Math.round(s.fontSize * 1.3)} stroke={2.2} color="currentColor" /> : null}
        </>
      )}
    </button>
  );
}
