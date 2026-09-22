@AGENTS.md

# CLAUDE.md — BOXBOX

BOXBOX is an unofficial F1 fan site: standings, a merged news wire, the driver
market ("Silly Season"), a car pecking order, and a predictions game, in one
place that looks like a pit wall at night. The full plan lives in
[docs/plan.md](docs/plan.md).

**Start every session by reading [docs/handoff.md](docs/handoff.md)** — current
status, decisions so far, and the next steps. Update it before ending a session.

## Hard constraints

- **Zero cost.** No paid APIs, subscriptions, or services. Stack: Vercel Hobby,
  Supabase Free, GitHub Actions (public repo), Jolpica-F1, OpenF1 *historical*
  data, FastF1, RSS. No paid LLM calls — story grouping, tagging and rumor
  detection are done in code, with admin approval for rumors.
- **Non-commercial.** No ads or payments (Vercel Hobby terms, F1 fan guidelines).
- **No F1 or team logos, the F1 font, or press photos.** Team colours, driver
  codes and our own SVGs only. The footer disclaimer in `SiteFooter` must stay.
- **News links out.** Show headline, publisher description and source; never
  republish article bodies.

## Separate from tutorAI

This machine also hosts the tutorAI project. Keep them apart:

- Dev server port is **4747** (`npm run dev`). Never 3000–4599 or 8000–9599,
  which tutorAI and its worktrees use. Never run tutorAI's `start-local.sh` /
  `stop-local.sh` from here.
- No local Postgres/Qdrant/Docker — Supabase is the hosted database.
- Git identity is set **repo-locally** (`akanksharaj <akanksharajp@gmail.com>`);
  don't change global git config.
- Secrets live in `.env.local` (gitignored); never reuse tutorAI keys.

## Commands

```bash
npm run dev         # http://localhost:4747
npm run typecheck   # next typegen + tsc --noEmit
npm run lint
npm test            # vitest (lib/**/*.test.ts)
npm run data:pace   # refresh data/pace.json from OpenF1 (--all to rebuild)
npm run data:race   # refresh data/races/<season>-<round>.json (--all to rebuild)
```

`npm run build` shares `.next/` with the dev server — stop dev first.

## Design system — "Pit Wall at Night"

- Tokens are defined once in `app/globals.css` (`@theme`). Use the generated
  utilities (`bg-asphalt`, `text-fg-dim`, `bg-box-red`, `bg-tyre-soft` …);
  never hard-code hex in components.
- Shape utilities: `headline`, `slant` + `unslant`, `pit-board`, `carbon-weave`,
  `kerb-stripe` (max once per page), `chequered` (winners/signed only).
- Team colours come from data. Apply them with `teamStyle(hex)` from
  `lib/color.ts`, which sets `--team` (fills) and `--team-text` (AA-readable
  text); use `bg-(--team)` / `text-(--team-text)`.
- Colour is never the only signal — sectors, tyres, flags and rumor meters
  always carry a text label. Filled tags use asphalt text for AA contrast.
- Motion respects reduced motion: CSS animations (lights out, page wipe,
  pulses) are switched off in the `prefers-reduced-motion` block of
  `globals.css`; framer-motion components check `useReducedMotion()`.
- Prefer CSS animations for anything visible on first paint — framer-motion
  `initial` styles are server-rendered and hide content until hydration.
- F1 components live in `components/f1/`; `/design` (dev only) shows every
  token and component — add new components there.

## Structure

- `app/` — routes. `app/page.tsx` is the Paddock home; `app/design` the style guide.
- `components/f1/` — F1 UI kit. `components/design/` — style-guide-only demos.
- `lib/` — pure logic with colocated `*.test.ts`.
- `lib/sample-data.ts` — **fictional** data, now used only by `/design`. No
  page on the site reads it; keep it that way.
- `data/` — committed, generated data the site reads directly: `circuits.json`,
  `pace.json`, one file per race in `races/`, and `season.json` (the aggregate
  the revalidating pages import, since they cannot read the race files the
  prerendered ones do). Refreshed by `npm run data:*` and by GitHub Actions,
  never fetched at request time.
- Race pages must follow the editorial rules in [docs/plan.md](docs/plan.md)
  §9.4: never the words "mistake", "error" or "failed" for anything inferred,
  the FIA's judgements quoted verbatim and attributed, every time figure stating
  how it was derived, and no team radio.

## Next.js 16

This is Next.js 16 with React 19 and Tailwind v4. Read the relevant guide in
`node_modules/next/dist/docs/` before using an API you haven't used here.
