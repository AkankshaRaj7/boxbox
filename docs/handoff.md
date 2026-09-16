# Handoff — where BOXBOX stands

Read this first in a new session, then [plan.md](plan.md) for the full roadmap
and [../CLAUDE.md](../CLAUDE.md) for the rules.

_Last updated: 2026-09-16 — the Paddock now carries no invented data at all. Real race pace, fastest lap, driver-market stories and a generated Briefing replaced the last sample blocks, and the nav points at real pages. Next: deploy to Vercel Hobby._

## Start here (next session)

- **`main` is clean but NOT pushed — it is 7 commits ahead of `origin/main`.**
  The owner reviews before pushing; ask them before running `git push`.
  The seven, oldest first:
  | Commit | What it did |
  |---|---|
  | `bff65ec` | Nav points at real pages; predictions game removed |
  | `500b913` | Pace pipeline: `data/pace.json` from OpenF1 laps |
  | `d1973d1` | Real pecking order on `/pecking-order` and the Paddock |
  | `a14f9f3` | Real fastest lap, sectors and tyre |
  | `bb58350` | Silly Season shows real transfer stories |
  | `4bd6b25` | The Briefing is generated; sample-data notice removed |
  | `8967d5b` | Daily pace-refresh Action; docs brought up to date |
- **Next task: deploy to Vercel Hobby.** Supabase is deliberately *not* next —
  see "Why there is still no Supabase" below.
- Before coding: start the dev server with the Browser pane's `boxbox` config
  (port 4747), then confirm `npm test` (226), `npm run typecheck` and
  `npm run lint` pass. If another chat's BOXBOX server already holds 4747, use
  the `boxbox-attach` config, which attaches the pane to it instead.
- Working with the owner: finish and verify a change, then **ask before
  committing and pushing**; for look/sound/feel decisions, offer options with a
  recommendation. They hold the site to a real-F1 standard of quality, and have
  sent several rounds of art back for rework — check renders yourself first.
- **Not in the repo, and gone when this session's scratchpad is deleted:**
  - The owner's driver photos live in `~/Desktop/f1 drivers/` (22 files, not
    Tsunoda); the cut-outs in `public/drivers/*.webp` are git-ignored. If that
    folder is empty, driver pages simply fall back to helmets. To rebuild it,
    recreate the Python 3.13 venv with `rembg[cpu]`, `opencv-python-headless`,
    Pillow and `vtracer`, then redo `cutout_drivers.py` from its description in
    "Driver photos" below.
  - `render_car.py` / `render_helmets.py` (component SVG → PNG) and the
    reference photos under `refs/`: recipes are in "Owner feedback round 2".
  - The original 40 s car recording
    (`~/Downloads/freesound_community-f1-car-passing-66782.mp3`, needed only to
    re-cut the intro sound).
- This file is long; "Decisions made so far" is the reference for *why* things
  are built the way they are. Skim it before changing standings, calendar,
  circuits, news, pace or the intro.

## Status

**Phase 0 (setup + design system) is done. Phase 1 is under way:** the home
page shows real 2026 standings, a real next-session countdown and the real
upcoming circuit from Jolpica-F1, plus real headlines from six RSS feeds; the
full wire lives at `/news`. Every current driver and team has a page
(`/drivers/rus`, `/teams/red_bull`), linked from the standings tower and from
news tags. **Nothing on the Paddock is fictional any more:** the pecking order
comes from race-lap pace, the fastest lap and its sectors from OpenF1, Silly
Season from transfer-tagged wire stories, and the Briefing is generated from
the standings, calendar, pace and wire. `lib/sample-data.ts` is now reached
only by the dev-only `/design`. The predictions game was removed until Phase 3
gives it accounts.

| Check | Result |
|---|---|
| `npm test` | 226 tests pass (adds nav active state, the pace statistics and a guard over the committed `data/pace.json`, lap-time formatting, transfer filtering and the Briefing's lines) |
| `npm run typecheck` | Clean |
| `npm run lint` | Clean |
| Browser (2026-09-16, real data) | Paddock: Briefing reads "Antonelli leads Russell by 81 points, with 233 still on the table over nine rounds" / "Mercedes lead the constructors' by 145 from Ferrari" / "Mercedes have the quickest car of the last five races, 0.23% clear of Ferrari" / "Audi are the biggest climbers in the pecking order, up a place to fifth" — all four checked against the raw numbers. Fastest lap card: RUS 1:35.587 lap 49, hard tyre 20 laps old, S1 purple / S2 green / S3 yellow, each verified against the session's own sector bests. Silly Season shows its quiet-market state (0 of 72 wire stories are transfers). `/pecking-order` lists all 11 teams (Mercedes +0.14% → Cadillac +4.73%) with a 14-round trend chart whose McLaren line breaks at R2. Nav: `/news` highlights News, `/pecking-order` highlights Pace, `/#market` moves the marker. No overflow at 375px or 1280px on `/`, `/news`, `/pecking-order`; bottom nav is 4 equal columns; team names render in full in both the compact preview and the full table. Empty states rendered and checked for the pecking order, Silly Season and the Briefing. Six routes return 200, `/drivers/xyz` 404s, and a clean dev server logs no errors. |
| Browser (earlier rounds) | `/` shows standings after R14, countdown to R15 Azerbaijan FP1, Baku (real outline, 6.003 km, 51 laps, last winner VER 2025) and 3 real top stories; `/news` shows 89 live stories, filters work (Technical → 3 cards), all links external `https` with `noopener`, no images, no overflow at 375px; `/design` renders. Intro (real click): lights at 0.75/1.75/2.74/3.75/4.75 s; car pass checked without sound: car measured at 80 % of a 698 px screen (558 × 1508 px), pass 936 ms, cover and marks clips correct after the pass; page handed back with nothing inert (checked while the pane was visible); second visit and Esc skip go straight in. Car drawing and tyre marks checked as rendered PNGs. Sound files serve as `audio/mp4` and `audio/wav`; sound not listened to by Claude. Driver/team pages (step 4): `/drivers/rus` (P2, 211 pts, 6–8 qualifying and 4–10 race vs ANT), `/drivers/law` (team-change note, a head-to-head per seat), `/teams/red_bull` (VER 8–2 HAD, VER–LAW R12–R14), `/teams/rb`; no overflow at 375px; `/drivers/xyz` and `/teams/nope` 404; `/drivers/RUS` and `/teams/McLaren` 308 to lower case; standings rows link to driver pages; `/design` renders. Art round (2026-09-16): `/design` shows all 11 team cars and 23 helmets; `/drivers/nor` has the photo breaking out above the panel and the big mirrored helmet on the right at 1280px, the larger inline helmet beside the number at 375px; `/teams/mclaren` name in papaya, arrival frozen mid-drive shows the text still clipped and tyre marks uncovering behind the rear wheel, and at the stop the text is fully revealed with no clip left; no overflow at 375px on `/drivers/ver` or `/teams/rb` |

## What exists

- **Stack:** Next.js 16.3 (App Router, Turbopack) · React 19 · Tailwind v4 ·
  framer-motion · lucide-react · Vitest. Node 20 (`.nvmrc`).
- **`app/globals.css`** — all design tokens (`@theme`) and shape utilities
  (`headline`, `slant`/`unslant`, `pit-board`, `carbon-weave`, `kerb-stripe`,
  `chequered`, `live-pulse`), plus the lights-out overlay, intro car and
  tyre-mark styles, and the page wipe.
- **`app/page.tsx`** — Paddock home: real standings (Drivers/Constructors tabs,
  season + round label), real next-session countdown, circuit card (real
  outline, length, scheduled laps, round, format, race day in UTC, last
  winner) and a radio feed of the top 3 wire stories with a "Full wire" link,
  each with a fallback message if its source is down; a generated Briefing, the
  real fastest lap, real driver-market stories and a five-team pecking-order
  preview. `revalidate = 900`. No sample data.
- **`app/news/page.tsx`** — the full news wire (`revalidate = 900`): every story
  from the last 72 h with filters, and a notice naming any feed that failed.
- **`app/pecking-order/page.tsx`** — the full car pecking order: 11 teams, a
  season trend chart and a "How this is measured" note.
- **`app/design/page.tsx`** — dev-only style guide (404 in production) showing
  every token and component. The only reader of `lib/sample-data.ts`.
- **`components/f1/`** — the F1 UI kit: `TimingTower`, `StandingsPanel`,
  `PitBoardCountdown`, `RadioCard`, `ShiftLightMeter`, `RumorCard`, `SectorChip`,
  `TyreDot`, `PowerRankRow`, `PeckingOrderTable`, `FastestLapCard`, `SeatBoard`,
  `TelemetryChart`, `PredictionSlip` (`/design` only),
  `StreakFlame`/`EnamelPin`, `TrackOutline`, `LightsOut` (intro), `IntroCar`, `Wordmark`, header,
  footer (with the unofficial-site disclaimer) and mobile `BottomNav`.
- **`lib/`** — `color.ts` (`teamStyle`, AA-readable team text), `credibility.ts`
  (rumor status → shift lights), `time.ts` (countdown), `use-clock.ts`,
  `standings.ts` (`StandingRow`/`Standings` types), `schedule.ts` (session
  kinds, typical lengths, `upcomingSessions`/`nextSession`/`currentWeekend`),
  `jolpica.ts` (fetch + pure parsers for standings, calendar and a circuit's
  last winner), `teams.ts` (2026 team codes, short names and colours keyed by
  Jolpica `constructorId`), `circuits.ts` (layouts, length, scheduled laps),
  `lights.ts` (intro timing, car pick, car-pass keyframes), `intro-audio.ts`
  (beeps and the car recording) and `sample-data.ts` (now `/design` only).
- **Pace:** `lib/pace.ts` (lap filtering, `representativePace`, `teamPace`,
  `gapsToFastest`, `rankTeams`, `seasonTrend`, `peckingOrder`, and the typed
  `PACE` import of the committed data), `scripts/build-pace.mts`
  (`npm run data:pace`), `data/pace.json` (~6 KB, committed) and
  `.github/workflows/pace-data.yml` (daily refresh).
- **Briefing:** `lib/briefing.ts` — seven line generators, each returning a
  sentence or null, plus `pointsRemaining` for the championship arithmetic.
- **Nav:** `lib/nav.ts` (`activeNavHref`), `components/f1/nav-items.ts` and
  `components/f1/HeaderNav.tsx`.
- **New components:** `PeckingOrderTable` (with a `compact` mode for narrow
  columns) and `FastestLapCard`.
- **Driver and team pages:** `app/drivers/[code]/page.tsx` and
  `app/teams/[id]/page.tsx`; `lib/season.ts` (season model and pure stats:
  `driverStats`, `recentForm`, `teamSpells`, `headToHead`,
  `teammateHeadToHeads`, `teamRoster`, `teamHeadToHeads`, `teamStats`,
  `driverWeekends`, `teamWeekends`, `driverHref`/`teamHref`);
  `fetchSeasonResults`/`parseSeasonResults` in `lib/jolpica.ts`; components
  `Helmet`, `DriverHero`, `TeamHero`, `FormChips`, `HeadToHeadCard`,
  `StatStrip` and `NewsMentions`. New token `text-mega` (7rem race numbers).
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
  - Not built yet: light mode and number tickers. The plan's radio-beep toggle
    was replaced by the tap-to-start intro sound (see "Lights-out intro").
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
  - **No storage.** Feeds are fetched server-side with
    `fetch(..., { next: { revalidate: 900 } })`, like Jolpica. The
    `pace-data.yml` Action covers pace only; news has no job and no database,
    so the wire is a rolling 72 hours with no history. Storing first-seen times
    — a committed JSON written by an Action, or Supabase — is what would let
    formula1.com join the sources (its items carry no dates) and give Silly
    Season a memory longer than three days.
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
  - The nav's "News" item pointed at the home radio feed (`/#news`) until
    `bff65ec` repointed it at `/news`. See "Navigation" below.
- **Driver and team pages (Phase 1, step 4):**
  - Owner's choices: a **helmet + race number** hero, last-5 form as **position
    chips**, **teammate head-to-head** in scope; no `/drivers` or `/teams`
    index pages, no compare tool, no rumors section (no real rumor data until
    Phase 2), **no nav change** (pages are reached from standings rows and news
    tags).
  - Not asked, decided in build, worth confirming with the owner: the helmet is
    a **side view** (a top-down helmet read as a blob), and team pages reuse the
    intro's `IntroCar` turned nose-right as the hero.
  - URLs: `/drivers/{code}` (lower-case three-letter code, per plan.md) and
    `/teams/{constructorId}`; other casing gets a 308. Codes are unique within a
    season, which is all the pages cover. `generateStaticParams` returns `[]`,
    so pages render on first visit and revalidate every 15 min (news mentions);
    Jolpica responses keep their hourly cache.
  - Data: Jolpica's season-wide `/current/results/`, `/sprint/` and
    `/qualifying/`, paged at 100 rows: about ten requests shared by every page.
    **A round's rows can be split across two pages**, so the parser merges by
    round. Driver number, nationality and date of birth come from each driver's
    latest row. Pit-lane starts are grid `0` (shown "PL"); `null` means unknown.
  - **Jolpica rate limits bursts** (~4 requests/s): loading the pages in
    parallel on a cold cache returned 429. Pages now load one after another and
    `getJolpica` retries a 429 up to twice after `Retry-After` (max 5 s).
  - Rules: stats are Grand Prix only (wins, podiums, poles = qualifying P1,
    DNFs = started but unclassified); points include sprints; standings points
    and position are used when Jolpica's standings load. Head-to-heads count
    only rounds both drivers raced **for the same team** (so Hadjar R1–R11 and
    Lawson R12–R14 at Red Bull are separate pairings); qualifying counts rounds
    where both set a time; race counts finishing order, retirements included,
    when both started. Finish labels: DNF (R), DNS (W), DSQ (D), NC, EX, DNQ.
  - A driver not in the latest round (e.g. Hadjar) keeps a page with a "Not in
    the R14 line-up" note; a driver who changed teams gets a spell line and a
    team bar per round in the results table.
  - News mentions: up to 4 wire stories tagged with the driver or team (last
    72 h). Story tags now carry `href` and link to the pages.
  - Helmet (`components/f1/Helmet.tsx`, 260 × 240, facing right): tall shell,
    slim rear spoiler, crown intake, narrow tinted eyeport visor with pivot and
    tear-off tabs, chin vents and lip, generic white stripe, race number on the
    rear. No real driver designs. Size it with a width class (no default width).
- **Driver and team pages → Owner feedback round 2 (2026-09-16):**
  - Asked for: real per-driver helmet designs, driver photos, a car that looks
    like the real one, team logos, a car pass with the intro sound and fading
    tyre marks on team pages, pose-video driver cards "coming out of the frame",
    and a glowing team-colour outline on surnames.
  - **Not allowed, told the owner:** team logos (CLAUDE.md; trademarks) and
    official F1/team photos or pose videos (copyright; CLAUDE.md bans press
    photos). Sponsor and team logos are left off helmets and cars.
  - **Surname glow:** `team-glow` utility in `globals.css` (text stroke plus
    layered text-shadow in `--team`), used on the `DriverHero` h1. Done.
  - **Helmets:** `lib/helmet-designs.ts` holds per-driver designs (base,
    crown, lower, stripe, band, chin, `maze` noise pattern or `pinstripes`,
    visor tint); everyone else gets a team-colour helmet with the race number.
    First batch: Norris (lime with dark maze), Hamilton (yellow, red pinstripes
    and chin), Verstappen (white, red patterned crown, navy lower), from 2026
    Commons race photos (Liauzh, CC BY 4.0, "2026 Chinese GP" series) and a
    CC BY-SA Norris 2025 helmet drawing used for proportions only. `Helmet.tsx`
    silhouette was measured from that drawing's alpha mask. Owner said the
    first render was "flat or cartoonish" with fake visor/hardware; it now has
    clear-coat reflections, eyeport shadow, a smoked visor with sky/ground
    reflection, tear-offs, a slim pivot plate and a small neck post. The owner
    approved that version, and the other 19 drivers followed.
  - **Whole grid (after approval):** every team and 22 of 23 drivers who have
    raced in 2026 come from one CC BY 4.0 set by Liauzh on Commons
    ("2026 Chinese GP - <Team> - <Driver> - <Session>", 32 photos; qualifying
    shots are the most side-on). Tsunoda has no photo and keeps a team-colour
    helmet. Helmet designs for the other 19 are read from distant race photos,
    so main colours and panels are reliable and fine artwork is approximated.
  - **Car review workflow, per team:** cut out with rembg (isnet-general-use),
    flip nose-right at 1200 wide, contour → outline path; view 2× grid halves;
    write wheels, far wheel, panels, cockpit, halo, mirror, shading and
    highlights; render from `/design` and fix. First drafts written from 1×
    grids for all 10 teams at once were poor (misplaced panels, shadow tails),
    which is why each car was redone from the 2× grids. `SideCar` now clips
    everything below the tyre contact line (`groundCut`), draws far-side
    wheels only above the nose line (`highlights[0]` must be that line), and
    supports tyre compound, livery wheel covers and a painted halo. Tests
    check wheels, ground line, credits, `groundCut` and that rain lights sit
    clear of the wheels. `ready` gates a drawing onto the team page; all 11
    are ready.
  - **Team cars:** owner chose **vector drawn over a free-licensed photo**.
    `lib/car-art.ts` per team: outline from the photo cut-out's mask, livery
    panels and wheels measured on a grid, shading, foreground panels, cockpit,
    photo credit (CC BY needs it; shown under the team hero). `SideCar.tsx`
    renders it. McLaren only so far (from "2026 Chinese GP - McLaren - Lando
    Norris - FP1", Liauzh, CC BY 4.0); the other ten followed after approval. Rejected on the way: a hand-coordinate car (cartoonish),
    photo inpainting of logos (smudges) and colour-flattening + vtracer
    (camouflage blobs, 1 MB).
  - **Team-page arrival:** owner chose **drive in and stop** (not pass-through).
    `lib/team-pass.ts` (tested) + `TeamCarPass.tsx`: the car is heard first
    (intro recording, peak ~35 % into the drive), drives in from the left edge
    with a hard-braking easing, stops exactly over the parked car
    (`data-parked`), and tyre marks behind the rear wheel hold 0.9 s then fade
    1.8 s. Sound only after user activation (`navigator.userActivation`);
    silent on direct loads; nothing moves under reduced motion. Verified on
    `/teams/mclaren`: `driving` → `parked`, marks faded, no errors.
  - **Driver photos (2026-09-16):** the owner supplied 22 photos in
    `~/Desktop/f1 drivers/` (not Tsunoda). They look like team, press and
    Pinterest/social images (736 px wide, screenshots, official portraits,
    memes) with no licence. The owner was told this conflicts with the
    no-press-photos rule and chose to **use them all for now and replace them
    later**, including the unsuitable ones (Verstappen's middle finger,
    Leclerc with a vodka bottle, the Hulk edit of Hulkenberg). So they are
    **local only**: cut-outs go to `public/drivers/{driverId}.webp`, which is
    git-ignored and never committed or deployed. `lib/driver-photos.ts`
    returns a photo only when the file exists, so the live site falls back to
    helmets. Replace these with licensed photos (e.g. the CC BY-SA "at the
    Melbourne Walk during the 2026 Australian Grand Prix" Commons series,
    ~15 drivers) before publishing any.
  - **Cut-outs:** `cutout_drivers.py [driverIds]` (scratchpad): rembg
    isnet-general-use (u2net_human_seg for Alonso, whose skin matched the
    white background), keeps connected shapes ≥ 6 % of the largest, feathers
    the edge, fits the figure bottom-centred on a transparent 600 × 800
    canvas. Pre-crops: Alonso's print frame, the Hulkenberg title. Leftovers:
    a pink streak by Gasly, a chair edge by Hadjar.
  - **Pop-out:** `DriverHero` renders the photo in an overlay layer above the
    panel (the panel's pit-board clip-path would clip anything above its top
    edge), in the same grid as the panel so the column lines up; the photo is
    135 % of the panel height, anchored to its bottom, so the head breaks out
    over the top. The stat strip moved outside the panel. Team roster cards do
    the same. `.driver-pop` (rise-in, then a slow 7 s breathe) and
    `.driver-spotlight` (team-colour glow) are in `globals.css`; the animation
    is off under reduced motion. A driver without a photo keeps the big helmet.
  - **Round 3 (2026-09-16):** owner said the helmets had become too small.
    With a photo, `DriverHero` now uses a three-column grid from md up (photo |
    name | helmet): the helmet is large on the right, mirrored with
    `-scale-x-100` to face the driver (so no race number on it, which would
    read backwards), with a mirrored team-colour spotlight. Below md it sits
    beside the race number (w-24/w-28). Team roster cards show it on the right
    (w-20). Without a photo the big helmet stays in the first column.
  - **Team hero text:** the team name is in `--team-text`. The text block is
    `data-reveal`; `revealKeyframes` (lib/team-pass.ts, tested) clips it
    left to right just behind the car's tail as it passes (behind the nose in
    stacked layouts, where the text sits above the car's path), run with the
    drive-in's timing and `fill: "backwards"` so no clip remains afterwards.
    To avoid a flash of the server-rendered text and parked car before the
    drive-in, the pre-paint script in `app/layout.tsx` sets `data-js` on
    `<html>` and globals.css hides `[data-parked]`/`[data-reveal]` while
    `.team-pass[data-pass="idle"]` (motion allowed only). `TeamCarPass` sets
    `static` when it doesn't animate, so nothing stays hidden.
  - **Tyre marks bug:** the marks had never been visible. `.team-pass__marks`
    was 0 px tall and animates `clip-path`, which clips to the element's own
    box, so everything was cut away. It is now 1.75rem tall with a negative
    margin centring the near mark on the ground line. They were also
    restyled for the near-black panel: lit top and bottom edges and fine light
    striations over a black core.
  - **Verifying the arrival:** pause the stage's Web Animations
    (`document.getAnimations()` filtered to `.team-pass` targets), set
    `currentTime`, wait ~1 s for the pane to repaint, then measure
    (`getComputedStyle(...).clipPath`) or screenshot. Screenshots taken
    straight after pausing can show a stale frame.
  - **Tools (scratchpad only, not in the repo):** a Python 3.13 venv with
    `rembg[cpu]`, `opencv-python-headless`, `vtracer`, Pillow (the rembg model
    downloads to the scratch folder). Recipes: Commons API `iiurlwidth` for
    large thumbnails, `sips` crops, alpha-mask contour → Catmull-Rom path, grid
    overlays for measuring, and rendering a component's SVG from page HTML
    with tokens inlined, placed on a square canvas so `qlmanage` doesn't crop.
    The Browser pane's screenshots go stale when it is hidden.
- **Team colour overrides:** OpenF1's Audi red (`#f50537`) was nearly
  identical to Ferrari's (`#ed1131`, ΔE 3.7), and Cadillac/Haas were both
  greys. In `lib/teams.ts` Audi is now a deeper crimson `#c4002f` (ΔE 16.7 from
  Ferrari, 15 under deuteranopia), Cadillac a mid grey `#767a7d` and Haas silver
  `#c3c7cb` (ΔE 29). `lib/teams.test.ts` keeps both pairs ≥ 1.3:1 apart in
  lightness and every livery bar ≥ 3:1 against the page. Recheck if OpenF1
  colours are ever pulled in automatically.
- **Lights-out intro (replaces the 1.6 s CSS-only intro; deviates from plan.md's
  "radio-beep toggle, off by default"):**
  - Browsers block sound until a click, so the first visit of a session shows a
    **tap-to-start screen** ("Lights on" / "Enter without sound", Esc skips).
    Chosen by the user over silent auto-play.
  - Real cadence (`lib/lights.ts`): first light 0.7 s after the tap, one per
    second, random 0.5–1.5 s hold, lights out ≈ 5.2–6.2 s. Skip button throughout.
  - **Beeps** are synthesised with Web Audio (`lib/intro-audio.ts`): an 880 Hz
    beep per light. The context is created inside the click.
  - **Car pass** (replaced an earlier zoom-in "page arrival" and a synthesised
    engine, which the user said didn't sound like F1): at lights out a car in a
    random 2026 team colour (`pickCar`) crosses the screen up or down at a
    constant 2600 px/s. The car is **80 % of the screen width** (user's request,
    `CAR_WIDTH_SHARE`), so on desktop it is longer than the screen is tall;
    `carPassDuration` (tested) turns that into 0.8–1.8 s, fixed at the start tap
    so the sound lines up. `carPassKeyframes` (tested) drives three Web
    Animations: the car, the dark cover cut away behind the car's middle to reveal
    the page, and rear-tyre marks growing behind the rear axle (`REAR_AXLE`
    915/1080). The marks hold 0.9 s, then fade over 1.1 s. Skip or Esc at any
    point goes straight to the page with no car and no sound.
  - `IntroCar` is our own detailed top-down SVG of a 2026-style car (400 × 1080):
    four-element front wing, stepped nose, halo and driver, sidepods with inlets,
    undercuts and louvres, coke-bottle engine cover, floor edges, suspension,
    diffuser, beam and rear wing. Shaded with gradients from `--team` and tokens;
    no logos, sponsors or team-specific livery. Pass a unique `idPrefix` when
    several render on one page (gradient ids). Shown in `/design`.
  - **Tyre marks** (`.lights-out__mark` in globals.css): each rear tyre gets a
    near-solid dark rubber band with lengthwise striations, masked by an SVG
    `feTurbulence` grain (one image stretched over the whole band; tiling it
    left visible seams) and an uneven lengthwise fade, plus a faint light
    "scuff" edge layer so the marks show on the near-black page background.
  - **Car sound:** "F1 Car passing" by robbo799 (Freesound) from Pixabay, Pixabay
    Content License (no credit required; editing into a new work allowed; no
    standalone redistribution). Pixabay's CDN returns 403 to scripts, so the user
    downloaded it by hand. The 40 s recording has an almost continuous engine note
    with six loudness peaks; pitch analysis couldn't find a clear Doppler drop,
    so the clip is the peak with the sharpest rise-and-fall shape, 24.2 s in:
    3 s cut (1.6 s before to 1.4 s after), cosine fades, levelled to −1 dBFS.
    Files: `public/sounds/car-pass.m4a` (AAC 64 kbps, 27 KB) with a
    `car-pass.wav` fallback (22 kHz mono, 136 KB) for browsers without AAC;
    `CAR_SOUND.peakAt` 1.6 s. The player aligns the peak with the car crossing
    mid-screen and never starts before lights out. The user compared this cut (C)
    with alternatives at 8.9 s (A) and 17.0 s (B) and confirmed C. Tools: `afconvert` (no
    ffmpeg on this machine) and Python `wave`.
  - **Checking visuals when the Browser pane is hidden:** screenshots time out
    and animations don't advance there. Render components to static SVG in a
    scratch vitest run (`renderToStaticMarkup`, with the tokens and used classes
    inlined), then `qlmanage -t` turns SVG or HTML into a PNG you can look at.
  - States live on `<html data-intro>`: `start` (set before first paint by the
    script in `app/layout.tsx` when `sessionStorage["bb-lights"]` is unset and
    reduced motion is off), `lights`, `car`, then removed. Without
    JavaScript or under reduced motion the overlay never shows. While it is up,
    scroll is locked and the rest of `<body>` is `inert`.
  - `LightsOut inline` (in `/design`) runs the same sequence without touching the
    page state or the session flag.
  - Browser automation: a synthetic Enter key did not activate the focused
    button (real keyboards do); test with a click.
- **Mobile overflow fix:** at 375px the home page's second grid row was 388px
  wide (pre-existing, not caused by the standings). The implicit grid track
  grew to the Pecking order column's min-content, because `PowerRankRow`'s
  `truncate` name had no `min-w-0`. Fixed with `grid-cols-1` on that grid and
  `min-w-0` on the name. When measuring layout in the Browser pane, finish the
  `page-wipe` animation first: a background tab can freeze it at
  `translateX(32px)` and fake a 32px overflow.

- **Navigation (2026-09-16):**
  - The five nav items used to be hash anchors on the home page, so every click
    scrolled the same page and `/news` — the one built-out page — was reachable
    only from a small "Full wire" link. Items now carry real hrefs: News →
    `/news`, Pace → `/pecking-order`, Market stays a Paddock section until the
    rumor admin flow gives it a page's worth.
  - `activeNavHref` decides the current item from the route, or from the hash on
    the Paddock page, and is shared by the header and the tab bar.
  - Section links stay plain `<a>`, not `Link`: a real hash navigation is what
    fires the `hashchange` the marker listens for.
  - **The predictions game was removed**, not hidden — it cannot be anything but
    fictional without accounts and storage, so it waits for Phase 3. Its
    components live on in `/design`. The bottom nav is now four columns.
- **Car pace (2026-09-16):**
  - Method, as stated on the page: per driver, drop untimed laps, the lap out of
    the pits and the lap they pitted on; take the median; drop laps more than 7%
    off that median; take the median again. Per team, keep the **quicker car**,
    so a retirement or an afternoon in traffic doesn't become the team's pace. A
    driver needs 25% of the busiest driver's laps to count at all.
  - Ranking averages the gap to the quickest car over the **last five races**. A
    single race moves a team a percent either way on strategy alone, so a
    one-race ranking is noise.
  - **Races come from Jolpica's calendar, not OpenF1's.** The two disagree about
    2026: OpenF1 has races at Sakhir (12 Apr) and Jeddah (19 Apr) that Jolpica's
    23-round calendar does not list. Standings, driver pages and the countdown
    are all Jolpica's, so the pecking order must rest on the same rounds.
    Sessions are matched by date.
  - Drivers are joined OpenF1 number → TLA → Jolpica constructor **per round**,
    which handles mid-season seat changes. All 22 acronyms matched for R14.
  - The numbers were validated twice: a Python prototype first, then the
    TypeScript reproduced it to the decimal; and the fastest lap the pipeline
    extracts (RUS, lap 49, 95.587 s) matches Jolpica's independently reported
    `1:35.587` on lap 49.
  - Two teams are missing from one round each (McLaren R2, Cadillac R8) because
    neither car completed enough laps. `rankTeams` counts a team only for the
    races it appears in, and the trend chart breaks the line rather than drawing
    through the gap.
- **OpenF1 quirks, all learned the hard way:**
  - It answers **429** when rushed. The script waits 0.7 s between requests and
    backs off 10/20/30 s on a 429.
  - It answers **404**, not an empty list, for a race that hasn't run.
  - `session_type=Race` includes sprints; filter on `session_name === "Race"`.
  - A race is only read **six hours after it starts**, so a scheduled run during
    a Grand Prix cannot record a half-finished one.
  - Rounds already in `data/pace.json` cost no requests, and an unchanged run
    leaves the file byte-identical so the Action commits nothing.
- **`tsx` is a devDependency** because Node 20 cannot run TypeScript, and the
  build script and the site should share one tested implementation of the
  statistics rather than keeping them in a second language. The script is
  `.mts`: `package.json` has no `"type": "module"`, so a `.ts` script would be
  compiled as CJS and top-level `await` fails.
- **The Briefing (2026-09-16):**
  - Voice is **pit-wall factual**, chosen by the owner over a team-radio voice
    and a timing-screen terse one.
  - Every line is a fact computed in `lib/briefing.ts`. **No LLM**, per the
    zero-cost rule, and nothing invented.
  - Each generator returns a sentence **or null**, and the panel takes the first
    four that fire, so a quiet day shortens the briefing instead of padding it.
  - Lines are ranked so synthesis outranks anything already visible on another
    card. `paceAgainstPoints` only fires when the quickest car is *not* leading
    the constructors', so it is silent while Mercedes lead both.
  - The title-clinched line needs the lead to **exceed** the points still
    available; a lead exactly equal to them still leaves a countback tie.
- **Silly Season (2026-09-16):** real transfer-tagged wire stories, ranked by how
  many outlets carry them, with **no credibility rating** — grouping real rumors
  and weighing them needs the Phase 2 admin flow, and an unreviewed rating would
  be guessing about a real person's career. Expect it to be empty often: on
  2026-09-16 none of 72 wire stories was a driver-market story, which is the
  market rather than a broken classifier (checked: "Hamilton signs new Ferrari
  contract", "Verstappen linked with Mercedes move" and "Alpine confirm 2027
  line-up" all classify as transfers; "Honda replaces its F1 engine development
  chief" correctly does not).
- **Why there is still no Supabase.** The owner asked what it was for, and the
  honest answer is that nothing built so far needs it: every page is live data
  on a cache timer. It becomes necessary for **sign-in, the predictions game and
  leagues** (Phase 3) and for **admin-approved rumors** (Phase 2). Until then a
  scheduled job writing a committed JSON file — the pattern `data/pace.json`
  now uses — covers anything a job computes and the site only reads, with no
  account and no free-tier project to keep awake. Deploy first.

## Next steps — Phase 1 (MVP)

1. ~~Real standings~~ — done.
2. ~~Real calendar + next session countdown + circuit card~~ — done, including
   real layouts, length and scheduled laps. Possible follow-up: a full calendar page.
3. ~~News wire~~ — done. Follow-ups: strip long RaceFans " | …" title suffixes;
   add formula1.com once first-seen times are stored; deep-link the Silly
   Season "Full wire" at a pre-filtered `/news`. That needs the URL **hash**,
   the way the nav already works — reading search params would force `/news` to
   render dynamically instead of being cached every 15 minutes.
4. ~~Driver and team pages~~ — done. Follow-ups: swap the owner's photos for
   licensed ones before any deploy (they are git-ignored, so the live site shows
   helmets); the compare tool and `/drivers`/`/teams` index pages were left out
   by choice; a pre-season visit 404s every page until round 1 has results;
   Tsunoda has no photo or helmet design.
5. ~~Replace the remaining sample data~~ — done: nav and routes, the pace
   pipeline, the pecking order, the fastest lap, Silly Season and the Briefing.
   `lib/sample-data.ts` is now `/design` only.
6. **Deploy to Vercel Hobby.** Before deploying, note:
   - Driver photos are git-ignored, so deployed driver pages show helmets.
   - `.github/workflows/pace-data.yml` pushes to `main`; make sure Vercel
     redeploying on every such commit is what you want.
   - `/design` 404s in production by design.
   - The site fetches Jolpica and the RSS feeds on each revalidate; only the
     pace data is precomputed.
7. **Supabase** only when Phase 2 rumors or Phase 3 accounts need it — see
   "Why there is still no Supabase". The owner creates the free accounts
   themselves; never add a payment method.

Small follow-ups, none urgent:

- `components/f1/SeatBoard.tsx` imports the `SeatStatus` *type* from
  `lib/sample-data.ts`. Nothing on the live site renders SeatBoard, so no page
  carries sample data, but the type belongs in `lib/` proper — tidy it when
  Silly Season gets its Phase 2 work.
- `classify` files "Honda replaces its F1 engine development chief" as technical
  and "F1 announces 2027 calendar" as race-reports. Both are defensible, neither
  is a transfer misfire, so they were left alone.

Phase 2 candidates: the rumor admin flow behind Silly Season, a `/races/[slug]`
hub, and a championship calculator built on `pointsRemaining` in `lib/briefing.ts`.

## Gotchas

- Before first `tsc`, run `npm run typecheck` (it runs `next typegen` so
  `LayoutProps` types exist).
- Don't run `npm run build` while the dev server is running — they share `.next/`.
- Next.js 16 differs from older versions: check `node_modules/next/dist/docs/`
  before using an unfamiliar API (see AGENTS.md).
- If port 4747 is "in use", a previous BOXBOX dev server is still running —
  reuse it rather than starting another (Browser pane: `boxbox-attach`).
- The Browser pane's `zoom` action isn't supported; to inspect an SVG closely,
  enlarge it temporarily with `javascript_tool` and take a screenshot.
- **Screenshots are unreliable while the Browser pane is hidden** — scrolling
  doesn't repaint, so you get a blank image. Read the DOM with `javascript_tool`
  or `read_page` instead, and don't trust digits read off a scaled screenshot
  (a 1.90% was misread as 1.98% that way).
- **Don't trust a Fast Refresh error.** A 500 seen mid-edit can be a stale
  intermediate state; restart the dev server and re-sweep the routes before
  chasing it. The browser console keeps errors across navigations, so check the
  *server* log for whether a problem is still live.
- **Implicit grid tracks size to min-content**, which overflows at 375px. Both
  the home page and `/pecking-order` needed an explicit `grid-cols-1`. And a
  fix that is viewport-based (`hidden sm:block`) does **not** cover a narrow
  column on a wide screen — that is what `PeckingOrderTable`'s `compact` mode
  is for.
- Adding a field to `fastestLap` in `data/pace.json` needs the stored one
  cleared first (set it to `null`), or `--all`: the script keeps a stored
  fastest lap when it is already current.
- Scratch checks against real Jolpica JSON: a vitest config outside the repo
  can't resolve `vitest`; symlink the repo's `node_modules` next to it.
