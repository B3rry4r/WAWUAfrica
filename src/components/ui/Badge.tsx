import type { ReactNode } from "react";

type BadgeTone = "neutral" | "accent" | "success" | "warning" | "danger" | "info" | "brand";

interface BadgeProps {
  tone?: BadgeTone;
  children?: ReactNode;
  className?: string;
}

const toneClass: Record<BadgeTone, string> = {
  neutral: "bg-tag text-text-secondary border-hairline",
  accent: "bg-accent-tint text-accent-hover border-accent",
  success: "bg-success-tint text-success border-[rgba(184,232,62,0.28)]",
  warning: "bg-warning-tint text-warning border-[rgba(255,183,3,0.3)]",
  danger: "bg-danger-tint text-danger border-[rgba(255,92,92,0.3)]",
  info: "bg-info-tint text-info border-[rgba(32,201,195,0.28)]",
  brand: "bg-accent-tint text-accent border-accent",
};

export function Badge({ tone = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-full border px-[10px]",
        "text-[11.5px] font-semibold leading-none",
        toneClass[tone],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}