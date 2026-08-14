# WAWUAfrica Web

Consumer app for a Nigerian creator content marketplace. Next.js 14 · TypeScript · Tailwind.

Ground-up rebuild replacing the old post-feed app. Backend is being rewritten separately
against the existing database.

## Start here
| | |
|---|---|
| `CLAUDE.md` | Product rules and boundaries. Read first. |
| `docs/00_PLATFORM_MAP.md` | What the app is, what was cut |
| `docs/01_SPEC.md` | Locked monetization model — the tiebreaker doc |
| `docs/02_TECHNICAL_CONTEXT.md` | Data model, API contracts |
| `docs/03_USER_FLOWS.md` | Flows per persona |
| `docs/05_CONVENTIONS.md` | Code conventions |
| `docs/06_DEV_ASSIGNMENTS.md` | Who builds what |
| `design/screens/` | Approved mobile designs — open these |
| `design/system/` | Design tokens |
| `design/_wip/` | **Not ready.** Desktop + flow canvas in progress. |

## Phase
Mobile only (390px). Desktop comes later.

## Setup
```bash
npm install
npm run dev
```

## Branching
`feat/<area>-<desc>` → PR into `develop`. `main` is release-only.
