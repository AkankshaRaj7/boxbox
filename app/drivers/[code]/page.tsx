import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { DriverHero } from "@/components/f1/DriverHero";
import { FormChips } from "@/components/f1/FormChips";
import { HeadToHeadCard } from "@/components/f1/HeadToHeadCard";
import { NewsMentions } from "@/components/f1/NewsMentions";
import { Panel, SectionHeader } from "@/components/f1/Panel";
import { teamStyle } from "@/lib/color";
import { driverPhoto } from "@/lib/driver-photos";
import { helmetDesign } from "@/lib/helmet-designs";
import { fetchSeasonResults, fetchStandings } from "@/lib/jolpica";
import { loadWire } from "@/lib/news";
import {
  ageOn,
  classified,
  driverHref,
  driverStats,
  driverWeekends,
  findDriverByCode,
  finishLabel,
  recentForm,
  roundSpan,
  teamHref,
  teammateHeadToHeads,
  teamOf,
  teamSpells,
  type DriverBio,
} from "@/lib/season";

/** Re-render every 15 minutes for fresh news mentions; Jolpica keeps its hourly cache. */
export const revalidate = 900;

/** News stories shown; enough to balance the results column. */
const MENTIONS = 4;

/** Pages render on first visit and are then cached, since the grid can change mid-season. */
export async function generateStaticParams() {
  return [];
}

const fullName = (d: DriverBio) => `${d.givenName} ${d.familyName}`;

/** Starting position, with PL for a pit-lane start. */
const gridLabel = (grid: number | null) => (grid === null ? "—" : grid === 0 ? "PL" : String(grid));

async function loadSeason() {
  try {
    return await fetchSeasonResults();
  } catch (error) {
    console.error("Season results unavailable:", error);
    return null;
  }
}

export async function generateMetadata({ params }: PageProps<"/drivers/[code]">): Promise<Metadata> {
  const { code } = await params;
  const season = await loadSeason();
  const driver = season && findDriverByCode(season, code);
  if (!season || !driver) {
    return { title: "Driver — BOXBOX" };
  }
  return {
    title: `${fullName(driver)} — BOXBOX`,
    description: `${fullName(driver)}'s ${season.season} season: results, recent form and teammate head-to-head.`,
  };
}

/** A driver's season: helmet hero, last five races, teammate head-to-heads, results by round and news. */
export default async function DriverPage({ params }: PageProps<"/drivers/[code]">) {
  const { code } = await params;
  if (code !== code.toLowerCase()) {
    permanentRedirect(driverHref(code));
  }

  const [season, standings, wire] = await Promise.all([
    loadSeason(),
    fetchStandings().catch(() => null),
    loadWire(),
  ]);
  if (!season) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">
        <p className="text-sm text-fg-dim">Driver results are off the timing screens right now. Check back shortly.</p>
      </main>
    );
  }
  const driver = findDriverByCode(season, code);
  if (!driver) {
    notFound();
  }

  const name = fullName(driver);
  const spells = teamSpells(season, driver.id);
  const lastSpell = spells.at(-1)!;
  const team = teamOf(season, lastSpell.constructorId);
  const stats = driverStats(season, driver.id);
  const standing = standings?.drivers.findIndex((d) => d.id === driver.id) ?? -1;
  const latestRound = season.rounds.at(-1)!.round;
  const weekends = driverWeekends(season, driver.id);
  const changedTeams = spells.length > 1;
  const pairs = teammateHeadToHeads(season, driver.id);
  const mentions = wire.stories.filter((s) => s.tags.some((t) => t.id === `driver:${driver.id}`)).slice(0, MENTIONS);

  const notes = [
    changedTeams && spells.map((s) => `${teamOf(season, s.constructorId).name} ${roundSpan(s.rounds)}`).join(" → "),
    lastSpell.to < latestRound && `Not in the R${latestRound} line-up; last raced in R${lastSpell.to}.`,
  ].filter(Boolean);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">
      <DriverHero
        number={driver.number}
        helmet={helmetDesign(driver.id, team.color)}
        photo={driverPhoto(driver.id)}
        code={driver.code}
        givenName={driver.givenName}
        familyName={driver.familyName}
        color={team.color}
        team={{ name: team.name, href: teamHref(lastSpell.constructorId) }}
        facts={[
          driver.nationality,
          driver.dateOfBirth && `Age ${ageOn(driver.dateOfBirth, wire.now)}`,
          `${season.season} · after R${latestRound}`,
        ].filter((f): f is string => Boolean(f))}
        note={notes.join(" ")}
        stats={[
          { label: "Standing", value: standing >= 0 ? `P${standing + 1}` : "—" },
          { label: "Points", value: String(standing >= 0 ? standings!.drivers[standing].points : stats.points) },
          { label: "Wins", value: String(stats.wins) },
          { label: "Podiums", value: String(stats.podiums) },
          { label: "Poles", value: String(stats.poles) },
          { label: "Best finish", value: stats.bestFinish ? `P${stats.bestFinish}` : "—" },
        ]}
      />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-6">
        <div className="min-w-0 space-y-8 lg:col-span-7">
          <section aria-labelledby="form-title">
            <SectionHeader
              id="form-title"
              title="Form"
              kerb
              action={<span className="font-mono text-xs uppercase text-fg-dim">Last 5 Grands Prix</span>}
            />
            <Panel as="div" className="p-4">
              <FormChips form={recentForm(season, driver.id)} label={`${name}'s last five Grand Prix results`} />
            </Panel>
          </section>

          <section aria-labelledby="results-title">
            <SectionHeader
              id="results-title"
              title="Season results"
              action={<span className="font-mono text-xs uppercase text-fg-dim">{stats.starts} starts · {stats.dnfs} DNF</span>}
            />
            <Panel as="div" className="overflow-x-auto">
              <table className="w-full min-w-[32rem] text-sm">
                <caption className="sr-only">
                  {name}&apos;s {season.season} results by round
                </caption>
                <thead>
                  <tr className="border-b border-line text-left text-xs uppercase text-fg-dim">
                    <th scope="col" className="px-3 py-2 font-bold">Rd</th>
                    <th scope="col" className="px-3 py-2 font-bold">Grand Prix</th>
                    <th scope="col" className="px-3 py-2 text-right font-bold">Quali</th>
                    <th scope="col" className="px-3 py-2 text-right font-bold">Sprint</th>
                    <th scope="col" className="px-3 py-2 text-right font-bold">Grid</th>
                    <th scope="col" className="px-3 py-2 text-right font-bold">Finish</th>
                    <th scope="col" className="px-3 py-2 text-right font-bold">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-mono tabular-nums">
                  {weekends.map((w) => {
                    const wTeam = teamOf(season, w.constructorId);
                    return (
                      <tr key={w.round} className="hover:bg-kerb">
                        <td className="px-3 py-2 text-fg-dim">R{w.round}</td>
                        <td className="px-3 py-2 font-sans">
                          <span className="flex items-center gap-2">
                            {changedTeams && (
                              <span
                                style={teamStyle(wTeam.color)}
                                title={wTeam.name}
                                className="slant block h-3 w-1.5 shrink-0 bg-(--team)"
                              >
                                <span className="sr-only">{wTeam.name}: </span>
                              </span>
                            )}
                            {w.event.replace(/ Grand Prix$/, "")}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">{w.qualifying ? `P${w.qualifying}` : "—"}</td>
                        <td className="px-3 py-2 text-right">{w.sprint ? finishLabel(w.sprint) : ""}</td>
                        <td className="px-3 py-2 text-right">{gridLabel(w.race.grid)}</td>
                        <td
                          className={`px-3 py-2 text-right font-bold ${classified(w.race) ? "" : "text-flag-red"}`}
                        >
                          {finishLabel(w.race)}
                        </td>
                        <td className="px-3 py-2 text-right">{w.points || ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Panel>
            {changedTeams && (
              <p className="mt-2 text-xs text-fg-dim">The bar beside each Grand Prix is the team raced for that round.</p>
            )}
          </section>
        </div>

        <div className="min-w-0 space-y-8 lg:col-span-5">
          <section aria-labelledby="h2h-title">
            <SectionHeader id="h2h-title" title="Teammate head-to-head" />
            <div className="space-y-3">
              {pairs.map((h) => {
                const mate = season.drivers.find((d) => d.id === h.drivers[1]);
                const pairTeam = teamOf(season, h.constructorId);
                return (
                  <HeadToHeadCard
                    key={`${h.constructorId}-${h.drivers[1]}`}
                    a={{ code: driver.code, name }}
                    b={{
                      code: mate?.code ?? h.drivers[1],
                      name: mate ? fullName(mate) : h.drivers[1],
                      href: mate && driverHref(mate.code),
                    }}
                    color={pairTeam.color}
                    context={`${pairTeam.name} · ${roundSpan(h.rounds)} · ${h.rounds.length} ${h.rounds.length === 1 ? "round" : "rounds"}`}
                    qualifying={h.qualifying}
                    race={h.race}
                    points={h.points}
                  />
                );
              })}
            </div>
            <p className="mt-2 text-xs text-fg-dim">
              Qualifying counts rounds where both set a time. Race counts finishing order, retirements included, when
              both started. Points include sprints.
            </p>
          </section>

          <section aria-labelledby="driver-news-title">
            <SectionHeader id="driver-news-title" title="In the news" />
            <NewsMentions stories={mentions} subject={driver.familyName} />
          </section>
        </div>
      </div>

      <p className="mt-6 text-xs text-fg-dim">Results: Jolpica-F1, refreshed hourly.</p>
    </main>
  );
}
