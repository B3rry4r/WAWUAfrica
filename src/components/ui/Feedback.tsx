import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export interface EmptyStateProps {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = "Inbox", title, description, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center gap-[12px] py-[48px] px-[28px] text-center"
    >
      <span
        className="grid place-items-center w-[64px] h-[64px] rounded-[999] bg-[var(--surface-tag)] border border-[var(--border-hairline)]"
      >
        <Icon name={icon} size={26} strokeWidth={1.8} color="var(--text-muted)" />
      </span>
      <h3 className="m-0 text-[17px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
        {title}
      </h3>
      {description ? (
        <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)] max-w-[300px]">
          {description}
        </p>
      ) : null}
      {action}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We could not load this right now. Check your connection and try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      className="flex flex-col items-center gap-[12px] py-[48px] px-[28px] text-center"
    >
      <span
        className="grid place-items-center w-[64px] h-[64px] rounded-[999] bg-[var(--danger-tint)] border border-[var(--border-hairline)]"
      >
        <Icon name="TriangleAlert" size={26} strokeWidth={1.8} color="var(--danger)" />
      </span>
      <h3 className="m-0 text-[17px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
        {title}
      </h3>
      <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)] max-w-[300px]">
        {description}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-[6px] inline-flex items-center gap-[7px] h-[44px] py-0 px-[20px] rounded-[999] bg-[var(--surface-tag)] border border-[var(--border-hairline)] text-[var(--text-primary)] text-[14px] font-semibold cursor-pointer" style={{fontFamily: "var(--font-sans)"}}
        >
          <Icon name="RotateCcw" size={15} strokeWidth={2.2} color="currentColor" />
          Try again
        </button>
      ) : null}
    </div>
  );
}

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  circle?: boolean;
}

export function Skeleton({ width = "100%", height = 14, radius = 8, circle = false }: SkeletonProps) {
  return (
    <div
      className="bg-[linear-gradient(110deg,_var(--surface-tag)_25%,_var(--surface-elevated)_50%,_var(--surface-tag)_75%)] shrink-0" style={{borderRadius: circle ? "50%" : radius, backgroundSize: "200% 100%", animation: "wawuShimmer 1.6s ease-in-out infinite"}}
    />
  );
}
