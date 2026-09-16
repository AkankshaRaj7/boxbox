# BOXBOX

Everything from the pit wall — an unofficial F1 fan site that brings standings,
news, the driver market and the car pecking order into one place.

> This website is unofficial and is not associated in any way with the Formula 1 companies.

## Status

**Phase 1 — real data.** Every figure on the site is real: standings, calendar
and results from [Jolpica-F1](https://github.com/jolpica/jolpica-f1), race-lap
pace and sector times from [OpenF1](https://openf1.org), and headlines from six
tier-1 RSS feeds. The style guide at `/design` is the only place fictional
sample data still appears. Not yet deployed. See [docs/plan.md](docs/plan.md)
for the full roadmap.

## How the data works

- **Standings, calendar, circuits and news** are fetched server-side and cached
  (hourly for Jolpica, every 15 minutes for the feeds). Nothing is republished:
  news shows a headline, the publisher's own description and a link out.
- **Car pace** is precomputed. A daily GitHub Action runs `npm run data:pace`,
  which reduces each race's ~1,100 OpenF1 lap rows to one representative lap
  time per team and commits `data/pace.json` — so no visitor ever waits on it.
  `/pecking-order` explains the method, and what it can't account for.

## Run it

```bash
npm install
npm run dev        # http://localhost:4747
```

- `/` — the Paddock: standings, countdown, circuit, briefing, news, pace
- `/news` — the full news wire
- `/pecking-order` — which car is quickest, from race-lap pace
- `/drivers/[code]`, `/teams/[id]` — driver and team pages
- `/design` — the style guide (dev only)

## Checks

```bash
npm run typecheck
npm run lint
npm test
```

Runs entirely on free tiers — no paid services.
