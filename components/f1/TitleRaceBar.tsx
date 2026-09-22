import Link from "next/link";
import { contenders, driverScoring, pointsRemaining } from "@/lib/championship";
import type { RaceWeekend } from "@/lib/schedule";
import type { Standings } from "@/lib/standings";
import { surname } from "@/lib/words";

/**
 * The way into /championship from the Paddock.
 *
 * Deliberately carries the numbers rather than a label: "Who can still win"
 * was a category, and a category is easy to scroll past. A gap, a round count
 * and how many are left in it is a reason to click, and it stays a reason on
 * the hundredth visit — which is more than an animation manages.
 *
 * Numerals, not words, unlike the Briefing: this is a monospace stat strip, and
 * "nine rounds left · nine still in it" reads like a bug even when both are
 * right.
 */
export function TitleRaceBar({ standings, calendar }: { standings: Standings | null; calendar: RaceWeekend[] }) {
  if (!standings || standings.round === null || standings.drivers.length < 2 || calendar.length === 0) {
    return null;
  }
  const { rounds } = pointsRemaining(calendar, standings.round);
  const alive = contenders(standings.drivers, calendar, standings.round, driverScoring(), "driver", (row) => row.code)
    .filter((entrant) => entrant.alive).length;
  const [leader, second] = standings.drivers;
  const behind = leader.points - second.points;
  const decided = alive <= 1;

  return (
    <Link
      href="/championship"
      className="group mt-2 flex items-center justify-between gap-3 border border-line bg-carbon py-2.5 pl-0 pr-3 transition-colors hover:border-box-red hover:bg-kerb"
    >
      <span aria-hidden="true" className="block w-1 self-stretch bg-box-red transition-all group-hover:w-2" />
      <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5 font-mono text-xs uppercase text-fg-dim">
        {decided ? (
          <span className="text-fg">
            <span className="font-bold">{surname(leader.name)}</span> is champion
          </span>
        ) : (
          <>
            <span>
              <span className="font-bold text-fg">{behind}</span> pts
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <span className="font-bold text-fg">{rounds}</span> {rounds === 1 ? "round" : "rounds"} left
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <span className="font-bold text-fg">{alive}</span> still in it
            </span>
          </>
        )}
      </span>
      <span
        aria-hidden="true"
        className="shrink-0 font-mono text-xs text-fg-dim transition-transform group-hover:translate-x-0.5 group-hover:text-fg"
      >
        →
      </span>
    </Link>
  );
}
