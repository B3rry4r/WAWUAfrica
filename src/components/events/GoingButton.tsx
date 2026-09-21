"use client";

import { useEffect, useState } from "react";
import { setGoing } from "@/lib/api/events";
import { Icon } from "@/components/ui";

/**
 * Which glyph the toggle wears. The meaning never changes: every one of these
 * writes the same Going signal.
 *
 * The approved Events design draws this control as a BOOKMARK on the hero
 * picture and as a HEART on the small cards. Neither is a second feature:
 * there is no saved-events endpoint and no `saved` field on an event, so
 * rather than draw a control that writes nothing, the design's shapes are
 * worn by the one per-user event signal the backend actually has. The label
 * and the title still say what pressing it does.
 */
type GoingShape = "calendar" | "bookmark" | "heart";

interface GoingButtonProps {
  eventId: string;
  going: boolean;
  count: number;
  /** "icon" is the 34px round toggle on a card; "full" is the wide control on the detail screen. */
  variant?: "icon" | "full";
  shape?: GoingShape;
  /**
   * "chip" is the bordered 34px pill. "bare" is the naked glyph the picture
   * cards use, where a bordered button over a photograph reads as chrome.
   */
  chrome?: "chip" | "bare";
  /** "media" colours the bare glyph for sitting on a photograph. */
  tone?: "default" | "media";
  /** The authoritative state the server came back with — the count included. */
  onChange?: (next: { userGoing: boolean; goingCount: number }) => void;
  /** Called when the write was refused. The button has already reverted itself. */
  onError?: (error: unknown) => void;
}

/**
 * "Going" — a hub interest signal only.
 *
 * That was the old app's own comment on this control and it is still the whole
 * story: no ticket, no price, no payment, no credit cost. The endpoints behind
 * it are idempotent in both directions and return the full state, so the count
 * shown after a press is the server's number and never a locally incremented
 * guess.
 *
 * The press is applied optimistically and REVERTED on refusal. A control that
 * keeps a filled-in state after the write failed is lying about what the
 * organiser can see.
 */
export function GoingButton({
  eventId,
  going,
  count,
  variant = "icon",
  shape = "calendar",
  chrome = "chip",
  tone = "default",
  onChange,
  onError,
}: GoingButtonProps) {
  const [optimistic, setOptimistic] = useState<{ going: boolean; count: number } | null>(null);
  const [busy, setBusy] = useState(false);

  // A fresh event (a different card, or a re-fetch) drops any optimistic state
  // left over from the previous one.
  useEffect(() => setOptimistic(null), [eventId, going, count]);

  const shownGoing = optimistic?.going ?? going;
  const shownCount = optimistic?.count ?? count;

  async function toggle() {
    if (busy) return;
    const next = !shownGoing;
    setOptimistic({ going: next, count: Math.max(0, shownCount + (next ? 1 : -1)) });
    setBusy(true);
    try {
      const result = await setGoing(eventId, next);
      setOptimistic(null);
      onChange?.({ userGoing: result.userGoing, goingCount: result.goingCount });
    } catch (e) {
      setOptimistic(null);
      onError?.(e);
    } finally {
      setBusy(false);
    }
  }

  const label = shownGoing ? "You're going. Press to take yourself off the list." : "Mark yourself as going";

  if (variant === "icon") {
    const glyph =
      shape === "bookmark" ? "Bookmark" : shape === "heart" ? "Heart" : shownGoing ? "CalendarCheck" : "CalendarPlus";
    const bare = chrome === "bare";
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          void toggle();
        }}
        disabled={busy}
        aria-pressed={shownGoing}
        aria-label={label}
        title={label}
        className={`grid shrink-0 place-items-center transition-colors disabled:opacity-60 ${
          bare
            ? `h-[30px] w-[30px] rounded-full ${
                tone === "media"
                  ? "text-white hover:text-[var(--accent)]"
                  : shownGoing
                    ? "text-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--accent)]"
              }`
            : `h-[34px] w-[34px] rounded-full border ${
                shownGoing
                  ? "border-transparent bg-[var(--accent)] text-[var(--text-on-accent)] hover:bg-accent-hover active:bg-accent-press"
                  : "border-[var(--border-hairline)] bg-[var(--surface-tag)] text-[var(--text-secondary)] hover:bg-surface-hover hover:border-strong active:bg-surface-press"
              }`
        }`}
      >
        {/* Filled when the signal is on: on a bare glyph the outline alone is
            too quiet to tell the two states apart at 20px. */}
        <Icon
          name={glyph}
          size={bare ? 21 : 16}
          strokeWidth={1.9}
          color="currentColor"
          fill={bare && shownGoing ? "currentColor" : "none"}
        />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={busy}
      aria-pressed={shownGoing}
      className={`inline-flex h-[52px] w-full items-center justify-center gap-[8px] rounded-button border text-[15px] font-semibold transition-colors disabled:opacity-60 ${
        shownGoing
          ? "border-transparent bg-[var(--accent)] text-[var(--text-on-accent)] hover:bg-accent-hover active:bg-accent-press"
          : "border-strong bg-[var(--surface-elevated)] text-[var(--text-primary)] hover:bg-surface-hover active:bg-surface-press"
      }`}
    >
      <Icon
        name={shownGoing ? "CalendarCheck" : "CalendarPlus"}
        size={19}
        strokeWidth={shownGoing ? 2 : 1.7}
        color="currentColor"
      />
      {shownGoing ? "You're going" : "Mark as going"}
      <span className="opacity-70">· {shownCount}</span>
    </button>
  );
}
