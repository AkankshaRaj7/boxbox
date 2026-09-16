import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { HeadToHeadCard } from "@/components/f1/HeadToHeadCard";
import { Helmet } from "@/components/f1/Helmet";
import { NewsMentions } from "@/components/f1/NewsMentions";
import { Panel, SectionHeader } from "@/components/f1/Panel";
import { TeamHero } from "@/components/f1/TeamHero";
import { teamStyle } from "@/lib/color";
import { CAR_ART } from "@/lib/car-art";
import { driverPhoto } from "@/lib/driver-photos";
import { helmetDesign } from "@/lib/helmet-designs";
import { fetchSeasonResults, fetchStandings } from "@/lib/jolpica";
import { loadWire } from "@/lib/news";
import {
  classified,
  driverHref,
  finishLabel,
  roundSpan,
  teamHeadToHeads,
  teamOf,
  teamRoster,
  teamStats,
  teamWeekends,
  type DriverBio,
  type SeasonResults,
} from "@/lib/season";

/** Re-render every 15 minutes for fresh news mentions; Jolpica keeps its hourly cache. */
export const revalidate = 900;

/** News stories shown; enough to balance the results column. */
const MENTIONS = 4;

/** Pages render on first visit and are then cached. */
export async function generateStaticParams() {
  return [];
}

const fullName = (d: DriverBio) => `${d.givenName} ${d.familyName}`;

async function loadSeason() {
  try {
    return await fetchSeasonResults();
  } catch (error) {
    console.error("Season results unavailable:", error);
    return null;
  }
}

const racedFor = (season: SeasonResults, id: string) => season.teams.some((t) => t.id === id);

export async function generateMetadata({ params }: PageProps<"/teams/[id]">): Promise<Metadata> {
  const { id } = await params;
  const season = await loadSeason();
  if (!season || !racedFor(season, id)) {
    return { title: "Team — BOXBOX" };
  }
  const team = teamOf(season, id);
  return {
    title: `${team.name} — BOXBOX`,
    description: `${team.name}'s ${season.season} season: drivers, head-to-heads and results by round.`,
  };
}

/** A team's season: car hero, drivers, their head-to-heads, results by round and news. */
export default async function TeamPage({ params }: PageProps<"/teams/[id]">) {
  const { id } = await params;
  if (id !== id.toLowerCase()) {
    permanentRedirect(`/teams/${id.toLowerCase()}`);
  }

  const [season, standings, wire] = await Promise.all([
    loadSeason(),
    fetchStandings().catch(() => null),
    loadWire(),
  ]);
  if (!season) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">
        <p className="text-sm text-fg-dim">Team results are off the timing screens right now. Check back shortly.</p>
      </main>
    );
  }
  if (!racedFor(season, id)) {
    notFound();
  }

  const team = teamOf(season, id);
  const stats = teamStats(season, id);
  const standing = standings?.constructors.findIndex((c) => c.id === id) ?? -1;
  const roster = teamRoster(season, id);
  const weekends = teamWeekends(season, id);
  const latestRound = weekends.at(-1)!.round;
  const bio = (driverId: string) => season.drivers.find((d) => d.id === driverId);
  const code = (driverId: string) => bio(driverId)?.code ?? driverId;
  // Only reviewed drawings go on the team page; drafts stay in /design.
  const art = CAR_ART[id]?.ready ? CAR_ART[id] : undefined;
  const mentions = wire.stories.filter((s) => s.tags.some((t) => t.id === `team:${id}`)).slice(0, MENTIONS);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">
      <TeamHero
        name={team.name}
        code={team.code}
        color={team.color}
        facts={[`${season.season} · after R${season.rounds.at(-1)!.round}`, `${roster.length} drivers raced`]}
        car={art && { art, helmet: helmetDesign(roster[0].driverId, team.color) }}
        stats={[
          { label: "Standing", value: standing >= 0 ? `P${standing + 1}` : "—" },
          { label: "Points", value: String(standing >= 0 ? standings!.constructors[standing].points : stats.points) },
          { label: "Wins", value: String(stats.wins) },
          { label: "Podiums", value: String(stats.podiums) },
          { label: "Poles", value: String(stats.poles) },
          { label: "Best finish", value: stats.bestFinish ? `P${stats.bestFinish}` : "—" },
        ]}
      />

      {art && (
        <p className="mt-2 text-xs text-fg-dim">
          Car drawn by BOXBOX after a{" "}
          <a href={art.credit.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-fg">
            photo by {art.credit.author}
          </a>{" "}
          ({art.credit.licence}), logos removed.
        </p>
      )}

      <section aria-labelledby="drivers-title" className="mt-8">
        <SectionHeader id="drivers-title" title="Drivers" kerb />
        <ul className="grid gap-x-3 gap-y-14 pt-10 sm:grid-cols-2 lg:grid-cols-3">
          {roster.map((entry) => {
            const driver = bio(entry.driverId);
            const current = entry.rounds.at(-1) === latestRound;
            const photo = driverPhoto(entry.driverId);
            return (
              <li key={entry.driverId} className="relative">
                <Panel
                  as="article"
                  style={teamStyle(team.color)}
                  className="group relative flex h-full items-center gap-4 p-4 transition-colors hover:bg-kerb"
                >
                  {photo ? (
                    <>
                      <span aria-hidden="true" className="driver-spotlight absolute inset-y-0 left-0 w-1/2" />
                      <div className="w-28 shrink-0 self-stretch" />
                    </>
                  ) : (
                    <Helmet
                      design={helmetDesign(entry.driverId, team.color)}
                      number={driver?.number}
                      idPrefix={`roster-${entry.driverId}`}
                      className="w-24 shrink-0"
                    />
                  )}
                  <div className="relative min-w-0">
                    <p className="font-mono text-sm font-bold text-(--team-text)">
                      {driver?.number && <span className="mr-2">#{driver.number}</span>}
                      {code(entry.driverId)}
                    </p>
                    <h3 className="text-lg font-bold leading-tight">
                      {driver ? (
                        <Link href={driverHref(driver.code)} className="after:absolute after:inset-0 hover:underline">
                          {fullName(driver)}
                        </Link>
                      ) : (
                        entry.driverId
                      )}
                    </h3>
                    <p className="mt-1 text-sm text-fg-dim">
                      {current ? `In the R${latestRound} line-up` : `Raced ${roundSpan(entry.rounds)}`}
                    </p>
                    <p className="font-mono text-sm tabular-nums">
                      {entry.points} PTS · {entry.rounds.length} {entry.rounds.length === 1 ? "race" : "races"}
                    </p>
                  </div>
                  {photo && (
                    <div aria-hidden="true" className="relative ml-auto w-20 shrink-0">
                      <Helmet
                        design={helmetDesign(entry.driverId, team.color)}
                        idPrefix={`roster-${entry.driverId}`}
                        className="w-full -scale-x-100"
                      />
                    </div>
                  )}
                </Panel>
                {photo && (
                  <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-4 z-10 w-28">
                    <Image
                      src={photo}
                      alt=""
                      width={600}
                      height={800}
                      sizes="160px"
                      className="driver-pop absolute bottom-0 left-1/2 h-[135%] w-auto max-w-[150%] object-contain object-bottom"
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-6">
        <div className="min-w-0 space-y-8 lg:col-span-7">
          <section aria-labelledby="team-results-title">
            <SectionHeader id="team-results-title" title="Results by round" />
            <Panel as="div" className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-sm">
                <caption className="sr-only">
                  {team.name}&apos;s {season.season} Grand Prix finishes by round
                </caption>
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase text-fg-dim">
                    <th scope="col" className="px-3 py-2 font-bold">Rd</th>
                    <th scope="col" className="px-3 py-2 font-bold">Grand Prix</th>
                    <th scope="col" className="px-3 py-2 font-bold">Finishes</th>
                    <th scope="col" className="px-3 py-2 text-right font-bold">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {weekends.map((w) => (
                    <tr key={w.round} className="hover:bg-kerb">
                      <td className="px-3 py-2 font-mono text-fg-dim">R{w.round}</td>
                      <td className="px-3 py-2">{w.event.replace(/ Grand Prix$/, "")}</td>
                      <td className="px-3 py-2">
                        <span className="flex flex-wrap gap-x-4 gap-y-1 font-mono tabular-nums">
                          {w.results.map((r) => (
                            <span key={r.driverId}>
                              <span className="text-fg-dim">{code(r.driverId)}</span>{" "}
                              <span className={`font-bold ${classified(r) ? "" : "text-flag-red"}`}>{finishLabel(r)}</span>
                            </span>
                          ))}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums">{w.points || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
            <p className="mt-2 text-xs text-fg-dim">Points include sprints.</p>
          </section>
        </div>

        <div className="min-w-0 space-y-8 lg:col-span-5">
          <section aria-labelledby="team-h2h-title">
            <SectionHeader id="team-h2h-title" title="Head-to-head" />
            <div className="space-y-3">
              {teamHeadToHeads(season, id).map((h) => {
                const [a, b] = h.drivers.map(bio);
                const side = (driver: DriverBio | undefined, driverId: string) => ({
                  code: driver?.code ?? driverId,
                  name: driver ? fullName(driver) : driverId,
                  href: driver && driverHref(driver.code),
                });
                return (
                  <HeadToHeadCard
                    key={h.drivers.join("-")}
                    a={side(a, h.drivers[0])}
                    b={side(b, h.drivers[1])}
                    color={team.color}
                    context={`${roundSpan(h.rounds)} · ${h.rounds.length} ${h.rounds.length === 1 ? "round" : "rounds"}`}
                    qualifying={h.qualifying}
                    race={h.race}
                    points={h.points}
                  />
                );
              })}
            </div>
            <p className="mt-2 text-xs text-fg-dim">
              Only rounds both drivers raced for {team.name}. Qualifying counts rounds where both set a time; race
              counts finishing order when both started.
            </p>
          </section>

          <section aria-labelledby="team-news-title">
            <SectionHeader id="team-news-title" title="In the news" />
            <NewsMentions stories={mentions} subject={team.name} />
          </section>
        </div>
      </div>

      <p className="mt-6 text-xs text-fg-dim">Results: Jolpica-F1, refreshed hourly.</p>
    </main>
  );
}
