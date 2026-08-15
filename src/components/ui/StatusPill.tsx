import type { ReactNode } from "react";

type StatusKind = "neutral" | "info" | "success" | "warning" | "danger";

interface StatusPillProps {
  kind?: StatusKind;
  children?: ReactNode;
}

const kindClass: Record<StatusKind, string> = {
  neutral: "bg-tag text-text-secondary border-hairline",
  info: "bg-info-tint text-info border-[rgba(32,201,195,0.28)]",
  success: "bg-success-tint text-success border-[rgba(184,232,62,0.28)]",
  warning: "bg-warning-tint text-warning border-[rgba(255,183,3,0.3)]",
  danger: "bg-danger-tint text-danger border-[rgba(255,92,92,0.3)]",
};

export function StatusPill({ kind = "neutral", children }: StatusPillProps) {
  return (
    <span
      className={[
        "inline-flex h-[26px] items-center whitespace-nowrap rounded-full border px-[10px]",
        "text-[11.5px] font-semibold leading-none",
        kindClass[kind],
      ].join(" ")}
    >
      {children}
    </span>
  );
}