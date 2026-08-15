"use client";

import type { ReactNode } from "react";
import { Icon } from "./Icon";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  caption?: string;
  children?: ReactNode;
}

export function Sheet({ open, onClose, title, caption, children }: SheetProps) {
  if (!open) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "flex-end" }}>
      <div
        aria-hidden="true"
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "var(--surface-scrim)" }}
      />
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "var(--mobile-column)",
          margin: "0 auto",
          borderRadius: "var(--radius-sheet) var(--radius-sheet) 0 0",
          background: "var(--surface-page)",
          border: "1px solid var(--border-strong)",
          borderBottom: "none",
          boxShadow: "var(--shadow-sheet)",
          padding: "24px 20px calc(28px + env(safe-area-inset-bottom))",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          animation: "wawuSheetIn var(--dur-slow) var(--ease-soft)",
          maxHeight: "88vh",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
            {title ? (
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
                {title}
              </h2>
            ) : null}
            {caption ? (
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>{caption}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              display: "grid",
              placeItems: "center",
              width: 32,
              height: 32,
              borderRadius: 999,
              background: "var(--surface-tag)",
              border: "1px solid var(--border-hairline)",
              color: "var(--text-primary)",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Icon name="X" size={16} stroke={2.2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
