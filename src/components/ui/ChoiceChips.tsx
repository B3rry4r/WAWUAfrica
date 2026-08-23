"use client";

/**
 * A row of one-tap choices.
 *
 * Extracted from NairaInput, which had the only copy of this markup. The
 * paid-messaging reply window needs the same control and the same selected
 * state, and a second hand-rolled chip row is exactly the drift
 * docs/05_CONVENTIONS.md forbids — so both render this.
 *
 * Values are generic: the caller decides what a chip means and how it reads.
 */
export interface ChoiceChipOption<T> {
  value: T;
  label: string;
}

export interface ChoiceChipsProps<T> {
  options: readonly ChoiceChipOption<T>[];
  /** The chosen value, or null when nothing is chosen yet. */
  value: T | null;
  onSelect: (value: T) => void;
  /** Names the group for screen readers — a bare row of buttons does not. */
  ariaLabel: string;
}

export function ChoiceChips<T extends string | number>({
  options,
  value,
  onSelect,
  ariaLabel,
}: ChoiceChipsProps<T>) {
  if (options.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(option.value)}
            className={[
              "h-9 rounded-full border px-3 text-[13px] font-semibold transition-colors",
              selected
                ? "border-[var(--border-selected)] bg-[var(--selected-tint)] text-[var(--accent)]"
                : "border-hairline bg-card text-text-secondary hover:border-strong hover:bg-surface-hover active:bg-surface-press",
            ].join(" ")}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
