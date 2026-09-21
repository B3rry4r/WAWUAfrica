"""A taxonomy is not chosen from a wall of pills.

Build brief C5 names this by hand: "Both are currently vertical walls of
rounded category pills. This is the specific thing the owner has called
unprofessional, and it is the pattern to eliminate everywhere... A pill wall
is a build failure, not a style preference -- add it to invariants.md as an
executable check so it cannot be reintroduced by later code."

So this is that check.

WHAT IT LOOKS FOR, and why it is two rules rather than one:

1. A `rounded-full` control inside a WRAPPING container. One horizontal row of
   chips is a filter and is fine (the brief asks for exactly that in C4). The
   defect is the row that wraps into a block: twenty-five pills stacked five
   deep is the screen in refs/reject-offer-services-pillwall.jpg. `flex-wrap`
   plus `rounded-full` on a control in the same element is the signature.

2. A long taxonomy rendered straight into a chip control. `CATEGORIES.map`,
   `SPECIALIZATIONS.map` and friends feeding `ChoiceChips` is the same wall
   written a different way, and rule 1 cannot see it because the wrapping
   lives inside the component.

WHAT IT DELIBERATELY DOES NOT FLAG:

  - `rounded-full` on an avatar, a badge, a status dot, a close button, a
    spinner. None of those are choices and none of them wall.
  - A short, hand-written set of options (a price preset row, three credential
    kinds). The defect is scale: a wall needs a list long enough to wall.
  - `TaxonomyPicker`, which is the control the brief asks for.

The escape hatch is the harness's own: `--accept` it with an owner and a
reason. There is no in-file suppression comment on purpose -- silencing this
one should cost a line in baseline.json with a name against it.
"""

from __future__ import annotations

import re
from typing import Iterator

from run import Context, Finding

NAME = "pill_walls"

# A container that wraps its children onto several lines.
WRAPPING = re.compile(r"\bflex-wrap\b|\bgrid-cols-\[repeat\(auto-fi[lt]")
# A fully-rounded control. `rounded-full` on a non-interactive span is fine,
# so the line has to also look like something you press.
PILL = re.compile(r"\brounded-full\b")
INTERACTIVE = re.compile(r"<button|<Link|onClick=|role=\"checkbox\"|role=\"radio\"")

# The taxonomies big enough to wall. Names, not paths: a re-export under a
# different path is the same list.
TAXONOMY_SOURCES = re.compile(
    r"\b(CATEGORIES|CATEGORY_IDS|SPECIALIZATIONS|CATEGORIES_BY_ROLE|PROFESSIONAL_CATEGORIES|"
    r"specializationsForCategory|categoriesForRole)\b"
)
CHIP_CONTROL = re.compile(r"<ChoiceChips\b")

# The component that exists to make this gate unnecessary.
SANCTIONED = re.compile(r"<TaxonomyPicker\b")

# Rule 2 needs to see a few lines at once: the taxonomy and the control are
# usually two or three lines apart inside one JSX element.
WINDOW = 6


def run(ctx: Context) -> Iterator[Finding]:
    for path in ctx.source_files("source"):
        if ctx.is_test(path):
            continue
        rel = ctx.rel(path)
        # The picker and the chip control themselves are allowed to contain
        # both halves of the pattern: one of them IS the fix, the other is the
        # primitive the fix is built from.
        if rel.endswith(("ui/TaxonomyPicker.tsx", "ui/ChoiceChips.tsx")):
            continue

        lines = [line for _, line in ctx.lines(path)]

        for i, line in enumerate(lines):
            stripped = line.strip()
            if stripped.startswith(("//", "*", "/*")):
                continue

            # Rule 1: a pressable pill inside a wrapping container.
            if WRAPPING.search(line) or (
                PILL.search(line) and any(WRAPPING.search(l) for l in lines[max(0, i - 3):i])
            ):
                window = "\n".join(lines[i:i + WINDOW])
                if PILL.search(window) and INTERACTIVE.search(window):
                    yield Finding(
                        gate=NAME, path=rel, line=i + 1,
                        message=(
                            "pressable `rounded-full` controls inside a wrapping container: "
                            "this is the pill wall build brief C5 removes. Use TaxonomyPicker, "
                            "or a single scrolling row (ChoiceChips scroll)"
                        ),
                        evidence=stripped,
                    )

            # Rule 2: a whole taxonomy poured into a chip control.
            if CHIP_CONTROL.search(line):
                window_lines = lines[max(0, i - 2):i + WINDOW]
                window = "\n".join(window_lines)
                if SANCTIONED.search(window):
                    continue
                if TAXONOMY_SOURCES.search(window) and "scroll" not in window:
                    yield Finding(
                        gate=NAME, path=rel, line=i + 1,
                        message=(
                            "a full taxonomy rendered into ChoiceChips without `scroll`: "
                            "it wraps into a pill wall. Use TaxonomyPicker for a selection, "
                            "or pass `scroll` for a one-line browse filter"
                        ),
                        evidence=stripped,
                    )
