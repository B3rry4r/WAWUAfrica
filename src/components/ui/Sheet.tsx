"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

interface SheetProps {
  open?: boolean;
  onClose?: () => void;
  title?: string;
  caption?: string;
  children?: ReactNode;
}

/**
 * Bottom sheet primitive, per the design system's Sheet. Rendered in-place
 * (fixed overlay). Animates in via the wawuSheetIn keyframe in tokens.css.
 */
export function Sheet({ open = true, onClose, title, caption, children }: SheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-scrim"
        onClick={onClose}
      />
      <div
        className="relative z-10 flex max-h-[88vh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-sheet border-t border-x border-strong bg-elevated shadow-sheet"
        style={{ animation: "wawuSheetIn var(--dur-slow) var(--ease-soft)" }}
      >
        <div className="flex items-center gap-3 px-5 pt-3">
          <span className="h-1 w-9 shrink-0 rounded-full bg-tag" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-3 px-5 pt-3">
          <div className="min-w-0 flex-1">
            {title ? <h2 className="text-[17px] font-semibold leading-snug text-text-primary">{title}</h2> : null}
            {caption ? <p className="mt-0.5 text-[13px] text-text-secondary">{caption}</p> : null}
          </div>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-tag text-text-secondary transition-colors hover:text-text-primary"
            >
              <Icon name="X" size={17} />
            </button>
          ) : null}
        </div>
        <div className="overflow-y-auto px-5 pb-8 pt-4">{children}</div>
      </div>
    </div>
  );
}