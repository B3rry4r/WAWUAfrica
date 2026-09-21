"use client";

import { useMemo, useState } from "react";
import {
  CATEGORIES_BY_ROLE,
  getSpecializations,
  searchSpecializationLabels,
  specializationsForCategory,
  type Specialization,
  type TaxonomyCategory,
  type TaxonomyRole,
} from "@/lib/taxonomy/taxonomy";
import { Icon, type IconName } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

/**
 * Picks specializations out of a 557-entry taxonomy.
 *
 * The two shapes this deliberately is NOT:
 *
 *  - A flat scrolling list. 557 rows is not a list, it is a filibuster, and
 *    the one a creator wants is never the one on screen.
 *  - A wall of rounded pills. That is the pattern the product owner named as
 *    unprofessional and asked to be removed everywhere, so reintroducing it
 *    on the biggest selector in the app would be the worst possible place.
 *
 * Instead: progressive disclosure. 36 categories are a browsable list; a
 * category opens into its own specializations; and a search box cuts straight
 * across all of them for anyone who already knows the word they want. The
 * selected set stays pinned above the list the whole time and every entry
 * removes itself in one tap, so nothing is ever chosen into a void.
 *
 * Rows follow the Professionals-screen pattern the brief points at: icon tile,
 * title, one line underneath, affordance on the right. Same component
 * vocabulary as the rest of the app, no fork.
 */

/**
 * One icon per category, so a browsing creator gets a shape to aim at rather
 * than 36 identical rows of text. Keyed by category id (stable) and never by
 * label (which is copy and can be reworded).
 */
const CATEGORY_ICON: Record<string, IconName> = {
  // Creator
  "music-audio": "Music",
  "film-video": "Clapperboard",
  "art-design": "Palette",
  photography: "Camera",
  "fashion-beauty": "Shirt",
  "writing-publishing": "PenLine",
  "media-content": "Radio",
  "gaming-esports": "Gamepad2",
  "sports-fitness": "Dumbbell",
  "education-knowledge": "GraduationCap",
  "business-finance": "TrendingUp",
  technology: "Cpu",
  "food-lifestyle": "UtensilsCrossed",
  "travel-adventure": "Plane",
  "faith-spirituality": "Church",
  // Professional
  "legal-compliance": "Scale",
  "accounting-tax": "Calculator",
  "finance-investment": "Landmark",
  "business-consulting": "Briefcase",
  "technology-it": "Server",
  engineering: "Cog",
  "architecture-construction": "HardHat",
  "healthcare-medicine": "Stethoscope",
  "education-training": "BookOpen",
  "marketing-communications": "Megaphone",
  "design-creative-services": "PenTool",
  "media-entertainment": "Clapperboard",
  "human-resources-careers": "Users",
  "real-estate-property": "Building2",
  "science-research": "Microscope",
  "agriculture-agribusiness": "Sprout",
  "beauty-personal-care": "Scissors",
  "travel-hospitality": "Hotel",
  "logistics-transportation": "Truck",
  "professional-personal-services": "ClipboardList",
  "faith-ministry": "Church",
};

function iconFor(categoryId: string): IconName {
  return CATEGORY_ICON[categoryId] ?? "Tag";
}

export interface SpecializationPickerProps {
  /** Which half of the taxonomy to offer. A buyer holds no specializations. */
  role: TaxonomyRole;
  /** Selected specialization ids. Controlled: the parent owns the set. */
  value: readonly string[];
  onChange: (next: string[]) => void;
  /**
   * Cap on how many may be held at once. Omitted means no cap. A cap is
   * enforced here AND stated in the sheet, because a control that silently
   * stops responding reads as broken rather than full.
   */
  max?: number;
  label?: string;
  hint?: string;
}

export function SpecializationPicker({
  role,
  value,
  onChange,
  max,
  label = "Specializations",
  hint,
}: SpecializationPickerProps) {
  const [open, setOpen] = useState(false);

  const selected = useMemo(() => getSpecializations(value), [value]);
  const atCap = max !== undefined && value.length >= max;

  const remove = (id: string) => onChange(value.filter((v) => v !== id));

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[14px] font-semibold text-text-primary">{label}</span>
        {max !== undefined ? (
          <span className="text-[12px] text-text-muted">
            {value.length} of {max}
          </span>
        ) : null}
      </div>

      {hint ? <span className="text-[12.5px] leading-[1.45] text-text-muted">{hint}</span> : null}

      {selected.length > 0 ? (
        <ul className="flex flex-col gap-[8px]">
          {selected.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-[12px] rounded-[var(--radius-card)] border border-hairline bg-card px-[14px] py-[11px]"
            >
              <span className="grid h-[36px] w-[36px] shrink-0 place-items-center rounded-[11px] bg-tag text-text-secondary">
                <Icon name={iconFor(s.categoryId)} size={16} strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium text-text-primary">{s.label}</span>
                <span className="block truncate text-[12px] text-text-muted">{s.categoryLabel}</span>
              </span>
              <button
                type="button"
                onClick={() => remove(s.id)}
                aria-label={`Remove ${s.label}`}
                className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-full text-text-muted transition-colors hover:bg-state-hover hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] active:bg-state-press"
              >
                <Icon name="X" size={16} strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 rounded-[var(--radius-card)] border border-dashed border-hairline px-[14px] py-[16px] text-[13px] text-text-muted">
          None chosen yet. This is what people search and filter you by, so pick the ones you actually work in.
        </p>
      )}

      <Button
        variant="secondary"
        size="sm"
        icon="Plus"
        onClick={() => setOpen(true)}
        disabled={atCap}
      >
        {selected.length > 0 ? "Add another" : "Choose specializations"}
      </Button>

      {atCap ? (
        <span className="text-[12px] text-text-muted">
          That is the maximum. Remove one to choose a different one.
        </span>
      ) : null}

      {open ? (
        <PickerSheet
          role={role}
          value={value}
          onChange={onChange}
          max={max}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </div>
  );
}

function PickerSheet({
  role,
  value,
  onChange,
  max,
  onClose,
}: {
  role: TaxonomyRole;
  value: readonly string[];
  onChange: (next: string[]) => void;
  max?: number;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [openCategory, setOpenCategory] = useState<TaxonomyCategory | null>(null);

  const categories = CATEGORIES_BY_ROLE[role];
  const trimmed = query.trim();
  const searching = trimmed.length > 0;

  // Search cuts across every category, so it is the one path that does not
  // need the drill-down. Results keep their category label so two identically
  // named placements stay tellable apart.
  const results = useMemo(
    () => (searching ? searchSpecializationLabels(trimmed, { role, limit: 60 }) : []),
    [searching, trimmed, role],
  );

  const rows: readonly Specialization[] = searching
    ? results
    : openCategory
      ? specializationsForCategory(openCategory.id)
      : [];

  const atCap = max !== undefined && value.length >= max;

  const toggle = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
      return;
    }
    if (atCap) return;
    onChange([...value, id]);
  };

  const grouped = useMemo(() => {
    if (!searching) return null;
    const out = new Map<string, Specialization[]>();
    for (const r of results) {
      const list = out.get(r.categoryLabel) ?? [];
      list.push(r);
      out.set(r.categoryLabel, list);
    }
    return [...out.entries()];
  }, [searching, results]);

  return (
    <Sheet
      open
      onClose={onClose}
      title={openCategory && !searching ? openCategory.label : "Choose specializations"}
      caption={
        openCategory && !searching
          ? `${openCategory.specializations.length} to choose from`
          : `Search across every category, or browse the ${categories.length} below.`
      }
      desktop="modal"
    >
      <div className="flex flex-col gap-[14px]">
        <Input
          icon="Search"
          placeholder="Search specializations"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search specializations"
        />

        {max !== undefined ? (
          <span className="text-[12px] text-text-muted">
            {value.length} of {max} chosen
            {atCap ? ". Remove one to choose a different one." : ""}
          </span>
        ) : null}

        {/* Browsing a category is a step INTO the list, so it needs a step back out. */}
        {openCategory && !searching ? (
          <button
            type="button"
            onClick={() => setOpenCategory(null)}
            className="flex items-center gap-[6px] self-start rounded-full px-[10px] py-[6px] text-[13px] text-text-secondary transition-colors hover:bg-state-hover hover:text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            <Icon name="ChevronLeft" size={15} strokeWidth={2} />
            All categories
          </button>
        ) : null}

        <div className="max-h-[52vh] overflow-y-auto pr-[2px]">
          {!searching && !openCategory ? (
            <ul className="flex flex-col gap-[8px]">
              {categories.map((c) => {
                const chosen = c.specializations.filter((s) => value.includes(s.id)).length;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setOpenCategory(c)}
                      className="flex w-full items-center gap-[12px] rounded-[var(--radius-card)] border border-hairline bg-card px-[14px] py-[12px] text-left transition-colors hover:bg-state-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] active:bg-state-press"
                    >
                      <span className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-[12px] bg-tag text-text-secondary">
                        <Icon name={iconFor(c.id)} size={18} strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium text-text-primary">{c.label}</span>
                        <span className="block text-[12px] text-text-muted">
                          {c.specializations.length} specializations
                          {chosen > 0 ? ` · ${chosen} chosen` : ""}
                        </span>
                      </span>
                      <Icon name="ChevronRight" size={16} strokeWidth={2} />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}

          {searching && grouped ? (
            grouped.length === 0 ? (
              <EmptyState
                icon="SearchX"
                title="Nothing matches that"
                caption="Try a shorter word, or browse the categories instead."
              />
            ) : (
              <div className="flex flex-col gap-[16px]">
                {grouped.map(([categoryLabel, items]) => (
                  <section key={categoryLabel} className="flex flex-col gap-[8px]">
                    <h3 className="m-0 text-[12px] font-semibold uppercase tracking-[0.06em] text-text-muted">
                      {categoryLabel}
                    </h3>
                    <ul className="flex flex-col gap-[6px]">
                      {items.map((s) => (
                        <SpecRow
                          key={s.id}
                          spec={s}
                          checked={value.includes(s.id)}
                          disabled={atCap && !value.includes(s.id)}
                          onToggle={() => toggle(s.id)}
                        />
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            )
          ) : null}

          {!searching && openCategory ? (
            <ul className="flex flex-col gap-[6px]">
              {rows.map((s) => (
                <SpecRow
                  key={s.id}
                  spec={s}
                  checked={value.includes(s.id)}
                  disabled={atCap && !value.includes(s.id)}
                  onToggle={() => toggle(s.id)}
                />
              ))}
            </ul>
          ) : null}
        </div>

        <Button full onClick={onClose}>
          Done
        </Button>
      </div>
    </Sheet>
  );
}

function SpecRow({
  spec,
  checked,
  disabled,
  onToggle,
}: {
  spec: Specialization;
  checked: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={onToggle}
        className={`flex w-full items-center gap-[12px] rounded-[12px] border px-[13px] py-[10px] text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
          checked
            ? "border-[var(--accent)] bg-[var(--accent-tint)]"
            : "border-hairline bg-card hover:bg-state-hover active:bg-state-press"
        } ${disabled ? "cursor-not-allowed opacity-[0.45]" : ""}`}
      >
        <span
          className={`grid h-[20px] w-[20px] shrink-0 place-items-center rounded-[6px] border ${
            checked ? "border-[var(--accent)] bg-accent text-on-accent" : "border-[var(--border-strong)]"
          }`}
        >
          {checked ? <Icon name="Check" size={13} strokeWidth={3} /> : null}
        </span>
        <span className="min-w-0 flex-1 truncate text-[14px] text-text-primary">{spec.label}</span>
      </button>
    </li>
  );
}
