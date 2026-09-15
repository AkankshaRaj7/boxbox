# Handoff — where BOXBOX stands

Read this first in a new session, then [plan.md](plan.md) for the full roadmap
and [../CLAUDE.md](../CLAUDE.md) for the rules.

_Last updated: 2026-09-15 — Phase 1, steps 1–2 (standings, calendar + countdown) done._

## Status

**Phase 0 (setup + design system) is done. Phase 1 is under way:** the home
page shows real 2026 standings, a real next-session countdown and the real
upcoming circuit, all from Jolpica-F1. The briefing, radio feed, rumors,
pecking order and game are still fictional sample data, and the page says so.

| Check | Result |
|---|---|
| `npm test` | 60 tests pass (adds schedule logic, calendar and last-winner parsing) |
| `npm run typecheck` | Clean |
| `npm run lint` | Clean |
| Browser | `/` shows standings after R14, countdown to R15 Azerbaijan FP1 and Baku (last winner VER 2025); no overflow at 375px; `/design` renders |

## What exists

- **Stack:** Next.js 16.3 (App Router, Turbopack) · React 19 · Tailwind v4 ·
  framer-motion · lucide-react · Vitest. Node 20 (`.nvmrc`).
- **`app/globals.css`** — all design tokens (`@theme`) and shape utilities
  (`headline`, `slant`/`unslant`, `pit-board`, `carbon-weave`, `kerb-stripe`,
  `chequered`, `live-pulse`), plus the CSS lights-out intro and page wipe.
- **`app/page.tsx`** — Paddock home: real standings (Drivers/Constructors tabs,
  season + round label), real next-session countdown and circuit card (round,
  sprint/standard format, race day in UTC, last winner), each with a fallback
  message if Jolpica is down; plus the sample Briefing, radio feed, rumor card,
  pecking order, predictions sheet and badges. `revalidate = 3600`.
- **`app/design/page.tsx`** — dev-only style guide (404 in production) showing
  every token and component.
- **`components/f1/`** — the F1 UI kit: `TimingTower`, `StandingsPanel`,
  `PitBoardCountdown`, `RadioCard`, `ShiftLightMeter`, `RumorCard`, `SectorChip`,
  `TyreDot`, `PowerRankRow`, `SeatBoard`, `TelemetryChart`, `PredictionSlip`,
  `StreakFlame`/`EnamelPin`, `TrackOutline`, `LightsOut`, `Wordmark`, header,
  footer (with the unofficial-site disclaimer) and mobile `BottomNav`.
- **`lib/`** — `color.ts` (`teamStyle`, AA-readable team text), `credibility.ts`
  (rumor status → shift lights), `time.ts` (countdown), `use-clock.ts`,
  `standings.ts` (`StandingRow`/`Standings` types), `schedule.ts` (session
  kinds, typical lengths, `upcomingSessions`/`nextSession`/`currentWeekend`),
  `jolpica.ts` (fetch + pure parsers for standings, calendar and a circuit's
  last winner), `teams.ts` (2026 team codes, short names and colours keyed by
  Jolpica `constructorId`) and `sample-data.ts`.
- **`components/f1/NextSessionCountdown.tsx`** — client wrapper around
  `PitBoardCountdown` that picks the session on the viewer's clock, with
  "Season complete" / "No signal" states.

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
- **Standings (Phase 1):**
  - Fetched server-side with `fetch(..., { next: { revalidate: 3600 } })`, at
    most two Jolpica calls an hour. No `cacheComponents`, so the previous caching
    model applies (`node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md`).
  - Jolpica's order is trusted (it applies countback on ties).
  - A driver who changed teams lists every team, oldest first; the **last** is
    the current seat (verified: Lawson `rb` → `red_bull` from R12).
  - Jolpica has no colours. `lib/teams.ts` copies OpenF1's `team_colour` for
    2026; unknown constructors get a neutral grey and a derived code. Update the
    map when the grid changes, or move it to Supabase `teams.color`.
  - Sample `constructorStandings` was removed; `/design` still uses sample
    `driverStandings`.
- **Calendar and countdown (Phase 1):**
  - `/current/` gives every session's UTC date and time. Sprint weekends use
    `SprintQualifying` and `Sprint` (older seasons `SprintShootout`), and the
    fields are not in time order, so the parser sorts them. Sessions without a
    time are dropped rather than counted down to a guess.
  - The server sends the next 12 unfinished sessions; the client picks the
    current one with `useClock`, so the board rolls over on time even though
    the page HTML can be an hour old. Before hydration it shows the first
    session, matching the server HTML.
  - A session counts as running for a typical length (practice/qualifying
    60 min, sprint qualifying 45, sprint 60, race 120), showing "LIGHTS OUT",
    then the countdown moves on. A long red flag can outlast that.
  - The circuit card follows the first weekend whose race hasn't finished.
    Last winner comes from `/circuits/{id}/results/1/`; new venues show "—".
  - Jolpica has no length, laps, DRS zones or layouts, so those fields were
    dropped. `TrackOutline` is still the sample shape, marked illustrative
    (visible caption + `illustrative` aria-label). Real outlines need another
    source (e.g. FastF1 position data).
  - Race day is shown in UTC because server-rendered dates can't know the
    viewer's timezone; the countdown already shows local time.
  - Sample `NEXT_SESSION`/`CIRCUIT` stay for `/design` only.
- **Mobile overflow fix:** at 375px the home page's second grid row was 388px
  wide (pre-existing, not caused by the standings). The implicit grid track
  grew to the Pecking order column's min-content, because `PowerRankRow`'s
  `truncate` name had no `min-w-0`. Fixed with `grid-cols-1` on that grid and
  `min-w-0` on the name. When measuring layout in the Browser pane, finish the
  `page-wipe` animation first: a background tab can freeze it at
  `translateX(32px)` and fake a 32px overflow.

## Next steps — Phase 1 (MVP)

1. ~~Real standings~~ — done.
2. ~~Real calendar + next session countdown + circuit card~~ — done. Possible
   follow-ups: a full calendar page, real circuit outlines.
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
