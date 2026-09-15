# Handoff — where BOXBOX stands

Read this first in a new session, then [plan.md](plan.md) for the full roadmap
and [../CLAUDE.md](../CLAUDE.md) for the rules.

_Last updated: 2026-09-15 — Phase 1, steps 1–3 (standings, calendar + countdown, news wire) done._

## Status

**Phase 0 (setup + design system) is done. Phase 1 is under way:** the home
page shows real 2026 standings, a real next-session countdown and the real
upcoming circuit from Jolpica-F1, plus real headlines from six RSS feeds; the
full wire lives at `/news`. The briefing, fastest-lap panel, rumors, pecking
order and game are still fictional sample data, and the page says so.

| Check | Result |
|---|---|
| `npm test` | 122 tests pass (adds RSS parsing, tagging, topics, grouping, relative time) |
| `npm run typecheck` | Clean |
| `npm run lint` | Clean |
| Browser | `/` shows standings after R14, countdown to R15 Azerbaijan FP1, Baku (real outline, 6.003 km, 51 laps, last winner VER 2025) and 3 real top stories; `/news` shows 89 live stories, filters work (Technical → 3 cards), all links external `https` with `noopener`, no images, no overflow at 375px; `/design` renders |

## What exists

- **Stack:** Next.js 16.3 (App Router, Turbopack) · React 19 · Tailwind v4 ·
  framer-motion · lucide-react · Vitest. Node 20 (`.nvmrc`).
- **`app/globals.css`** — all design tokens (`@theme`) and shape utilities
  (`headline`, `slant`/`unslant`, `pit-board`, `carbon-weave`, `kerb-stripe`,
  `chequered`, `live-pulse`), plus the CSS lights-out intro and page wipe.
- **`app/page.tsx`** — Paddock home: real standings (Drivers/Constructors tabs,
  season + round label), real next-session countdown, circuit card (real
  outline, length, scheduled laps, round, format, race day in UTC, last
  winner) and a radio feed of the top 3 wire stories with a "Full wire" link,
  each with a fallback message if its source is down; plus the sample Briefing,
  fastest lap, rumor card, pecking order, predictions sheet and badges.
  `revalidate = 900`.
- **`app/news/page.tsx`** — the full news wire (`revalidate = 900`): every story
  from the last 72 h with filters, and a notice naming any feed that failed.
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
- **News lib:** `lib/rss.ts` (RSS 2.0 parsing and cleanup via `fast-xml-parser`),
  `lib/news.ts` (sources, tagging, topics, grouping, `fetchNews`/`loadWire`) and
  `lib/news-model.ts` (shared `Story`/`Topic`/`TOPICS` types with no runtime
  imports, so the parser never ships to the browser). `lib/time.ts` gained
  `formatAgo` and `formatUtcStamp`.
- **News components:** `RadioCard` (now takes `tone`, `publishedAt`, driver/team
  `tags` and `alsoOn` links), `StoryCard` (Story → RadioCard, red flag when
  breaking), `NewsWire` (client-side filter buttons with counts) and `TimeAgo`
  (live relative time, UTC stamp before hydration).

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
  - Jolpica has no length, laps or layouts. See "Circuit layouts" below.
  - Race day is shown in UTC because server-rendered dates can't know the
    viewer's timezone; the countdown already shows local time.
  - Sample `NEXT_SESSION`/`CIRCUIT` stay for `/design` only.
- **Circuit layouts (Phase 1):**
  - Layouts and lengths come from [bacinger/f1-circuits](https://github.com/bacinger/f1-circuits)
    (MIT). `npm run data:circuits` (`scripts/build-circuits.mjs`) downloads it
    and writes `data/circuits.json` plus `data/circuits.LICENSE.md` (keep the
    licence file; MIT requires the notice). Output is committed; the site makes
    no request for it. Rerun when a new venue joins the calendar.
  - Tracks are matched to Jolpica `circuitId` by nearest location (all 40 within
    1.3 km). `lib/circuits.test.ts` fails if any 2026 calendar circuit is missing.
  - `lib/circuits.ts` projects [lon, lat] to a north-up SVG path (equirectangular
    around the mean latitude) and computes **scheduled** laps: fewest laps over
    305 km, 260 km at Monaco. Matches real counts for Albert Park, Monaco, Baku,
    Singapore and COTA. Jolpica's winner laps weren't used: shortened races
    (e.g. Canada 2026 shows 68, not 70) would mislead.
  - No start/finish marker on real layouts: the source doesn't say where the
    line is (track first points are 100 m–1 km from its own location points).
    `Outline.start` is optional; only the `/design` sample sets it.
  - **DRS no longer exists** (2026 rules: active aero straight mode + overtake
    mode), so DRS zones were removed everywhere, not replaced.
  - Rejected sources: MultiViewer's circuit API (no published terms for public
    sites; returned 2022 data for 2026) and OpenF1 `circuit_image`
    (formula1.com assets).
  - The card credits "f1-circuits (MIT)" with a link.
- **News wire (Phase 1):**
  - **No Supabase yet.** Feeds are fetched server-side with
    `fetch(..., { next: { revalidate: 900 } })`, like Jolpica; no storage, no
    GitHub Action. Moving ingest to Actions + Supabase later would add
    "first seen" times and history.
  - **Sources** (`NEWS_SOURCES`, all tier-1): BBC Sport, Autosport,
    Motorsport.com, The Race (`/rss/`; `/feed/` redirects there), RaceFans and
    Sky Sports. The Race and RaceFans mix series, so they keep only items whose
    categories match Formula 1/F1. A failing feed is skipped and named on `/news`.
  - **Skipped for now:** formula1.com (items have no date, so they can't be
    placed on a time-ordered wire without our own first-seen storage), FIA
    (all championships, HTML-junk descriptions), Reddit (API terms, blocks
    server requests).
  - **What is shown:** headline, a plain-text publisher description cut to 220
    characters (HTML, "Keep reading" and "The post … appeared first on"
    removed), source, time and link. No bodies, no images. Links drop
    `utm_*`/`at_*` params; non-http(s) links are rejected.
  - **Dates:** Sky uses "BST", which `Date.parse` can't read; `parseFeedDate`
    maps BST/CET/CEST/UTC. Items older than 72 h, undated, or more than 1 h in
    the future are dropped (BBC's feed carries items over a year old).
  - **Tagging:** drivers by surname from the live standings (accents ignored,
    whole words, coloured by team); teams by hand-written patterns in
    `TEAM_PATTERNS` ("Red Bull" not "Red Bull Ring", Sauber → Audi, Racing
    Bulls/VCARB → RB). Without Jolpica, only team tags appear.
  - **Topics:** keyword rules over headlines + feed categories. Transfers first:
    contract/seat/line-up/silly season/driver market always count; personnel
    words (signs, joins, replaces, linked…) only count when a driver is named, so
    "Honda replaces engine chief" is Technical. Then Technical, then Race reports
    ("wins", not bare "win", which appears in "lost win" stories), else News.
    Breaking = 3+ outlets within 6 h.
  - **Grouping:** TF-IDF over headline (weighted ×2) + description; articles
    oldest first join the most similar group by combined vector, only across
    different outlets and within 24 h. Thresholds 0.38 (or 0.30 with a shared
    driver/team tag) were tuned on a real snapshot: 116 articles → 89 stories,
    with no false merges found. At 0.25 the common ANT tag merged a standings
    story with "Hamilton forced to retire". Some rewrites still stay separate
    (e.g. the two pole stories). To re-tune, dump pairwise cosine scores
    for cross-outlet pairs, as in this session's dry run.
  - Autosport and Motorsport.com are sister sites with rewritten headlines. They
    count as separate outlets for now; Phase 2 rumor credibility needs
    "independent outlets", so group them by owner then.
  - The mobile nav "News" item still jumps to the home radio feed (`/#news`);
    `/news` is reached from its "Full wire →" link.
- **Mobile overflow fix:** at 375px the home page's second grid row was 388px
  wide (pre-existing, not caused by the standings). The implicit grid track
  grew to the Pecking order column's min-content, because `PowerRankRow`'s
  `truncate` name had no `min-w-0`. Fixed with `grid-cols-1` on that grid and
  `min-w-0` on the name. When measuring layout in the Browser pane, finish the
  `page-wipe` animation first: a background tab can freeze it at
  `translateX(32px)` and fake a 32px overflow.

## Next steps — Phase 1 (MVP)

1. ~~Real standings~~ — done.
2. ~~Real calendar + next session countdown + circuit card~~ — done, including
   real layouts, length and scheduled laps. Possible follow-up: a full calendar page.
3. ~~News wire~~ — done (see "News wire" above). Follow-ups: point the nav's
   "News" item at `/news`, add formula1.com once first-seen times are stored,
   strip long RaceFans " | …" title suffixes.
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
