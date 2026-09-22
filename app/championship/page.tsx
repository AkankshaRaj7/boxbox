import type { Metadata } from "next";
import Link from "next/link";
import { Panel, SectionHeader } from "@/components/f1/Panel";
import { TeamColorBar } from "@/components/f1/TeamColorBar";
import { teamStyle } from "@/lib/color";
import {
  contenders,
  driverScoring,
  earliestClinch,
  pointsRemaining,
  teamScoring,
  type Championship,
  type Contender,
} from "@/lib/championship";
import { fetchCalendar, fetchStandings } from "@/lib/jolpica";
import type { RaceWeekend } from "@/lib/schedule";
import { driverHref, teamHref } from "@/lib/season";
import type { Standings } from "@/lib/standings";
import { count, plural, position } from "@/lib/words";

/** Standings move once a weekend; an hour is plenty. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Championship — BOXBOX",
  description: "Who can still win the 2026 championships, and exactly what it would take.",
};

/** Signed to one decimal, with a real minus sign rather than a hyphen. */
const one = (n: number) => (n > 0 ? `+${n.toFixed(1)}` : `−${Math.abs(n).toFixed(1)}`);

/** One entrant's row: where they stand, and what catching the leader needs. */
function ContenderRow({ entrant, of }: { entrant: Contender; of: Championship }) {
  const { row, behind, alive, requiredSwing, recentSwing, scenario } = entrant;
  const href = of === "driver" ? driverHref(row.code) : teamHref(row.id);
  const leading = behind === 0;

  return (
    <div className={`px-3 py-2.5 ${alive ? "" : "opacity-60"}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <TeamColorBar color={row.color} className="h-6 shrink-0 self-center" />
        <Link
          href={href}
          style={teamStyle(row.color)}
          className="w-12 shrink-0 font-mono font-bold text-(--team-text) hover:underline"
        >
          {of === "driver" ? row.code : row.code}
        </Link>
        <span className="min-w-0 flex-1 truncate text-sm">{row.name}</span>
        <span className="w-14 shrink-0 text-right font-mono text-sm tabular-nums">{row.points}</span>
        <span className="w-16 shrink-0 text-right font-mono text-xs tabular-nums text-fg-dim">
          {leading ? "leader" : `−${behind}`}
        </span>
        {!alive && (
          <span className="slant shrink-0 border border-line px-2 py-0.5 text-[10px] font-bold uppercase text-fg-dim">
            <span className="unslant block">Out</span>
          </span>
        )}
      </div>
      {alive && requiredSwing !== null && (
        <p className="mt-1 pl-9 text-xs text-fg-dim">
          Needs <span className="font-mono text-fg">{one(requiredSwing)}</span> points a round on the leader
          {recentSwing !== null && (
            <>
              ; has managed <span className="font-mono text-fg">{one(recentSwing)}</span> over the last five
            </>
          )}
          {scenario && (
            <>
              {". "}
              {scenario.rivalNoBetterThan > 10
                ? "Winning every round with the leader out of the points would do it."
                : `Winning every round with the leader no better than ${position(scenario.rivalNoBetterThan)} would do it.`}
            </>
          )}
        </p>
      )}
    </div>
  );
}

/** One championship: the gap at the top, then everyone behind it. */
function Table({
  title,
  standings,
  calendar,
  of,
}: {
  title: string;
  standings: Standings;
  calendar: RaceWeekend[];
  of: Championship;
}) {
  const table = of === "driver" ? standings.drivers : standings.constructors;
  const round = standings.round ?? 0;
  const rows = contenders(table, calendar, round, of === "driver" ? driverScoring() : teamScoring(), of, (entry) =>
    of === "driver" ? entry.code : entry.id,
  );
  const alive = rows.filter((entrant) => entrant.alive);
  const out = rows.filter((entrant) => !entrant.alive);
  const clinch = earliestClinch(table, calendar, round, of);
  const clinchEvent = calendar.find((weekend) => weekend.round === clinch);

  if (rows.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={`${of}-title`}>
      <SectionHeader
        id={`${of}-title`}
        title={title}
        kerb
        action={
          <span className="font-mono text-xs uppercase text-fg-dim">
            {alive.length} still in it
          </span>
        }
      />
      <Panel as="div" className="divide-y divide-line">
        {alive.map((entrant) => (
          <ContenderRow key={entrant.row.id} entrant={entrant} of={of} />
        ))}
      </Panel>
      {clinch !== null && (
        <p className="mt-2 text-xs text-fg-dim">
          At the earliest, {table[0].name} seals it at round {clinch}
          {clinchEvent ? `, the ${clinchEvent.event}` : ""} — and only by winning everything from here while{" "}
          {table[1]?.name ?? "the nearest rival"} scores nothing.
        </p>
      )}
      {out.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-xs font-bold uppercase text-fg-dim hover:text-fg">
            {count(out.length)} no longer in it
          </summary>
          <Panel as="div" className="mt-2 divide-y divide-line">
            {out.map((entrant) => (
              <ContenderRow key={entrant.row.id} entrant={entrant} of={of} />
            ))}
          </Panel>
        </details>
      )}
    </section>
  );
}

/** Who can still win, and exactly what it would take. */
export default async function ChampionshipPage() {
  const [standings, calendar] = await Promise.all([
    fetchStandings().catch(() => null),
    fetchCalendar().catch(() => [] as RaceWeekend[]),
  ]);

  if (!standings || standings.round === null || calendar.length === 0) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">
        <h1 className="headline text-display-sm">Championship</h1>
        <div className="kerb-stripe mt-1.5 h-1.5 w-16" aria-hidden="true" />
        <p className="mt-4 text-sm text-fg-dim">
          {standings ? "No points on the board yet. This fills in after the first race." : "Standings are off the timing screens right now. Check back shortly."}
        </p>
      </main>
    );
  }

  const left = pointsRemaining(calendar, standings.round);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="headline text-display-sm">Championship</h1>
          <div className="kerb-stripe mt-1.5 h-1.5 w-16" aria-hidden="true" />
        </div>
        <span className="font-mono text-xs uppercase text-fg-dim">
          {standings.season} · after R{standings.round} · {plural(left.rounds, "round")} left
        </span>
      </div>
      <p className="mb-6 max-w-3xl text-sm text-fg-dim">
        {left.rounds > 0 ? (
          <>
            {left.points} points are still on the table for a driver, {pointsRemaining(calendar, standings.round, "team").points}{" "}
            for a team. Anyone within that of the lead can still win it; everyone else is out, whatever happens.
          </>
        ) : (
          <>The season is over. These are the final standings.</>
        )}
      </p>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Table title="Drivers" standings={standings} calendar={calendar} of="driver" />
        <Table title="Constructors" standings={standings} calendar={calendar} of="team" />
      </div>

      <Panel className="mt-8 p-4" aria-labelledby="method-title">
        <SectionHeader id="method-title" title="How to read this" kerb />
        <div className="grid gap-4 text-sm text-fg-dim md:grid-cols-2">
          <div className="space-y-2">
            <p>
              <span className="font-bold text-fg">There is no win probability here.</span> Any percentage would come
              out of a model that cannot be checked against nine remaining races, and a guess dressed as a number is
              worse than no number. What is here is arithmetic you can verify: the points still available, the swing a
              chaser needs, and what they have actually managed lately.
            </p>
            <p>
              <span className="font-bold text-fg">Needs</span> is the gap divided by the rounds left — the points per
              round a chaser must take out of the leader.{" "}
              <span className="font-bold text-fg">Has managed</span> is what they have actually done to the leader over
              the last five rounds. When the second number is well below the first, the arithmetic is already saying
              something.
            </p>
          </div>
          <div className="space-y-2">
            <p>
              <span className="font-bold text-fg">Out</span> means the points still available cannot cover the gap, so
              the result no longer depends on anything. It is exact, not an opinion.
            </p>
            <p>
              The scenario line is a driver&apos;s arithmetic — one car against one. A constructors&apos; round is two cars
              against two, so no scenario is offered there; the points-per-round figure is the honest ask.
            </p>
            <p>
              A dead heat on points is settled by countback — most wins, then most seconds, and so on — which this
              arithmetic does not attempt. Points from{" "}
              <a href="https://github.com/jolpica/jolpica-f1" target="_blank" rel="noopener noreferrer" className="underline hover:text-fg">
                Jolpica-F1
              </a>
              , scored 25-18-15-12-10-8-6-4-2-1 in a Grand Prix and 8-7-6-5-4-3-2-1 in a sprint.
            </p>
          </div>
        </div>
      </Panel>
    </main>
  );
}
