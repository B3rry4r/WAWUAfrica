"use client";

import Link from "next/link";
import { Icon, type IconName } from "./Icon";

/**
 * A row of one-tap choices.
 *
 * Extracted from NairaInput, which had the only copy of this markup. The
 * paid-messaging reply window needs the same control and the same selected
 * state, and a second hand-rolled chip row is exactly the drift
 * docs/05_CONVENTIONS.md forbids — so both render this.
 *
 * Values are generic: the caller decides what a chip means and how it reads.
 *
 * It is also the browse filter rail (build brief C4, "category chips for
 * browsing"). Those rails used to be rows of 150x86 gradient cards in seven
 * cycling colours, which made a filter look like a gallery and broke A5's
 * restraint rule. `scroll` keeps them on one line, and `href` lets a filter
 * stay a real navigable link instead of turning into client state.
 */
export interface ChoiceChipOption<T> {
  value: T;
  label: string;
  /** Renders the chip as a link. Filter rails that live in the URL use this. */
  href?: string;
  /** A small leading glyph. Omit on lists that have no icons of their own. */
  icon?: IconName;
}

export interface ChoiceChipsProps<T> {
  options: readonly ChoiceChipOption<T>[];
  /** The chosen value (single mode), or the chosen values (`multiple`), or null/empty when nothing is chosen yet. */
  value: T | T[] | null;
  /**
   * Always the ONE value the tapped chip carries, in both modes. In
   * `multiple` mode the caller toggles it into their own array — this stays
   * the same shape either way rather than branching what it hands back.
   *
   * Optional, because a rail of `href` chips navigates instead of selecting.
   */
  onSelect?: (value: T) => void;
  /** Names the group for screen readers — a bare row of buttons does not. */
  ariaLabel: string;
  /** Lets more than one chip stay selected at once. Default: single-select. */
  multiple?: boolean;
  /**
   * One horizontal line that scrolls, instead of wrapping onto several.
   * For a browse filter, where wrapping turns a control into a wall: the
   * exact pattern C5 throws out.
   */
  scroll?: boolean;
}

export function ChoiceChips<T extends string | number>({
  options,
  value,
  onSelect,
  ariaLabel,
  multiple = false,
  scroll = false,
}: ChoiceChipsProps<T>) {
  if (options.length === 0) return null;

  const chipClass = (selected: boolean) =>
    [
      "inline-flex h-9 shrink-0 items-center gap-[6px] rounded-full border px-3 text-[13px] font-semibold no-underline transition-colors",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-page)]",
      selected
        ? "border-[var(--border-selected)] bg-[var(--selected-tint)] text-[var(--accent)]"
        : "border-hairline bg-card text-text-secondary hover:border-strong hover:bg-surface-hover active:bg-surface-press",
    ].join(" ");

  const row = (
    <div
      className={
        scroll
          ? "wawu-no-scrollbar flex gap-2 overflow-x-auto"
          : "flex flex-wrap gap-2"
      }
      role="group"
      aria-label={ariaLabel}
    >
      {options.map((option) => {
        const selected = multiple
          ? Array.isArray(value) && value.includes(option.value)
          : value === option.value;
        const body = (
          <>
            {option.icon ? (
              <Icon
                name={option.icon}
                size={14}
                color={selected ? "var(--accent)" : "var(--text-muted)"}
                strokeWidth={1.9}
              />
            ) : null}
            {option.label}
          </>
        );

        if (option.href) {
          return (
            <Link
              key={String(option.value)}
              href={option.href}
              aria-current={selected ? "page" : undefined}
              className={chipClass(selected)}
            >
              {body}
            </Link>
          );
        }

        return (
          <button
            key={String(option.value)}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect?.(option.value)}
            className={chipClass(selected)}
          >
            {body}
          </button>
        );
      })}
    </div>
  );

  // The rail bleeds to the screen edge so a scrolled chip does not appear to
  // stop short of it, and gets vertical room because the selected chip's ring
  // is drawn outside the element and a scroll container clips it otherwise.
  return scroll ? (
    <div className="-mx-[16px] px-[16px] py-[6px] xl:mx-0 xl:px-0">{row}</div>
  ) : (
    row
  );
}
