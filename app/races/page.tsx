import type { Metadata } from "next";
import Link from "next/link";
import { Panel, SectionHeader } from "@/components/f1/Panel";
import { TeamColorBar } from "@/components/f1/TeamColorBar";
import { circuitInfo } from "@/lib/circuits";
import { teamStyle } from "@/lib/color";
import { SCORING } from "@/lib/championship";
import { fetchCalendar } from "@/lib/jolpica";
import type { RaceWeekend } from "@/lib/schedule";
import { driverHref } from "@/lib/season";
import { teamInfo } from "@/lib/teams";
import { plural } from "@/lib/words";

/** The calendar changes at most once a weekend. */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Races — BOXBOX",
  description: "Every round of the season: who won, and what decided it.",
};

const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** The calendar, and which rounds have a verdict page. Clock read outside the component. */
async function season() {
  const calendar = await fetchCalendar().catch(() => [] as RaceWeekend[]);
  const run = new Map(SCORING.races.map((race) => [race.round, race]));
  const now = Date.now();
  return {
    calendar,
    run,
    rows: calendar.map((weekend) => {
      const race = weekend.sessions.find((session) => session.kind === "race");
      return {
        weekend,
        race: run.get(weekend.round) ?? null,
        startsAt: race?.startsAt ?? null,
        past: race ? Date.parse(race.startsAt) < now : false,
      };
    }),
  };
}

/**
 * The season at a glance: every round, who won it, and a way into both the
 * verdict and the circuit.
 *
 * Navigation rather than a destination, by design — see plan.md §9.8. It is
 * also the only place the circuit pages can be browsed from, which is why the
 * track column links out as well as the race.
 */
export default async function RacesPage() {
  const { rows } = await season();

  if (rows.length === 0) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">
        <h1 className="headline text-display-sm">Races</h1>
        <div className="kerb-stripe mt-1.5 h-1.5 w-16" aria-hidden="true" />
        <p className="mt-4 text-sm text-fg-dim">
          The calendar is off the timing screens right now. Check back shortly.
        </p>
      </main>
    );
  }

  const done = rows.filter((row) => row.race).length;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="headline text-display-sm">Races</h1>
          <div className="kerb-stripe mt-1.5 h-1.5 w-16" aria-hidden="true" />
        </div>
        <span className="font-mono text-xs uppercase text-fg-dim">
          {SCORING.season} · {done} of {plural(rows.length, "round")} run
        </span>
      </div>
      <p className="mb-4 max-w-3xl text-sm text-fg-dim">
        Every round of the season. A race that has run links to what decided it; the circuit links to the shape of the
        lap and everyone who has won there.
      </p>

      <Panel as="div" className="divide-y divide-line">
        {rows.map(({ weekend, race, startsAt, past }) => {
          const circuit = circuitInfo(weekend.circuitId);
          const team = race?.winner ? teamInfo(race.winner.constructorId, race.winner.constructorId) : null;
          return (
            <div
              key={weekend.round}
              className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 text-sm ${race ? "" : "opacity-70"}`}
            >
              <span className="headline w-8 shrink-0 text-lg">{weekend.round}</span>
              <span className="min-w-0 flex-1 basis-48">
                {race ? (
                  <Link href={`/races/${weekend.round}`} className="font-semibold hover:underline">
                    {weekend.event}
                  </Link>
                ) : (
                  <span className="font-semibold text-fg-dim">{weekend.event}</span>
                )}
              </span>
              <Link
                href={`/circuits/${weekend.circuitId}`}
                className="w-40 shrink-0 truncate text-xs text-fg-dim hover:text-fg hover:underline"
              >
                {circuit?.name ?? weekend.circuitName}
              </Link>
              <span className="w-16 shrink-0 font-mono text-xs text-fg-dim">
                {startsAt ? DAY.format(new Date(startsAt)) : ""}
              </span>
              <span className="flex w-28 shrink-0 items-center gap-2">
                {race?.winner && team ? (
                  <>
                    <TeamColorBar color={team.color} className="h-4 shrink-0 self-center" />
                    <Link
                      href={driverHref(race.winner.code)}
                      style={teamStyle(team.color)}
                      className="font-mono font-bold text-(--team-text) hover:underline"
                    >
                      {race.winner.code}
                    </Link>
                  </>
                ) : (
                  <span className="font-mono text-xs text-fg-dim">{past ? "—" : "to come"}</span>
                )}
              </span>
            </div>
          );
        })}
      </Panel>

      <section className="mt-8" aria-labelledby="circuits-title">
        <SectionHeader id="circuits-title" title="Circuits" kerb />
        <p className="mb-3 max-w-3xl text-sm text-fg-dim">
          Every track on the calendar, in the order they are raced.
        </p>
        <div className="flex flex-wrap gap-2">
          {rows.map(({ weekend }) => (
            <Link
              key={weekend.round}
              href={`/circuits/${weekend.circuitId}`}
              className="slant border border-line px-3 py-1.5 text-xs font-bold uppercase text-fg-dim transition-colors hover:bg-kerb hover:text-fg"
            >
              <span className="unslant block">{weekend.country}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
