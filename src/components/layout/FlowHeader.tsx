"use client";

import { useRouter } from "next/navigation";
import { Icon } from "../ui/Icon";

export interface FlowHeaderProps {
  title: string;
  right?: React.ReactNode;
  onBack?: () => void;
  backLabel?: string;
}

/** Wizard/flow header: round back control, title, optional right slot. */
export function FlowHeader({ title, right, onBack, backLabel = "Back" }: FlowHeaderProps) {
  const router = useRouter();
  const back = onBack ?? (() => router.back());

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderBottom: "1px solid var(--border-hairline)",
      }}
    >
      <button
        type="button"
        onClick={back}
        aria-label={backLabel}
        style={{
          display: "grid",
          placeItems: "center",
          width: 34,
          height: 34,
          borderRadius: 999,
          background: "var(--surface-tag)",
          border: "1px solid var(--border-hairline)",
          color: "var(--text-primary)",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <Icon name="ChevronLeft" size={18} stroke={2.2} />
      </button>
      <span
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: 16,
          fontWeight: 600,
          color: "var(--text-primary)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {title}
      </span>
      {right ?? <span style={{ width: 34 }} />}
    </header>
  );
}
