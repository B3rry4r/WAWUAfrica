"use client";
import { useEffect } from "react";
import { cn } from "@/lib/cn";

/**
 * Mobile bottom sheet. On desktop this becomes a centred modal — that adaptation
 * is deferred until the desktop designs land.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <button
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-[var(--surface-scrim)] backdrop-blur-[var(--blur-veil)]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative w-full max-w-[var(--mobile-column)] rounded-t-[var(--radius-sheet)]",
          "bg-[var(--surface-elevated)] px-[var(--gutter)] pb-8 pt-3 shadow-[var(--shadow-sheet)]",
          className
        )}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-[var(--border-strong)]" />
        {title && (
          <h2 className="mb-4 text-[19px] font-semibold text-[var(--text-primary)]">{title}</h2>
        )}
        {children}
      </div>
    </div>
  );
}
