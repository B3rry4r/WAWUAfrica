import type { ReactNode } from "react";

/** "error" is an accepted alias for "danger". */
export type StatusKind = "neutral" | "info" | "success" | "warning" | "danger" | "error";

type StatusSize = "xs" | "sm" | "md";

interface StatusPillProps {
  kind?: StatusKind;
  size?: StatusSize;
  children?: ReactNode;
}

const sizeClass: Record<StatusSize, string> = {
  xs: "h-[19px] px-[7px] text-[10px]",
  sm: "h-[22px] px-[8px] text-[10.5px]",
  md: "h-[26px] px-[10px] text-[11.5px]",
};

const kindClass: Record<StatusKind, string> = {
  neutral: "bg-tag text-text-secondary border-hairline",
  info: "bg-info-tint text-info border-info",
  success: "bg-success-tint text-success border-success",
  warning: "bg-warning-tint text-warning border-warning",
  danger: "bg-danger-tint text-danger border-danger",
  error: "bg-danger-tint text-danger border-danger",
};

export function StatusPill({ kind = "neutral", size = "md", children }: StatusPillProps) {
  return (
    <span
      className={[
        "inline-flex items-center whitespace-nowrap rounded-full border font-semibold leading-none",
        sizeClass[size],
        kindClass[kind],
      ].join(" ")}
    >
      {children}
    </span>
  );
}