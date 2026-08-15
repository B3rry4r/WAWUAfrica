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
Accent is **WAWU Purple `#9411C9`** (from the brand guidelines PDF), not the pink
in the earlier `Colors.svg` — that sheet was superseded. Font is **Alan Sans** via
`--font-sans`. Never hardcode either; use `var(--accent)` and `var(--font-sans)`.

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
