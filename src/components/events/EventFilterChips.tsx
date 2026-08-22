"use client";

import { EVENT_FILTERS } from "@/types/events";

/**
 * The calendar's filter row — the same eight chips, in the same order, as the
 * old app's `EVENT_FILTERS` (WAWUAfrica-new src/lib/ev-data.ts).
 *
 * The old app sent one `filter` string that could mean either a format or a
 * type and worked out which on the client (`matchEv`). The real backend takes
 * `format` and `type` as separate query parameters, so each chip now carries
 * the one it sets — identical on screen, and "online workshops" becomes
 * askable instead of unaskable.
 */
export function EventFilterChips({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-[8px] overflow-x-auto pb-[2px] xl:flex-wrap xl:overflow-visible">
      {EVENT_FILTERS.map((chip) => {
        const on = chip.id === selected;
        return (
          <button
            key={chip.id}
            type="button"
            onClick={() => onSelect(chip.id)}
            aria-pressed={on}
            className={`shrink-0 rounded-full px-[14px] py-[7px] text-[13px] transition-colors ${
              on
                ? "bg-[var(--accent)] font-semibold text-[var(--text-on-accent)] hover:bg-accent-hover active:bg-accent-press"
                : "border border-[var(--border-hairline)] bg-[var(--surface-tag)] font-medium text-[var(--text-secondary)] hover:border-strong hover:bg-surface-hover active:bg-surface-press"
            }`}
          >
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}
