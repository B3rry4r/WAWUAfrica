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
    <div className="fixed z-[50] flex items-end" style={{inset: 0}}>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="absolute bg-[var(--surface-scrim)]" style={{inset: 0}}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[var(--mobile-column)] m-0 rounded-[var(--radius-sheet)_var(--radius-sheet)_0_0] bg-[var(--surface-page)] border border-[var(--border-strong)] border-b-[none] shadow-[var(--shadow-sheet)] pt-[24px] px-[20px] pb-[28px] flex flex-col gap-[18px] max-h-[88vh] overflow-y-auto" style={{animation: "wawuSheetIn var(--dur-slow) var(--ease-soft)"}}
      >
        <div className="flex items-start gap-[12px]">
          <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
            {title ? (
              <h2 className="m-0 text-[19px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
                {title}
              </h2>
            ) : null}
            {caption ? (
              <p className="m-0 text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">{caption}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid place-items-center w-[32px] h-[32px] rounded-[999] bg-[var(--surface-tag)] border border-[var(--border-hairline)] text-[var(--text-primary)] cursor-pointer shrink-0"
          >
            <Icon name="X" size={16} stroke={2.2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
