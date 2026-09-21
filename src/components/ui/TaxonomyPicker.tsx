"use client";

import { useMemo, useState } from "react";
import {
  CATEGORIES_BY_ROLE,
  getCategory,
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
 * Picks out of the C1 taxonomy: either a CATEGORY (36 of them) or a
 * SPECIALIZATION (557 of them). One control, `select` chooses which, because
 * they are the same act at two depths and two components would be two truths
 * that drift. Build brief C5 asks for the same treatment on every taxonomy
 * selector in the app, which is only enforceable if there is one.
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
 *
 * In `select="category"` there is no drill-down: 36 rows is a list a person
 * can read, so the categories ARE the rows and each one toggles. Search still
 * works, because someone who knows they want "Legal" should not have to scan
 * for it.
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

export type TaxonomyPickerSelect = "specialization" | "category";

/**
 * A caller-supplied list to pick from, in place of the C1 taxonomy.
 *
 * Why this exists rather than "just use the taxonomy": the professional
 * application still files against the deprecated flat 25-category list,
 * because the regulated-category mapping (which fields legally need a
 * licence) is keyed to those ids and re-deriving it against C1's 21
 * professional categories is a decision with liability attached, not a
 * rename. See DECISIONS.md D7. The SELECTOR is the thing build brief C5
 * asks to rebuild, and it should not have to wait on that.
 */
export interface TaxonomyOption {
  id: string;
  label: string;
  /** One line under the name. */
  caption?: string;
  /** Falls back to the generic tag glyph when the id is not a C1 category. */
  icon?: IconName;
}

export interface TaxonomyPickerProps {
  /** Which half of the taxonomy to offer. A buyer holds neither. */
  role: TaxonomyRole;
  /**
   * What the value holds. "specialization" (default) is the 557-entry list
   * behind a category drill-down; "category" is the 15 or 21 categories
   * themselves, chosen directly.
   */
  select?: TaxonomyPickerSelect;
  /**
   * Pick from these instead of the C1 taxonomy. When set, `select` and `role`
   * are ignored: the list is flat and every row toggles.
   */
  options?: readonly TaxonomyOption[];
  /** Selected ids, of whichever kind `select` names. Controlled: the parent owns the set. */
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
  /**
   * Shown in place of the selected list when nothing is chosen. Defaults to
   * the specialization wording; a category picker says something else.
   */
  emptyHint?: string;
}

/** What one chosen row renders as, in either mode. */
interface ChosenRow {
  id: string;
  label: string;
  caption: string;
  iconCategoryId: string;
  /** Supplied lists carry their own glyph; taxonomy rows derive one from the id. */
  icon?: IconName;
}

export function TaxonomyPicker({
  role,
  select: selectProp = "specialization",
  options,
  value,
  onChange,
  max,
  label,
  hint,
  emptyHint,
}: TaxonomyPickerProps) {
  const [open, setOpen] = useState(false);
  // A supplied list is always a flat one-level choice, whatever `select` says.
  const select: TaxonomyPickerSelect = options ? "category" : selectProp;
  const resolvedLabel = label ?? (select === "category" ? "Categories" : "Specializations");

  const selected: readonly ChosenRow[] = useMemo(() => {
    if (options) {
      const byId = new Map(options.map((o) => [o.id, o]));
      return value
        .map((id) => byId.get(id))
        .filter((o): o is TaxonomyOption => Boolean(o))
        .map((o) => ({ id: o.id, label: o.label, caption: o.caption ?? "", iconCategoryId: o.id, icon: o.icon }));
    }
    if (select === "category") {
      // Unknown ids are dropped rather than rendered blank: a value that is
      // no longer in the taxonomy is data to fix, not a row to draw.
      return value
        .map((id) => getCategory(id))
        .filter((c): c is TaxonomyCategory => Boolean(c))
        .map((c) => ({
          id: c.id,
          label: c.label,
          caption: `${c.specializations.length} specializations`,
          iconCategoryId: c.id,
        }));
    }
    return getSpecializations(value).map((s) => ({
      id: s.id,
      label: s.label,
      caption: s.categoryLabel,
      iconCategoryId: s.categoryId,
    }));
  }, [options, select, value]);

  const atCap = max !== undefined && value.length >= max;

  const remove = (id: string) => onChange(value.filter((v) => v !== id));

  return (
    <div className="flex flex-col gap-[10px]">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[14px] font-semibold text-text-primary">{resolvedLabel}</span>
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
                <Icon name={s.icon ?? iconFor(s.iconCategoryId)} size={16} strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-medium text-text-primary">{s.label}</span>
                <span className="block truncate text-[12px] text-text-muted">{s.caption}</span>
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
          {emptyHint ??
            "None chosen yet. This is what people search and filter you by, so pick the ones you actually work in."}
        </p>
      )}

      <Button
        variant="secondary"
        size="sm"
        icon="Plus"
        onClick={() => setOpen(true)}
        disabled={atCap}
      >
        {selected.length > 0
          ? "Add another"
          : select === "category"
            ? "Choose categories"
            : "Choose specializations"}
      </Button>

      {atCap ? (
        <span className="text-[12px] text-text-muted">
          That is the maximum. Remove one to choose a different one.
        </span>
      ) : null}

      {open ? (
        <PickerSheet
          role={role}
          select={select}
          options={options}
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
  select,
  options,
  value,
  onChange,
  max,
  onClose,
}: {
  role: TaxonomyRole;
  select: TaxonomyPickerSelect;
  options?: readonly TaxonomyOption[];
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
    () =>
      searching && select === "specialization"
        ? searchSpecializationLabels(trimmed, { role, limit: 60 })
        : [],
    [searching, trimmed, role, select],
  );

  // Category mode filters the 36 rows in place. No drill-down and no ranked
  // search index: at this size a substring match on the label is the honest
  // behaviour, and matching a category by one of ITS specializations is what
  // makes "photographer" find Photography.
  const categoryRows: readonly TaxonomyOption[] = useMemo(() => {
    if (select !== "category") return [];
    const all: TaxonomyOption[] = options
      ? [...options]
      : categories.map((c) => ({
          id: c.id,
          label: c.label,
          caption: `${c.specializations.length} specializations`,
        }));
    if (!searching) return all;
    const q = trimmed.toLowerCase();
    // A supplied list has no specializations to match through, so it matches
    // on its own two lines and nothing else.
    const deep = new Map(categories.map((c) => [c.id, c.specializations]));
    return all.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        (o.caption ?? "").toLowerCase().includes(q) ||
        (deep.get(o.id) ?? []).some((sp) => sp.label.toLowerCase().includes(q)),
    );
  }, [select, options, searching, trimmed, categories]);

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
      title={
        select === "category"
          ? "Choose categories"
          : openCategory && !searching
            ? openCategory.label
            : "Choose specializations"
      }
      caption={
        select === "category"
          ? `${categoryRows.length || (options?.length ?? categories.length)} to choose from. Pick the ones you actually work in.`
          : openCategory && !searching
            ? `${openCategory.specializations.length} to choose from`
            : `Search across every category, or browse the ${categories.length} below.`
      }
      desktop="modal"
    >
      <div className="flex flex-col gap-[14px]">
        <Input
          icon="Search"
          placeholder={select === "category" ? "Search categories" : "Search specializations"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label={select === "category" ? "Search categories" : "Search specializations"}
        />

        {max !== undefined ? (
          <span className="text-[12px] text-text-muted">
            {value.length} of {max} chosen
            {atCap ? ". Remove one to choose a different one." : ""}
          </span>
        ) : null}

        {/* Browsing a category is a step INTO the list, so it needs a step back out. */}
        {select === "specialization" && openCategory && !searching ? (
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
          {select === "category" ? (
            categoryRows.length === 0 ? (
              <EmptyState
                icon="SearchX"
                title="Nothing matches that"
                caption="Try a shorter word."
              />
            ) : (
              <ul className="flex flex-col gap-[6px]">
                {categoryRows.map((c) => (
                  <TaxonomyRow
                    key={c.id}
                    id={c.id}
                    label={c.label}
                    caption={c.caption}
                    iconCategoryId={c.id}
                    icon={c.icon}
                    checked={value.includes(c.id)}
                    disabled={atCap && !value.includes(c.id)}
                    onToggle={() => toggle(c.id)}
                  />
                ))}
              </ul>
            )
          ) : null}

          {select === "specialization" && !searching && !openCategory ? (
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

          {select === "specialization" && searching && grouped ? (
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
                        <TaxonomyRow
                          key={s.id}
                          id={s.id}
                          label={s.label}
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

          {select === "specialization" && !searching && openCategory ? (
            <ul className="flex flex-col gap-[6px]">
              {rows.map((s) => (
                <TaxonomyRow
                  key={s.id}
                  id={s.id}
                  label={s.label}
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

/**
 * One selectable row, in either mode.
 *
 * The shape build brief C5 names: icon tile, title, one line underneath, the
 * state on the left. It replaces a rounded pill, which carried the same
 * information with no room for the second line and, stacked twenty deep, was
 * the "wall of pills" the owner threw out.
 */
function TaxonomyRow({
  label,
  caption,
  iconCategoryId,
  icon,
  checked,
  disabled,
  onToggle,
}: {
  id: string;
  label: string;
  caption?: string;
  iconCategoryId?: string;
  icon?: IconName;
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
        {icon || iconCategoryId ? (
          <span className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-[10px] bg-tag text-text-secondary">
            <Icon name={icon ?? iconFor(iconCategoryId as string)} size={16} strokeWidth={2} />
          </span>
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] text-text-primary">{label}</span>
          {caption ? <span className="block truncate text-[12px] text-text-muted">{caption}</span> : null}
        </span>
      </button>
    </li>
  );
}
