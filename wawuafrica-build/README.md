# WAWUAfrica build bundle

```
wawuafrica-build/
├── BUILD-BRIEF.md    ← the brief. Read this in full before writing code.
└── refs/             ← 17 reference images, classified by filename prefix
```

## Reference classes

Every file in `refs/` is prefixed with what it is. **This matters — not all of them are design targets.**

| Prefix | Meaning | How to use it |
|---|---|---|
| `target-` | The design to build toward | Compare built screens against these |
| `spec-` | Product logic diagram, not visual direction | Read the flow out; do not imitate the styling |
| `reject-` | The current app, being replaced | The "before". Never compare a built screen against one of these as though it were a design |
| `bug-` | Evidence of a defect | Fix what it shows |
| `annotated-` | Marked by hand by the product owner | His direct instruction; outranks inference |

Section **A4b** of `BUILD-BRIEF.md` describes each file individually and names which build item it drives.

## Before you start

The brief assumes some things about this repo that you must confirm first:

- **The stack** (`flutter` / `node` / `php` / `python`) — `verification-harness` needs this set correctly in its config. Set wrong, every gate passes silently against patterns that cannot match.
- **The source globs** — check the `files scanned: N` count on the first gate run. A number far below the repo's real file count means the globs miss part of the tree, and a clean report over an unexamined directory is the exact failure the harness exists to catch.
- **Whether an API contract exists.** If not, establishing one is task zero (see A1, `frontend-surface-build` Phase 2).

If any of these cannot be determined, say so and ask. Do not proceed on an assumption.
