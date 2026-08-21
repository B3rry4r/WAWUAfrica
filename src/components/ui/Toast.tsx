"use client";

import { useEffect } from "react";
import { Icon } from "./Icon";

export type ToastKind = "success" | "info" | "error";

export interface ToastProps {
  kind?: ToastKind;
  title: string;
  body?: string;
  /** Fires when the toast dismisses itself or the reader closes it. */
  onDismiss: () => void;
  /** Milliseconds on screen. Errors stay until dismissed. */
  duration?: number;
}

const TONE: Record<ToastKind, { border: string; tint: string; icon: string; color: string }> = {
  success: {
    border: "border-success",
    tint: "bg-success-tint",
    icon: "Check",
    color: "var(--success)",
  },
  info: {
    border: "border-[var(--border-hairline)]",
    tint: "bg-[var(--surface-tag)]",
    icon: "Info",
    color: "var(--text-secondary)",
  },
  error: {
    border: "border-danger",
    tint: "bg-[var(--danger-tint)]",
    icon: "TriangleAlert",
    color: "var(--danger)",
  },
};

/**
 * A notification pinned to the top of the screen.
 *
 * Confirmation used to happen by quietly swapping the panel underneath the
 * reader, which is easy to miss when the thing being confirmed is a payment
 * and a booked appointment. This sits above everything, says what happened,
 * and gets out of the way on its own.
 *
 * Errors do not auto-dismiss: something that went wrong should still be on
 * screen when the reader looks back.
 */
export function Toast({ kind = "success", title, body, onDismiss, duration = 6000 }: ToastProps) {
  useEffect(() => {
    if (kind === "error") return;
    const timer = setTimeout(onDismiss, duration);
    return () => clearTimeout(timer);
  }, [kind, duration, onDismiss]);

  const tone = TONE[kind];

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex justify-center px-4 pt-[max(14px,env(safe-area-inset-top))]"
    >
      <div
        className={`pointer-events-auto flex w-full max-w-[440px] items-start gap-[11px] rounded-[var(--radius-card)] border ${tone.border} bg-[var(--surface-elevated)] p-[13px_14px] shadow-[0_12px_40px_rgba(0,0,0,0.55)] [animation:wawuToastIn_220ms_var(--ease-soft)_both]`}
      >
        <span className={`grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full ${tone.tint}`}>
          <Icon name={tone.icon as never} size={16} color={tone.color} strokeWidth={2.3} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <span className="text-[14px] font-semibold leading-snug text-[var(--text-primary)]">{title}</span>
          {body ? (
            <span className="text-[12.5px] leading-[1.45] text-[var(--text-secondary)]">{body}</span>
          ) : null}
        </span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full hover:bg-state-hover active:bg-state-press"
        >
          <Icon name="X" size={15} color="var(--text-muted)" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
