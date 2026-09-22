import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, SectionHeader } from "@/components/f1/Panel";
import { TeamColorBar } from "@/components/f1/TeamColorBar";
import { TrackOutline } from "@/components/f1/TrackOutline";
import { circuitInfo } from "@/lib/circuits";
import { teamStyle } from "@/lib/color";
import { fetchCalendar, fetchCircuitWinners, type CircuitWinner } from "@/lib/jolpica";
import type { RaceWeekend } from "@/lib/schedule";
import { driverHref, teamHref } from "@/lib/season";
import { teamInfo } from "@/lib/teams";
import { characterLabel, trackCharacter } from "@/lib/track";
import { count, plural } from "@/lib/words";

/** The calendar and a circuit's honours roll change at most once a weekend. */
export const revalidate = 86400;

const DAY = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });

/**
 * The calendar, this circuit's weekend, and whether its race has run. The clock
 * is read here rather than in the component, which must stay pure.
 */
async function weekendFor(id: string) {
  const calendar = await fetchCalendar().catch(() => [] as RaceWeekend[]);
  const weekend = calendar.find((race) => race.circuitId === id);
  const race = weekend?.sessions.find((session) => session.kind === "race");
  return { calendar, weekend, race, run: race ? Date.parse(race.startsAt) < Date.now() : false };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const circuit = circuitInfo(id);
  return circuit
    ? { title: `${circuit.name} — BOXBOX`, description: `The lap at ${circuit.name}: its shape, and everyone who has won here.` }
    : {};
}

/** Who has won here most often. */
function mostWins(winners: CircuitWinner[]) {
  const tally = new Map<string, number>();
  for (const winner of winners) {
    tally.set(winner.code, (tally.get(winner.code) ?? 0) + 1);
  }
  return [...tally]
    .map(([code, wins]) => ({ code, wins }))
    .sort((a, b) => b.wins - a.wins || a.code.localeCompare(b.code))
    .slice(0, 5);
}

/** How twisty this lap is against the rest of the season. */
function Character({ circuitId, calendar }: { circuitId: string; calendar: RaceWeekend[] }) {
  const character = trackCharacter(circuitId, calendar.map((race) => race.circuitId));
  if (!character) {
    return null;
  }
  const { degreesPerKm, rank, of, share } = character;
  return (
    <div className="mt-4 border-t border-line pt-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-xs font-bold uppercase text-fg-dim">Shape of the lap</span>
        <span className="font-mono text-xs text-fg-dim">
          {Math.round(degreesPerKm)}° per km · {rank === 1 ? "twistiest" : `${rank} of ${of}`}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <span className="font-mono text-[10px] uppercase text-fg-dim">Fast</span>
        <span aria-hidden="true" className="relative h-1.5 flex-1 bg-kerb">
          <span
            className="absolute inset-y-0 w-1.5 bg-box-red"
            style={{ left: `calc(${(share * 100).toFixed(1)}% - 3px)` }}
          />
        </span>
        <span className="font-mono text-[10px] uppercase text-fg-dim">Twisty</span>
      </div>
      <p className="mt-2 text-sm">
        <span className="font-bold">{characterLabel(share)}</span>
        <span className="text-fg-dim">
          {" "}
          — the {rank === 1 ? "twistiest lap" : `${rank === of ? "most flowing lap" : `${rank}th twistiest lap`}`} of the{" "}
          {calendar[0]?.season ?? ""} season.
        </span>
      </p>
    </div>
  );
}

/** One circuit: the lap, and everyone who has won on it. */
export default async function CircuitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const circuit = circuitInfo(id);
  if (!circuit) {
    notFound();
  }
  const [{ calendar, weekend, race, run }, winners] = await Promise.all([
    weekendFor(id),
    fetchCircuitWinners(id).catch(() => [] as CircuitWinner[]),
  ]);
  const index = weekend ? calendar.findIndex((entry) => entry.round === weekend.round) : -1;
  const previous = index > 0 ? calendar[index - 1] : null;
  const next = index >= 0 && index < calendar.length - 1 ? calendar[index + 1] : null;
  const recent = [...winners].reverse();
  const repeat = mostWins(winners);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          {weekend && (
            <span className="font-mono text-xs uppercase text-fg-dim">
              Round {weekend.round} · {weekend.locality}, {weekend.country}
              {race ? ` · ${DAY.format(new Date(race.startsAt))}` : ""}
            </span>
          )}
          <h1 className="headline text-display-sm">{circuit.name}</h1>
          <div className="kerb-stripe mt-1.5 h-1.5 w-16" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-2 font-mono text-xs uppercase">
          {previous ? (
            <Link href={`/circuits/${previous.circuitId}`} className="text-fg-dim hover:text-fg">
              ← R{previous.round}
            </Link>
          ) : (
            <span className="text-line">← R—</span>
          )}
          <span className="text-line">|</span>
          {next ? (
            <Link href={`/circuits/${next.circuitId}`} className="text-fg-dim hover:text-fg">
              R{next.round} →
            </Link>
          ) : (
            <span className="text-line">R— →</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <Panel className="p-4 lg:col-span-7" aria-labelledby="lap-title">
          <SectionHeader id="lap-title" title="The lap" kerb />
          <div className="mx-auto max-w-md">
            <TrackOutline outline={circuit.outline} name={circuit.name} />
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-3 text-center">
            {[
              ["Length", `${circuit.lengthKm.toFixed(3)} km`],
              ["Laps", String(circuit.laps)],
              ["Race distance", `${(circuit.lengthKm * circuit.laps).toFixed(0)} km`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-bold uppercase text-fg-dim">{label}</dt>
                <dd className="font-mono text-lg tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <Character circuitId={id} calendar={calendar} />
        </Panel>

        <div className="space-y-6 lg:col-span-5">
          {weekend && (
            <section aria-labelledby="weekend-title">
              <SectionHeader id="weekend-title" title={run ? "This season" : "Coming up"} kerb />
              <Panel as="div" className="p-4 text-sm">
                {run ? (
                  <p>
                    Round {weekend.round} ran here.{" "}
                    <Link href={`/races/${weekend.round}`} className="font-bold underline hover:text-fg">
                      What decided it →
                    </Link>
                  </p>
                ) : (
                  <p className="text-fg-dim">
                    Round {weekend.round} of {weekend.season} is here
                    {race ? `, on ${DAY.format(new Date(race.startsAt))}` : ""}. The race page appears once it has run.
                  </p>
                )}
              </Panel>
            </section>
          )}

          {winners.length > 0 && (
            <section aria-labelledby="winners-title">
              <SectionHeader
                id="winners-title"
                title="Winners here"
                kerb
                action={<span className="font-mono text-xs text-fg-dim">{plural(winners.length, "race")}</span>}
              />
              {repeat.length > 0 && repeat[0].wins > 1 && (
                <p className="mb-2 text-sm text-fg-dim">
                  Most wins:{" "}
                  {repeat
                    .filter((entry) => entry.wins > 1)
                    .map((entry) => `${entry.code} ${entry.wins}`)
                    .join(" · ")}
                </p>
              )}
              <Panel as="div" className="max-h-80 divide-y divide-line overflow-y-auto">
                {recent.map((winner) => {
                  const team = teamInfo(winner.constructorId, winner.constructorId);
                  return (
                    <div key={winner.season} className="flex items-center gap-3 px-3 py-1.5 text-sm">
                      <span className="w-10 shrink-0 font-mono text-xs text-fg-dim">{winner.season}</span>
                      <TeamColorBar color={team.color} className="h-4 shrink-0 self-center" />
                      <Link
                        href={driverHref(winner.code)}
                        style={teamStyle(team.color)}
                        className="w-12 shrink-0 font-mono font-bold text-(--team-text) hover:underline"
                      >
                        {winner.code}
                      </Link>
                      <Link href={teamHref(winner.constructorId)} className="min-w-0 truncate text-fg-dim hover:text-fg">
                        {team.name}
                      </Link>
                    </div>
                  );
                })}
              </Panel>
            </section>
          )}
        </div>
      </div>

      <Panel className="mt-8 p-4" aria-labelledby="shape-method">
        <SectionHeader id="shape-method" title="About the shape" kerb />
        <div className="grid gap-4 text-sm text-fg-dim md:grid-cols-2">
          <p>
            <span className="font-bold text-fg">Degrees per kilometre</span> is how far the car changes direction over
            a lap, divided by the lap&apos;s length. Monaco comes out around 690, Monza around 200. Because it totals
            the turning rather than counting the turns, it gives the same answer however finely the track was drawn,
            which is what makes it safe to publish.
          </p>
          <p>
            <span className="font-bold text-fg">You will not find a corner count here.</span> The outline samples a lap
            every 40–50 metres, which is fine for Monaco — detection matched its 19 turns exactly — but gave Baku 11
            against an official 20, because the tight castle section falls between samples. The same sampling made
            straights unreliable: Baku&apos;s measured 1,068 m against a real 2,200 m. Neither is published. Layout and
            length from{" "}
            <a href="https://github.com/bacinger/f1-circuits" target="_blank" rel="noopener noreferrer" className="underline hover:text-fg">
              f1-circuits
            </a>{" "}
            (MIT); winners from Jolpica-F1, {count(winners.length)} {winners.length === 1 ? "race" : "races"} deep.
          </p>
        </div>
      </Panel>
    </main>
  );
}
