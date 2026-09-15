# BOXBOX — Plan

## Context
F1 fans jump between formula1.com, Autosport, The Race, Reddit, YouTube and X to learn who's leading, whose car is quickest and who's switching teams. **BOXBOX** puts all of that on one site that looks like a pit wall and gives fans a reason to come back every day.

### Requirements checklist
Everything the user has asked for so far:
| # | Requirement | Where it's covered |
|---|---|---|
| 1 | All F1 news in one place, no hopping between sites | §4C News wire |
| 2 | Who is currently leading | §4A Paddock, §4B Race hub |
| 3 | Who has the best car | §4E Pecking order |
| 4 | Who is changing teams | §4D Silly Season |
| 5 | Interesting and addictive | §4G Engagement |
| 6 | The look must scream F1 | §3 Design theme |
| 7 | **No subscriptions and no money spent anywhere** | §2 Free stack |
| 8 | Project folder is now `~/Desktop/BOXBOX` | §1 |
| 9 | **Must not clash with the tutorAI project** | §1 Isolation |
| 10 | A plan for the design theme | §3 |

---

## 1. Keeping it separate from tutorAI
These are the checks I ran on this machine and what they mean for BOXBOX.

| What could clash | What's on this Mac | BOXBOX rule |
|---|---|---|
| **Folder / repo** | tutorAI is at `~/Documents/SororaLearning/tutorAI`. `~/Desktop/BOXBOX` exists and is empty | BOXBOX gets its own `git init` and its own GitHub repo under the user's account. It never goes inside tutorAI, and it stays off the "TutorAI" GitHub Project board |
| **Claude Code session** | This session is rooted in tutorAI, so tutorAI's CLAUDE.md, graphify hooks, memory and permissions all load here | **Build BOXBOX in a new Claude Code session opened on `~/Desktop/BOXBOX`.** BOXBOX gets its own `CLAUDE.md`, `.claude/settings.json` and `.claude/launch.json`. Claude's memory is stored per folder, so it stays separate automatically |
| **Ports** | In use now: 3000, 4200, 5000, 5432, 6333/6334, 7000, 8000, 8080, 8384, 9010, 9200, 9280. tutorAI worktrees can also claim frontend ports 3000–4500 and backend/AI ports 8000–9580 (steps of 100), plus the studio server on 8500 | **The BOXBOX dev server runs on port 4747**, fixed in `package.json` (`next dev -p 4747`) and `launch.json`. No local database at all: Supabase runs in the cloud, so nothing touches 5432 or 6333. We skip the Supabase local Docker stack |
| **Start/stop scripts** | tutorAI's `start-local.sh`/`stop-local.sh` stop processes by port and by checkout | They are never run for BOXBOX. BOXBOX uses plain `npm run dev` |
| **Git identity** | The global git user is *Prabhat Pannu <pannuprabhat@gmail.com>* | Set a **repo-only** git identity inside BOXBOX (`git config user.name/user.email`), confirmed with the user. Global config stays unchanged |
| **Dependencies** | tutorAI uses Next 14, Python 3.13 venvs, Java 21 | BOXBOX has its own `node_modules`, pinned Node (`.nvmrc`), and its own Python venv at `BOXBOX/workers/.venv`. No global installs, no shared lockfiles |
| **Secrets / env** | tutorAI has its own `.env` | BOXBOX has its own `.env.local`, Supabase project and Vercel project. No tutorAI keys are reused. `.env*` goes in `.gitignore` |
| **Browser sign-in** | tutorAI runs at localhost:3000 | Port 4747 is a different browser origin, so saved logins and site data never mix |

---

## 2. Free stack (₹0 / $0)
| Layer | Choice | Free-tier notes |
|---|---|---|
| Web app | Next.js (App Router) + TypeScript + Tailwind + Framer Motion | Open source |
| Hosting | Vercel Hobby at `boxbox-<name>.vercel.app` | Free, non-commercial only, 100 GB/month bandwidth |
| Database + login | Supabase Free (Postgres + Auth, Google/GitHub sign-in) | 500 MB database, 50k monthly users. Scheduled jobs keep the project from pausing after 7 idle days |
| Scheduled jobs | GitHub Actions running Python (FastF1, feedparser, scikit-learn) | Public repo: unlimited minutes. Private repo: news updates hourly to stay under 2,000 free minutes/month |
| Push alerts | Web push with VAPID keys and a service worker | Free |
| Fonts/icons | Google Fonts, Lucide, our own SVGs | Free |

### Data sources (all free)
- **Jolpica-F1:** standings, results, calendar.
- **OpenF1 historical:** laps, stints, pit stops, race control. Available about 30 minutes after each session. Live timing is not included because it is paid.
- **FastF1:** pace and telemetry analysis.
- **RSS news:** Autosport, Motorsport.com, The Race, RaceFans, BBC F1, formula1.com, team press releases, plus r/formula1 JSON. Cards show the headline, the publisher's short description and a link to the source.

### No paid AI
- **Duplicate stories:** grouped by TF-IDF headline similarity plus matching driver/team names within 24 hours.
- **Driver/team tags:** dictionary matching on names.
- **Daily Briefing:** a template filled from data.
- **Rumors:** keyword rules flag candidate stories, and the admin approves them by hand.

### Legal
- No official F1 logo, team logos, the F1 font or press photos.
- Footer disclaimer: *"This website is unofficial and is not associated in any way with the Formula 1 companies."*
- The name BOXBOX avoids the "F1" trademark in the brand itself.

---

## 3. Design theme: "Pit Wall at Night"
**Idea:** the site should feel like the engineers' pit wall screens during a night race: black glass, timing data glowing, team colours everywhere, and the red lights about to go out. Everything is fast, slanted and precise.

### 3.1 Brand
- **Wordmark:** `BOX▶BOX` in heavy italic condensed caps. The two words are split by a slanted red chevron, like a pit-board arrow.
  - Compact icon: a small pit board reading "BOX", used as the favicon and app icon.
- **Taglines:** "Everything from the pit wall." Race-day banner: "Lights out and away we go."
- **Voice:** short and punchy, like team radio. For example: "Copy. Norris P1 by 0.214." / "Box this lap: 3 new rumors."
- **Do not imitate** F1's logo, its speed-line swoosh or the F1 font.

### 3.2 Colour tokens
Colours are CSS variables in `app/globals.css`, mapped in `tailwind.config.ts`.

**Base:**
| Token | Hex | Use |
|---|---|---|
| `asphalt` | `#0A0A0D` | Page background |
| `carbon` | `#14141A` | Cards, with a 4%-opacity carbon-weave pattern |
| `kerb` | `#1E1E26` | Raised surfaces, hover |
| `line` | `#2B2B35` | 1px dividers |
| `text` | `#F4F4F6` | Primary text |
| `text-dim` | `#9B9BA7` | Secondary text |
| `box-red` | `#FF2D2D` | Brand accent, CTAs, live states |

**Timing:**
| Token | Hex | Meaning |
|---|---|---|
| `purple` | `#A855F7` | Fastest overall |
| `green` | `#22C55E` | Personal best |
| `yellow` | `#FACC15` | Slower |

**Tyres:**
| Token | Hex |
|---|---|
| `soft` | `#FF3B30` |
| `medium` | `#FFD60A` |
| `hard` | `#EDEDED` |
| `inter` | `#30D158` |
| `wet` | `#0A84FF` |

**Flags (status):**
| Flag | Meaning |
|---|---|
| Green | Confirmed / live |
| Yellow | Caution / rumor |
| Red | Breaking |
| Blue | Info |
| Chequered | Finished / signed |

**Team colours:** stored in `teams.color` for each season, not hard-coded. Each driver or team component sets `--team`. We also compute a lightened `--team-text` so dark liveries stay readable on black (WCAG AA).

**Light mode ("Paddock daylight"):** optional toggle with `#F3F3F1` background and the same accents. Dark is the default.

### 3.3 Typography
| Role | Font | Style |
|---|---|---|
| Display / headings | **Titillium Web** 900 italic | UPPERCASE, tracking −0.02em |
| UI / body | Titillium Web 400/600 | 16px base on mobile |
| Timing / numbers | **JetBrains Mono** 500 | `tabular-nums`, so gaps line up in columns |

- **Scale:** 12 / 14 / 16 / 20 / 28 / 40 / 64 (hero).
- **Driver codes** (NOR, VER, LEC) are always mono, bold, and paired with a team colour bar.

### 3.4 Shape language
- **Speed slant:** tabs, badges, buttons and the active nav indicator are parallelograms skewed −12°, with the text un-skewed inside.
- **Pit-board cards:** a cut top-right corner (`clip-path`), small 2px radius, 1px `line` border. A 4px team colour bar on the left edge whenever a card is about a driver or team.
- **Kerb stripes:** red/white diagonal dividers, used at most once per page (section headers on race hubs).
- **Chequered pattern:** only for winner, finished and "signed" states, so it stays special.
- **Grid:** 12-column desktop, 4-column mobile, 8px spacing unit, dense like data screens but with breathing room around the hero.

### 3.5 Signature components (`components/f1/`)
| Component | Look |
|---|---|
| `LightsOut` | Five red lights fill left to right, then all go out and the page slides in. First visit per session only, under 1.6s total, skipped for reduced motion |
| `TimingTower` | Broadcast-style rows: position, team bar, driver code, gap in mono. Rows slide into new order when positions change |
| `PitBoardCountdown` | Countdown to the next session shown as a stacked pit board: session name, then T-minus in large mono digits |
| `RadioCard` | Breaking news as a team-radio message: "📻 BOX BOX", a waveform strip and the headline |
| `ShiftLightMeter` | **Rumor credibility shown as steering-wheel shift lights**: 10 LEDs filling green → red → blue. Whisper = 2, Linked = 5, Strong = 8, Signed = full plus a chequered tag |
| `SectorChip` / `TyreDot` | Timing and tyre colours, always with a text label so colour is never the only signal |
| `PowerRankRow` | Rank, team bar, ▲▼ movement arrow, a small trend line in team colour |
| `SeatBoard` | Silly Season: two seat slots per team, like a garage whiteboard with magnetic name tags |
| `TelemetryChart` | Pace charts: black screen, thin glowing lines in team colours, mono axis labels |
| `PredictionSlip` | Predictions game entry styled as a race-strategy sheet |
| `StreakFlame` / `Badge` | Rewards as slanted enamel pins |
| `TrackOutline` | SVG circuit outline with the DRS zones drawn in green |

### 3.6 Motion (Framer Motion)
- **Page change:** horizontal speed wipe, 220ms.
- **Numbers:** ticker roll, 400ms.
- **Timing tower:** layout animation when positions swap.
- **Hover:** the card slides 2px right and its team bar brightens.
- **Live states:** a slow red pulse, like the "LIVE" dot on a broadcast.
- **Reduced motion:** `prefers-reduced-motion` turns off the loader, wipes and pulses.
- **Sound:** a radio-beep toggle, **off by default**.

### 3.7 Page moods
| Page | Mood |
|---|---|
| Paddock (home) | A wall of pit monitors: timing tower, countdown, Briefing, top story, pecking-order snapshot |
| News wire | A team-radio feed: RadioCards, flag-coloured tags, source-tier chips |
| Silly Season | Garage whiteboard seat board, rumor cards with ShiftLightMeter |
| Pecking order | Telemetry screen: TelemetryChart, PowerRankRow |
| Race hub | Circuit TrackOutline hero with kerb-stripe section headers; strategy stints drawn as tyre-coloured bars |
| Play | Podium and garage: PredictionSlip, leaderboard, streaks, badges |

### 3.8 Imagery & icons
- **No photos or logos.** We use our own SVGs: a generic car silhouette (not any team's livery), a helmet icon filled with the team colour, and tyre, radio, flag, stopwatch and DRS icons.
- **Lucide** for general UI icons.
- **Share cards** (`next/og`) reuse the same tokens, so a shared image looks like BOXBOX.

### 3.9 Mobile
- **Bottom tab bar:** Paddock · News · Market · Pace · Play, with a slanted red active indicator.
- **Timing tower** shows position, code, team bar and gap only; tap a row for details.
- **Touch targets** of at least 44px, one-thumb reachable.

### 3.10 Accessibility
- **Contrast:** AA for all text; team colours get the auto-lightened text variant.
- **Colour is never the only signal:** sector, tyre and flag colours always come with a label or icon.
- **Keyboard:** full keyboard navigation with a visible red focus ring.

### 3.11 Design deliverables (Phase 0)
1. Tokens in `globals.css` and `tailwind.config.ts`.
2. A dev-only `/design` style-guide page showing every token and component.
3. A static Paddock home mockup at mobile and desktop sizes, approved before any data work starts.

---

## 4. Features
- **A. Paddock home:**
  - Timing-tower standings for drivers and constructors.
  - Next-session countdown in local time.
  - Daily Briefing, top stories, hottest rumor, pecking-order snapshot.
- **B. Race weekend hub:**
  - Circuit card, sessions, results, fastest laps.
  - Pit-stop leaderboard, tyre-strategy chart, position-change chart.
  - Championship calculator.
- **C. News wire:**
  - Duplicates grouped ("reported by N outlets").
  - Driver/team tags and source-tier badges.
  - Filters: Breaking / Technical / Transfers / Race reports.
- **D. Silly Season:**
  - Next-season seat board (Confirmed / Likely / Open) with contract end years.
  - Rumor cards with the ShiftLightMeter; credibility = source tier × number of independent outlets.
  - Rumor timeline; admin approval.
- **E. Pecking order:**
  - Qualifying gap to pole %, fuel-corrected long-run pace, top speed vs. cornering, tyre wear, teammate gap.
  - Weekly Power Ranking plus a season trend chart.
- **F. Driver & team pages:** stats, last-5 form, teammate head-to-head, rumors, news, compare tool.
- **G. Engagement:**
  - **Predictions game:** pole, podium, Driver of the Day and one bold call. Points, streaks, badges, private leagues.
  - Polls after controversial moments.
  - Daily "Guess the driver" puzzle with a shareable grid.
  - Share cards, web-push alerts, spoiler shield.

## 5. Data model (core tables)
| Group | Tables |
|---|---|
| Racing | `seasons`, `teams` (with `color`), `drivers`, `driver_contracts`, `races`, `sessions`, `results`, `standings_snapshots`, `laps_summary`, `pace_rankings` |
| News | `sources` (with tier), `articles`, `story_clusters`, `article_entities` |
| Market | `rumors`, `rumor_sources`, `rumor_events` |
| Community | `profiles`, `predictions`, `prediction_scores`, `leagues`, `league_members`, `polls`, `poll_votes`, `badges`, `push_subscriptions` |

We store summaries and aggregates only, not raw telemetry, so the database stays well under 500 MB.

## 6. Project layout (`~/Desktop/BOXBOX`)
```
BOXBOX/
  CLAUDE.md  .claude/{settings.json,launch.json}  .nvmrc  .env.local (gitignored)
  app/(paddock) app/races/[slug] app/news app/silly-season app/pecking-order
  app/drivers/[code] app/play app/admin app/design (dev only)
  components/f1/   components/ui/   lib/   supabase/migrations/
  workers/ (.venv, ingest_standings.py, ingest_sessions.py, pace_analysis.py,
            news_ingest.py, rumor_candidates.py, build_briefing.py, score_predictions.py)
  .github/workflows/
```

## 7. Roadmap
0. **Phase 0 — Setup and design:** new Claude session in BOXBOX, git init with a repo-only identity, port 4747, then everything in §3.11.
1. **Phase 1 — MVP:** Paddock, standings, calendar and race hub, news wire, driver/team pages. Deploy to Vercel.
2. **Phase 2:** Pecking order and Power Rankings, Silly Season plus admin, championship calculator.
3. **Phase 3:** Sign-in, predictions game, leagues, polls, daily puzzle, share cards, web push.
4. **Phase 4:** Spoiler shield, installable PWA, post-session recap pages.

## 8. Verification
- **No clash with tutorAI:**
  - With tutorAI's stack running, `npm run dev` in BOXBOX serves on 4747.
  - tutorAI's 3000/8080/8000 health checks still pass.
  - `git -C ~/Desktop/BOXBOX config user.email` shows the repo-only identity.
  - `git -C tutorAI status` is unchanged.
- **Code checks:** `npx tsc --noEmit`, `npm run lint`, Vitest (scoring, credibility, grouping), Playwright on key pages.
- **Design checks:**
  - `/design` renders every token and component.
  - Screenshots at mobile (375px) and desktop sizes.
  - An axe accessibility check reports no contrast failures.
  - Reduced-motion mode disables the loader and animations.
  - Lighthouse mobile ≥ 90.
- **Data checks:** past-race results match Jolpica; the pace script reproduces known 2025 pecking orders; the RSS dry run shows no duplicate stories and working source links.
- **Cost check:** Vercel, Supabase and GitHub all on free plans, no payment method added.
