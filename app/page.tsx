import { NextSessionCountdown } from "@/components/f1/NextSessionCountdown";
import { Panel, SectionHeader } from "@/components/f1/Panel";
import { FastestLapCard } from "@/components/f1/FastestLapCard";
import { PeckingOrderTable } from "@/components/f1/PeckingOrderTable";
import { TitleRaceBar } from "@/components/f1/TitleRaceBar";
import { StoryCard } from "@/components/f1/StoryCard";
import { StandingsPanel } from "@/components/f1/StandingsPanel";
import { TrackOutline } from "@/components/f1/TrackOutline";
import { circuitInfo } from "@/lib/circuits";
import Link from "next/link";
import { fetchCalendar, fetchLastWinner, fetchStandings } from "@/lib/jolpica";
import { briefing } from "@/lib/briefing";
import { WIRE_HOURS, loadWire, topStories, transferStories } from "@/lib/news";
import type { Story } from "@/lib/news-model";
import { PACE, peckingOrder } from "@/lib/pace";
import { currentWeekend, upcomingSessions, type RaceWeekend } from "@/lib/schedule";
import { driverHref, teamHref } from "@/lib/season";
import type { Standings } from "@/lib/standings";

/**
 * Re-render every 15 minutes for fresh headlines (NEWS_REVALIDATE). Jolpica
 * responses keep their own hourly cache, and a failed fetch is retried.
 */
export const revalidate = 900;

/** Driver-market stories in the Silly Season preview. */
const MARKET_STORIES = 2;

/** Teams shown in the Paddock pecking-order preview; the rest are on its page. */
const PREVIEW_TEAMS = 5;

/** Upcoming sessions sent to the countdown: two to three weekends' worth. */
const SESSIONS_AHEAD = 12;

const raceDay = new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

/** Upcoming sessions and this weekend's circuit, or null when Jolpica is down. */
async function loadSchedule() {
  try {
    const calendar = await fetchCalendar();
    const now = Date.now();
    const weekend = currentWeekend(calendar, now);
    const lastWinner = weekend ? await fetchLastWinner(weekend.circuitId).catch(() => null) : null;
    return { calendar, sessions: upcomingSessions(calendar, now).slice(0, SESSIONS_AHEAD), weekend, lastWinner };
  } catch (error) {
    console.error("Calendar unavailable:", error);
    return null;
  }
}

type Schedule = Awaited<ReturnType<typeof loadSchedule>>;

/** This weekend's circuit: layout and length from f1-circuits, the rest from Jolpica. */
function CircuitCard({ schedule, className }: { schedule: Schedule; className: string }) {
  const weekend = schedule?.weekend;
  const lastWinner = schedule?.lastWinner;
  const race = weekend?.sessions.find((s) => s.kind === "race");
  const circuit = weekend ? circuitInfo(weekend.circuitId) : null;

  return (
    <Panel className={`p-4 ${className}`} aria-labelledby="circuit-title">
      <SectionHeader id="circuit-title" title="Circuit" />
      {weekend ? (
        <>
          <p className="font-bold leading-snug">{weekend.circuitName}</p>
          <p className="text-sm text-fg-dim">
            {weekend.locality}, {weekend.country}
          </p>
          {circuit && <TrackOutline name={weekend.circuitName} outline={circuit.outline} className="mt-3" />}
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {[
              ["Round", `R${weekend.round}`],
              ["Format", weekend.sessions.some((s) => s.kind === "sprint") ? "Sprint" : "Standard"],
              ["Length", circuit ? `${circuit.lengthKm.toFixed(3)} km` : "—"],
              ["Laps", circuit ? String(circuit.laps) : "—"],
              ["Race (UTC)", race ? raceDay.format(Date.parse(race.startsAt)) : "TBC"],
              ["Last winner", lastWinner ? `${lastWinner.code} ${lastWinner.season}` : "—"],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="font-bold uppercase text-fg-dim">{label}</dt>
                <dd className="font-mono text-sm">{value}</dd>
              </div>
            ))}
          </dl>
          {circuit && (
            <p className="mt-3 text-xs text-fg-dim">
              Layout and length:{" "}
              <a
                href="https://github.com/bacinger/f1-circuits"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-fg"
              >
                f1-circuits
              </a>{" "}
              (MIT).
            </p>
          )}
        </>
      ) : (
        <p className="text-sm text-fg-dim">
          {schedule
            ? "No race coming up. The new calendar appears here once it's published."
            : "Circuit details are off the timing screens right now. Check back shortly."}
        </p>
      )}
    </Panel>
  );
}

/** Real championship standings, with a message instead if Jolpica is down. */
/**
 * What matters today, written from the standings, the calendar, the pecking
 * order and the wire. Fetches standings like Championship does: Next dedupes
 * the two identical requests within a render.
 */
async function Briefing({
  className,
  calendar,
  stories,
}: {
  className: string;
  calendar: RaceWeekend[];
  stories: Story[];
}) {
  let standings: Standings | null = null;
  try {
    standings = await fetchStandings();
  } catch (error) {
    console.error("Standings unavailable for the briefing:", error);
  }
  const lines = briefing({ standings, calendar, pecking: peckingOrder(), stories });

  return (
    <Panel className={`p-4 ${className}`} aria-labelledby="briefing-title">
      <SectionHeader
        id="briefing-title"
        title="The Briefing"
        kerb
        action={<span className="font-mono text-xs text-fg-dim">60 SEC READ</span>}
      />
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
          Nothing to brief yet. The season&apos;s first race fills this in.
        </p>
      )}
    </Panel>
  );
}

async function Championship({ calendar }: { calendar: RaceWeekend[] }) {
  let standings: Standings | null = null;
  try {
    standings = await fetchStandings();
  } catch (error) {
    console.error("Standings unavailable:", error);
  }

  const roundLabel = standings && (standings.round ? `${standings.season} · R${standings.round}` : `${standings.season} · Pre-season`);

  return (
    <section aria-labelledby="standings-title" className="lg:col-span-4">
      <SectionHeader
        id="standings-title"
        title="Championship"
        kerb
        action={roundLabel && <span className="font-mono text-xs uppercase text-fg-dim">{roundLabel}</span>}
      />
      <Panel as="div">
        {standings && standings.drivers.length > 0 ? (
          <StandingsPanel
            drivers={standings.drivers.map((d) => ({ ...d, href: driverHref(d.code) }))}
            constructors={standings.constructors.map((c) => ({ ...c, href: teamHref(c.id) }))}
          />
        ) : (
          <p className="p-4 text-sm text-fg-dim">
            {standings
              ? "No points on the board yet. Standings appear after the first race."
              : "Standings are off the timing screens right now. Check back shortly."}
          </p>
        )}
      </Panel>
      <TitleRaceBar standings={standings} calendar={calendar} />
      <p className="mt-2 text-xs text-fg-dim">Data: Jolpica-F1, refreshed hourly.</p>
    </section>
  );
}

/**
 * The Paddock: the daily hub. Every figure on it is real.
 */
export default async function PaddockPage() {
  const [schedule, wire] = await Promise.all([loadSchedule(), loadWire()]);
  const headlines = topStories(wire.stories, wire.now);
  const market = transferStories(wire.stories, wire.now, MARKET_STORIES);

  return (
    <main id="paddock" className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 pt-4 md:px-6">
      <div className="grid gap-4 lg:grid-cols-12">
        <NextSessionCountdown
          className="lg:col-span-4"
          sessions={schedule?.sessions ?? []}
          unavailable={schedule === null}
        />

        <Briefing className="lg:col-span-5" calendar={schedule?.calendar ?? []} stories={wire.stories} />

        <CircuitCard schedule={schedule} className="lg:col-span-3" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-6">
        <Championship calendar={schedule?.calendar ?? []} />

        <section id="news" aria-labelledby="news-title" className="scroll-mt-20 lg:col-span-5">
          <SectionHeader
            id="news-title"
            title="Radio feed"
            kerb
            action={
              <Link href="/news" className="text-xs font-bold uppercase text-fg-dim hover:text-fg">
                Full wire →
              </Link>
            }
          />
          <div className="space-y-3">
            {PACE.fastestLap && <FastestLapCard lap={PACE.fastestLap} />}
            {headlines.length > 0 ? (
              headlines.map((story) => <StoryCard key={story.id} story={story} />)
            ) : (
              <p className="text-sm text-fg-dim">The radio is quiet: no headlines could be loaded. Check back shortly.</p>
            )}
          </div>
        </section>

        <div className="space-y-8 lg:col-span-3">
          <section id="market" aria-labelledby="market-title" className="scroll-mt-20">
            <SectionHeader
              id="market-title"
              title="Silly Season"
              kerb
              action={
                <Link href="/news" className="text-xs font-bold uppercase text-fg-dim hover:text-fg">
                  Full wire →
                </Link>
              }
            />
            {market.length > 0 ? (
              <div className="space-y-3">
                {market.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            ) : (
              <Panel as="div" className="p-4 text-sm text-fg-dim">
                The driver market is quiet — no seat or contract stories in the last {WIRE_HOURS} hours. They appear
                here the moment an outlet reports one.
              </Panel>
            )}
          </section>

          <section id="pace" aria-labelledby="pace-title" className="scroll-mt-20">
            <SectionHeader
              id="pace-title"
              title="Pecking order"
              kerb
              action={
                <Link href="/pecking-order" className="text-xs font-bold uppercase text-fg-dim hover:text-fg">
                  Full order →
                </Link>
              }
            />
            <PeckingOrderTable teams={peckingOrder()} limit={PREVIEW_TEAMS} compact />
          </section>
        </div>
      </div>
    </main>
  );
}
