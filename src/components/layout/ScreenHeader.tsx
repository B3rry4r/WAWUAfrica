"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

/** Sub-screen header: back chevron + centered title + optional right slot. */
export function ScreenHeader({ title, right }: { title: string; right?: ReactNode }) {
  const router = useRouter();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderBottom: "1px solid var(--border-hairline)",
        background: "rgba(19,19,22,0.86)",
        backdropFilter: "var(--blur-chrome)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Back"
        style={{
          display: "grid",
          placeItems: "center",
          width: 34,
          height: 34,
          borderRadius: 999,
          background: "var(--surface-tag)",
          border: "1px solid var(--border-hairline)",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <Icon name="ChevronLeft" size={18} color="var(--text-primary)" stroke={2.2} />
      </button>
      <span style={{ flex: 1, fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>{title}</span>
      {right}
    </div>
  );
}