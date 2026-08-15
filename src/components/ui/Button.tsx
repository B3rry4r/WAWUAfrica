import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import Link from "next/link";
import { Icon } from "./Icon";
import type { IconName } from "./Icon";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

interface BaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  full?: boolean;
  /** Shows a busy state and blocks interaction. */
  loading?: boolean;
  icon?: IconName;
  iconRight?: IconName;
  children?: ReactNode;
  className?: string;
}

type ButtonProps = (BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined }) | (BaseProps & { href: string });

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-accent text-on-accent hover:bg-accent-hover active:bg-accent-press",
  secondary: "bg-elevated text-text-primary border border-strong hover:bg-tag",
  ghost: "bg-transparent text-text-primary hover:bg-tag",
  danger: "bg-danger text-on-accent hover:opacity-90",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-[38px] px-[13px] text-[13px] font-semibold",
  md: "h-[48px] px-5 text-[14px] font-semibold",
  lg: "h-[56px] px-6 text-[15px] font-semibold",
};

function buttonClass(variant: ButtonVariant, size: ButtonSize, full: boolean, className: string) {
  return [
    "inline-flex items-center justify-center gap-2 rounded-button transition-all duration-200 select-none",
    "disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98]",
    variantClass[variant],
    sizeClass[size],
    full ? "w-full" : "",
    className,
  ].join(" ");
}

function content(size: ButtonSize, icon?: IconName, iconRight?: IconName, children?: ReactNode) {
  const iconSize = size === "sm" ? 16 : 18;
  return (
    <>
      {icon ? <Icon name={icon} size={iconSize} strokeWidth={2.2} /> : null}
      {children}
      {iconRight ? <Icon name={iconRight} size={iconSize} strokeWidth={2.2} /> : null}
    </>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", full = false, loading = false, icon, iconRight, className = "", children, href, ...rest },
  ref,
) {
  const cls = buttonClass(variant, size, full, className);
  if (href) {
    return (
      <Link href={href} className={cls}>
        {content(size, icon, iconRight, children)}
      </Link>
    );
  }
  const buttonRest = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button
      ref={ref}
      className={cls}
      aria-busy={loading || undefined}
      {...buttonRest}
      disabled={loading || buttonRest.disabled}
    >
      {content(size, icon, iconRight, children)}
    </button>
  );
});