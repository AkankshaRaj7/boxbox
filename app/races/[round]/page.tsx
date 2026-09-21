import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Panel, SectionHeader } from "@/components/f1/Panel";
import { StrategyChart } from "@/components/f1/StrategyChart";
import { TeamColorBar } from "@/components/f1/TeamColorBar";
import { TyreDot } from "@/components/f1/TyreDot";
import { circuitInfo } from "@/lib/circuits";
import { teamStyle } from "@/lib/color";
import { listRaces, loadRace } from "@/lib/race-data";
import { byTeam, raceVerdict, type RaceRecord } from "@/lib/race";
import { incidents, trackLimits, warnings, type Outcome } from "@/lib/incidents";
import { driverHref, teamHref } from "@/lib/season";
import { teamInfo } from "@/lib/teams";

/** Races never change once run, so every page is built once. */
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await listRaces()).map((race) => ({ round: String(race.round) }));
}

/** The season the committed records belong to. */
async function currentSeason() {
  return (await listRaces())[0]?.season ?? String(new Date().getFullYear());
}

async function load(round: string): Promise<RaceRecord | null> {
  const number = Number(round);
  return Number.isInteger(number) ? loadRace(await currentSeason(), number) : null;
}

export async function generateMetadata({ params }: { params: Promise<{ round: string }> }): Promise<Metadata> {
  const race = await load((await params).round);
  return race
    ? {
        title: `${race.event} — BOXBOX`,
        description: `What decided the ${race.event}: the safety car windows, the pit lane and the stewards' log.`,
      }
    : {};
}

const ROSTER = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** A driver code in their team's colour, linking to their page. */
function DriverTag({ code, constructorId }: { code: string; constructorId: string }) {
  const team = teamInfo(constructorId, constructorId);
  return (
    <Link
      href={driverHref(code)}
      style={teamStyle(team.color)}
      className="font-mono font-bold text-(--team-text) hover:underline"
    >
      {code}
    </Link>
  );
}

/** What decided this race, and how the number in it was arrived at. */
function Verdict({ race }: { race: RaceRecord }) {
  const lines = raceVerdict(race);
  return (
    <Panel className="p-4" aria-labelledby="verdict-title">
      <SectionHeader id="verdict-title" title="What decided this race" kerb />
      {lines.length > 0 ? (
        <ul className="space-y-2.5">
          {lines.map((line) => (
            <li key={line} className="flex gap-2.5">
              <span aria-hidden="true" className="slant mt-2 block h-1.5 w-2.5 shrink-0 bg-box-red" />
              {line}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-fg-dim">
          Nothing stood out in the data for this race: no neutralisation changed the pit stops, and the order broadly
          held.
        </p>
      )}
      {race.greenPitLoss !== null && (
        <p className="mt-3 border-t border-line pt-3 text-xs text-fg-dim">
          A pit stop is measured against the cars running at the same moment, not against the driver&apos;s own pace —
          under a safety car every lap is slower, so anything else would blame the neutralisation on the stop. In this
          race a green-flag stop cost {race.greenPitLoss.toFixed(1)} seconds. Lap data from{" "}
          <a href="https://openf1.org" className="underline hover:text-fg">
            OpenF1
          </a>
          ; classification from Jolpica-F1.
        </p>
      )}
    </Panel>
  );
}

/** How each outcome reads at a glance, without needing the words. */
const OUTCOME: Record<Outcome, { label: string; className: string }> = {
  penalty: { label: "Penalty", className: "bg-box-red text-asphalt" },
  investigating: { label: "Investigating", className: "bg-flag-yellow text-asphalt" },
  "no-action": { label: "No action", className: "border border-line text-fg-dim" },
  noted: { label: "Noted", className: "border border-line text-fg-dim" },
};

/**
 * What the stewards did, one entry per incident rather than one per message.
 *
 * Track limits are counted rather than listed: a quarter of all race-control
 * messages are single deleted lap times, and as a list they push everything
 * that matters off the screen.
 */
function Stewards({ race }: { race: RaceRecord }) {
  const events = incidents(race.control);
  const limits = trackLimits(race.control);
  const warned = warnings(race.control);
  const team = (code: string) => race.results.find((row) => row.driverCode === code)?.constructorId ?? "";
  if (events.length === 0 && limits.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="stewards-title">
      <SectionHeader
        id="stewards-title"
        title="Stewards"
        kerb
        action={<span className="font-mono text-xs text-fg-dim">{events.length} incidents</span>}
      />
      <Panel as="div" className="divide-y divide-line">
        {events.map((incident, i) => {
          const outcome = OUTCOME[incident.outcome];
          return (
            <div key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 px-3 py-2 text-sm">
              <span className="w-8 shrink-0 font-mono text-xs text-fg-dim">L{incident.lap}</span>
              <span className="flex shrink-0 gap-1.5">
                {incident.drivers.map((code) => (
                  <DriverTag key={code} code={code} constructorId={team(code)} />
                ))}
              </span>
              <span className="min-w-0 flex-1 text-fg-dim">
                {[incident.turn, incident.reason].filter(Boolean).join(" · ") || "Incident"}
                {incident.penalty && <span className="text-fg"> — {incident.penalty}</span>}
                {incident.served && <span className="text-fg-dim"> (served)</span>}
              </span>
              <span className={`slant shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase ${outcome.className}`}>
                <span className="unslant block">{outcome.label}</span>
              </span>
            </div>
          );
        })}
      </Panel>

      {(limits.length > 0 || warned.length > 0) && (
        <Panel as="div" className="mt-3 space-y-2 p-3 text-sm">
          {limits.length > 0 && (
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-xs font-bold uppercase text-fg-dim">Lap times deleted</span>
              {limits.map((row) => (
                <span key={row.driverCode} className="font-mono text-xs">
                  <DriverTag code={row.driverCode} constructorId={team(row.driverCode)} />
                  <span className="text-fg-dim">×{row.deleted}</span>
                </span>
              ))}
            </p>
          )}
          {warned.length > 0 && (
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-xs font-bold uppercase text-fg-dim">Black-and-white flag</span>
              {warned.map((warning) => (
                <span key={`${warning.driverCode}-${warning.lap}`} className="font-mono text-xs">
                  <DriverTag code={warning.driverCode} constructorId={team(warning.driverCode)} />
                  <span className="text-fg-dim"> L{warning.lap}</span>
                </span>
              ))}
            </p>
          )}
        </Panel>
      )}
      <p className="mt-2 text-xs text-fg-dim">
        Every judgement here is the FIA&apos;s. Messages about one incident — noted, investigated, penalised, served —
        are joined into a single entry.
      </p>
    </section>
  );
}

/** Stops and stints per driver. */
function PitLane({ race }: { race: RaceRecord }) {
  const stopped = new Set(race.pit.map((stop) => stop.driverCode));
  const drivers = byTeam(race).filter((row) => stopped.has(row.driverCode));
  if (drivers.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby="pit-title">
      <SectionHeader id="pit-title" title="Pit lane" kerb />
      <Panel as="div" className="divide-y divide-line">
        {drivers.map((driver) => {
          const code = driver.driverCode;
          const stops = race.pit.filter((stop) => stop.driverCode === code);
          const stints = race.stints.filter((stint) => stint.driverCode === code);
          return (
            <div key={code} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 text-sm">
              <span className="w-12 shrink-0">
                <DriverTag code={code} constructorId={driver.constructorId} />
              </span>
              <span className="hidden w-28 shrink-0 truncate text-xs text-fg-dim sm:block">
                {teamInfo(driver.constructorId, driver.constructorId).name}
              </span>
              <span className="w-16 shrink-0 font-mono text-xs text-fg-dim">
                {stops.length} {stops.length === 1 ? "stop" : "stops"}
              </span>
              <span className="flex flex-wrap items-center gap-1.5">
                {stints.map((stint, i) => (
                  <span key={i} className="flex items-center gap-1">
                    {stint.compound ? (
                      <TyreDot compound={stint.compound} />
                    ) : (
                      <span className="font-mono text-xs text-fg-dim">?</span>
                    )}
                    <span className="font-mono text-[10px] text-fg-dim">
                      L{stint.fromLap}–{stint.toLap}
                    </span>
                  </span>
                ))}
              </span>
              <span className="ml-auto font-mono text-xs text-fg-dim">
                {stops
                  .map((stop) => (stop.pitLaneSeconds === null ? "—" : `${stop.pitLaneSeconds.toFixed(1)}s`))
                  .join(" · ")}
              </span>
            </div>
          );
        })}
      </Panel>
      <p className="mt-2 text-xs text-fg-dim">
        Grouped by team, teams in championship order after this round. Times are the full trip through the pit lane,
        entry to exit — not the stationary time, which the data does not carry.
      </p>
    </section>
  );
}

/** The result, with where each driver started. */
function Classification({ race }: { race: RaceRecord }) {
  return (
    <section aria-labelledby="result-title">
      <SectionHeader id="result-title" title="Classification" kerb />
      <Panel as="div" className="divide-y divide-line">
        {[...race.results]
          .sort((a, b) => a.position - b.position)
          .map((row) => {
            const team = teamInfo(row.constructorId, row.constructorId);
            const moved = row.grid !== null && row.grid > 0 ? row.grid - row.position : null;
            return (
              <div key={row.driverCode} className="flex min-h-11 items-center gap-3 px-3 py-2 text-sm">
                <span className="headline w-7 shrink-0 text-lg">{row.positionText}</span>
                <TeamColorBar color={team.color} className="h-6 shrink-0 self-center" />
                <span className="w-12 shrink-0">
                  <DriverTag code={row.driverCode} constructorId={row.constructorId} />
                </span>
                <Link href={teamHref(row.constructorId)} className="min-w-0 flex-1 truncate text-fg-dim hover:text-fg">
                  {team.name}
                </Link>
                <span className="w-20 shrink-0 text-right font-mono text-xs text-fg-dim">
                  {row.grid === null ? "" : row.grid === 0 ? "pit lane" : `grid ${row.grid}`}
                </span>
                <span
                  className={`w-10 shrink-0 text-right font-mono text-xs ${
                    moved === null || moved === 0 ? "text-fg-dim" : moved > 0 ? "text-flag-green" : "text-box-red"
                  }`}
                >
                  {moved === null || moved === 0 ? "—" : moved > 0 ? `+${moved}` : moved}
                </span>
                <span className="hidden w-24 shrink-0 truncate text-right text-xs text-fg-dim sm:block">
                  {row.status}
                </span>
              </div>
            );
          })}
      </Panel>
    </section>
  );
}

/** One race: what decided it, and the evidence. */
export default async function RacePage({ params }: { params: Promise<{ round: string }> }) {
  const race = await load((await params).round);
  if (!race) {
    notFound();
  }
  const circuit = circuitInfo(race.circuitId);
  const podium = [...race.results].sort((a, b) => a.position - b.position).slice(0, 3);
  const laps = Math.max(
    ...race.pit.map((stop) => stop.lap),
    ...race.stints.map((stint) => stint.toLap),
    circuit?.laps ?? 0,
    1,
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="font-mono text-xs uppercase text-fg-dim">
            Round {race.round} · {ROSTER.format(new Date(`${race.date}T00:00:00Z`))}
          </span>
          <h1 className="headline text-display-sm">{race.event}</h1>
          <div className="kerb-stripe mt-1.5 h-1.5 w-16" aria-hidden="true" />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {podium.map((row) => (
            <span key={row.driverCode} className="flex items-baseline gap-1.5">
              <span className="font-mono text-xs text-fg-dim">P{row.position}</span>
              <DriverTag code={row.driverCode} constructorId={row.constructorId} />
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <Verdict race={race} />
          {(race.neutralisations.length > 0 || race.pit.length > 0) && (
            <section aria-labelledby="timeline-title">
              <SectionHeader id="timeline-title" title="Tyres and pit stops" kerb />
              <Panel as="div" className="p-3">
                <StrategyChart
                  laps={laps}
                  drivers={byTeam(race)}
                  neutralisations={race.neutralisations}
                  pit={race.pit}
                  stints={race.stints}
                />
              </Panel>
            </section>
          )}
          <PitLane race={race} />
        </div>
        <div className="space-y-6 lg:col-span-5">
          <Classification race={race} />
          <Stewards race={race} />
        </div>
      </div>
    </main>
  );
}
