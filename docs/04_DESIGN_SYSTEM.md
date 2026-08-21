# Design System — how to use it

## Where it lives
- `design/system/_ds/*/tokens/` — CSS variables, imported by `src/app/tokens.css`
- `design/system/_ds/*/_ds_bundle.js` — **the spec.** Compiled reference
  implementations of all 34 components: props, variants, states, behaviour.
- `design/system/_ds/*/readme.md` — see the warning below before trusting it
- `src/components/ui/` — our ports. Tailwind on CSS-var tokens.

## The rule
**The bundle is the spec, not the implementation.** It is compiled JS using
inline styles. We port to TSX + Tailwind classes reading the same CSS variables.
Read the bundle for what a component *does* (props, variants, sizes, states);
write it with `className`, not `style={{}}`.

## ⚠️ The DS readme carries stale product truths — ignore these
The design system was generated with the **old** repo as a source, so its readme
describes a product we are not building. These statements in it are **WRONG**:

| DS readme says | Actual, per `docs/01_SPEC.md` |
|---|---|
| "No private messaging. Never design a DM." | **Paid DM is a core revenue stream.** ₦50–₦500/message, 24h response window, auto-refund. |
| Six post categories (Learn, Sell, Opportunity, Event, Question, Research) | The post feed is **removed**. Content types are video, course, audio, pdf, image, template. |
| Trust Score points (course +50, purchase +20, spam −100…) | Not in scope. We use the verification ladder + EVG-lite. |
| Opportunity / Event categories | **Both sections removed entirely.** |

The **components** are fine — only the product narrative in that readme is stale.
Correspondingly, these exports exist in the bundle but map to removed features and
should **not** be ported: `CATEGORIES`, `FILTERS`, `CategoryTag`, `CategoryBar`,
`MISUSE_REASON`, `TRUST_TIERS`, `TRUST_EARNS`, `TRUST_LOSES`, `TrustMeter`,
`TrustScoreChip`, `LEGACY`.

## Brand
Accent is **WAWU Purple `#9411C9`** (from the brand guidelines PDF). Font is
**Alan Sans** via `--font-sans`. Never hardcode either; use `var(--accent)` and
`var(--font-sans)`.

The rest of the palette is the **WAWU COLORS brand sheet** (`WAWU COLORS.jpeg` at
the repo root), recorded verbatim as `--wawu-*` in `src/app/tokens.css`:

| Token | Hex | Sheet's stated purpose |
|---|---|---|
| `--wawu-purple-deep` | `#290D43` | Primary brand colour |
| `--wawu-ink` | `#111018` | Strength, sophistication, typography |
| `--wawu-warm-white` | `#FAF8F5` | Main canvas |
| `--wawu-lilac` | `#9B7BFF` | Creativity / digital |
| `--wawu-pink` | `#FF0084` | Signature accent / moments of energy |
| `--wawu-lemon` | `#F4E94E` | Fun / discovery / optimism |
| `--wawu-green` | `#69D36A` | Growth / opportunity |
| `--wawu-sky` | `#5BC8FF` | Technology / connection |

## Colour roles — purple is for ACTION and CHOICE, nothing else
Four different jobs used to resolve to the same purple, which is why every card,
chip, border and icon tile came out violet. They are now separate tokens, and the
**token name is the decision** — pick by what the element means, not by how it
should look.

| Job | Tokens | Colour |
|---|---|---|
| **Action** — you can press it | `--accent`, `--accent-hover`, `--accent-press` | WAWU Purple |
| **Selection** — you already chose it | `--selected-tint`, `--border-selected`, `--selected-text` | WAWU Purple, stronger |
| **Decoration** — framing only: icon tiles, notice panels, always-on card outlines | `--decor-tint`, `--decor-tint-strong`, `--border-decor`, `--decor-icon` | **neutral** |
| **Information** | `--info`, `--info-tint`, `--border-info` | Sky Blue |
| **Interaction state** — hover / press | `--state-hover`, `--state-press` (translucent), `--surface-hover`, `--surface-press` (opaque) | **neutral** |
| **Focus ring** | `--focus-ring` | WAWU Purple |
| Decorative purple (illustration, gradients) | `--accent-soft` (Electric Lilac) | never a button |

**`--border-accent` and `--accent-tint` are legacy.** New decorative work takes
`--border-decor` / `--decor-tint`; new selected states take `--border-selected` /
`--selected-tint`.

### Hover is never white, and never the accent
`hover:bg-[rgba(255,255,255,0.06)]` is a **1.00:1 no-op on a white card** and an
accent tint measures ~1.05:1 on a dark one — both make a control dissolve into its
container. Use `--state-hover` (control with no fill of its own) or
`--surface-hover` (control that already carries a fill). Both invert with the
theme and are measured to clear 1.3:1 against every surface token in both themes.

## Ported and available now — `src/components/ui/`
```
Avatar          AccessBadge     Badge         Button        ComingSoonPill
CreditCount     EmptyState      EngagementBar ErrorState    HandoffPill
Icon            Input           ListRow       NairaInput    PriceChip
ProfileHeader   SectionHeader   Sheet         Skeleton      StatBlock
StatusPill      TierBadge       VerificationBadge
```
Plus `src/components/content/ContentCard.tsx` and
`src/components/layout/{AppShell,AppHeader,BottomNav}.tsx`.

Import from the barrel: `import { Button, PriceChip } from "@/components/ui";`

## If a component you need isn't there
1. Check the bundle — it is probably specified, just not ported yet.
2. Port it to `src/components/ui/`, Tailwind + tokens, export from `index.ts`.
3. Say so in your PR so the other devs don't port it too.

**Never fork an existing component.** If a screen needs a variant, add a prop.
