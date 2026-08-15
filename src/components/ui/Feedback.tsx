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
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "48px 28px",
        textAlign: "center",
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 64,
          height: 64,
          borderRadius: 999,
          background: "var(--surface-tag)",
          border: "1px solid var(--border-hairline)",
        }}
      >
        <Icon name={icon} size={26} stroke={1.8} color="var(--text-muted)" />
      </span>
      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
        {title}
      </h3>
      {description ? (
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)", maxWidth: 300 }}>
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
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        padding: "48px 28px",
        textAlign: "center",
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 64,
          height: 64,
          borderRadius: 999,
          background: "var(--danger-tint)",
          border: "1px solid var(--border-hairline)",
        }}
      >
        <Icon name="TriangleAlert" size={26} stroke={1.8} color="var(--danger)" />
      </span>
      <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--text-primary)" }}>
        {title}
      </h3>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)", maxWidth: 300 }}>
        {description}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          style={{
            marginTop: 6,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            height: 44,
            padding: "0 20px",
            borderRadius: 999,
            background: "var(--surface-tag)",
            border: "1px solid var(--border-hairline)",
            color: "var(--text-primary)",
            fontSize: 14,
            fontWeight: 600,
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
          }}
        >
          <Icon name="RotateCcw" size={15} stroke={2.2} color="currentColor" />
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
      style={{
        width,
        height,
        borderRadius: circle ? "50%" : radius,
        background:
          "linear-gradient(110deg, var(--surface-tag) 25%, var(--surface-elevated) 50%, var(--surface-tag) 75%)",
        backgroundSize: "200% 100%",
        animation: "wawuShimmer 1.6s ease-in-out infinite",
        flexShrink: 0,
      }}
    />
  );
}
