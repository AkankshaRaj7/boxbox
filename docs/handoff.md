# Handoff — where BOXBOX stands

Read this first in a new session, then [plan.md](plan.md) for the full roadmap
and [../CLAUDE.md](../CLAUDE.md) for the rules.

_Last updated: 2026-09-15 — end of Phase 0._

## Status

**Phase 0 (setup + design system) is done.** Phase 1 has not started.

| Check | Result |
|---|---|
| `npm test` | 37 tests pass (colour contrast, credibility meter, countdown, standings maths) |
| `npm run typecheck` | Clean |
| `npm run lint` | Clean |
| Browser | `/` and `/design` checked at 375px and 1280px, no console errors |

## What exists

- **Stack:** Next.js 16.3 (App Router, Turbopack) · React 19 · Tailwind v4 ·
  framer-motion · lucide-react · Vitest. Node 20 (`.nvmrc`).
- **`app/globals.css`** — all design tokens (`@theme`) and shape utilities
  (`headline`, `slant`/`unslant`, `pit-board`, `carbon-weave`, `kerb-stripe`,
  `chequered`, `live-pulse`), plus the CSS lights-out intro and page wipe.
- **`app/page.tsx`** — Paddock home mockup: countdown, Briefing, circuit,
  standings (Drivers/Constructors tabs), radio feed, rumor card, pecking order,
  predictions sheet and badges.
- **`app/design/page.tsx`** — dev-only style guide (404 in production) showing
  every token and component.
- **`components/f1/`** — the F1 UI kit: `TimingTower`, `StandingsPanel`,
  `PitBoardCountdown`, `RadioCard`, `ShiftLightMeter`, `RumorCard`, `SectorChip`,
  `TyreDot`, `PowerRankRow`, `SeatBoard`, `TelemetryChart`, `PredictionSlip`,
  `StreakFlame`/`EnamelPin`, `TrackOutline`, `LightsOut`, `Wordmark`, header,
  footer (with the unofficial-site disclaimer) and mobile `BottomNav`.
- **`lib/`** — `color.ts` (`teamStyle`, AA-readable team text), `credibility.ts`
  (rumor status → shift lights), `time.ts` (countdown), `use-clock.ts`, and
  `sample-data.ts`.

## Decisions made so far

- **Sample data is fictional on purpose.** Invented teams, drivers, headlines and
  numbers, labelled on the page, so the mockup can never pass as real standings or
  real transfer news. Phase 1 replaces `lib/sample-data.ts` piece by piece.
- **Zero cost** — no paid APIs, no paid LLM, free tiers only. See CLAUDE.md.
- **GitHub repo is public** (unlimited free Actions minutes):
  https://github.com/AkankshaRaj7/boxbox — `main` tracks `origin/main`.
- **Git identity is repo-local:** `akanksharaj <akanksharajp@gmail.com>`.
- **Port 4747**, isolated from the tutorAI project on the same machine.
- **Deviations from plan.md:**
  - Page wipe is CSS, not framer-motion: framer's server-rendered `initial`
    styles hid content until hydration.
  - Contrast is guarded by `lib/contrast.test.ts`, which reads the hex values
    from `globals.css`, instead of an axe scan.
  - The home page switches to 12 columns at `lg` (1024px); `md` was too cramped.
  - Not built yet: light mode, the radio-beep sound toggle, number tickers.

## Next steps — Phase 1 (MVP)

1. **Real standings first.** Fetch the current season's drivers, constructors
   and points from Jolpica-F1 (`https://api.jolpi.ca/ergast/f1/current/...`),
   cached with Next.js revalidation to stay inside its free rate limit. Feed
   `StandingsPanel` with real rows and real team colours (colours only — no logos).
2. **Real calendar + next session** for `PitBoardCountdown` and the circuit card.
3. **News wire:** RSS ingest (headline, publisher description, source link),
   duplicate grouping and driver/team tagging, done in code — no paid AI.
4. **Driver and team pages.**
5. **Supabase + scheduled jobs** once data needs storing. The user creates the
   free Supabase and Vercel accounts themselves; never add a payment method.
6. **Deploy** to Vercel Hobby.

Remove each block of `lib/sample-data.ts` (and the "fictional sample data"
notice) as the real data for it lands. Keep `/design` working with sample data.

## Gotchas

- Before first `tsc`, run `npm run typecheck` (it runs `next typegen` so
  `LayoutProps` types exist).
- Don't run `npm run build` while the dev server is running — they share `.next/`.
- Next.js 16 differs from older versions: check `node_modules/next/dist/docs/`
  before using an unfamiliar API (see AGENTS.md).
- If port 4747 is "in use", a previous BOXBOX dev server is still running —
  reuse it rather than starting another.
