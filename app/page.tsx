import { Panel, SectionHeader } from "@/components/f1/Panel";
import { PitBoardCountdown } from "@/components/f1/PitBoardCountdown";
import { PowerRankRow } from "@/components/f1/PowerRankRow";
import { PredictionSlip } from "@/components/f1/PredictionSlip";
import { RadioCard } from "@/components/f1/RadioCard";
import { EnamelPin, StreakFlame } from "@/components/f1/Rewards";
import { RumorCard } from "@/components/f1/RumorCard";
import { SectorChip } from "@/components/f1/SectorChip";
import { StandingsPanel } from "@/components/f1/StandingsPanel";
import { TrackOutline } from "@/components/f1/TrackOutline";
import { TyreDot } from "@/components/f1/TyreDot";
import { fetchStandings } from "@/lib/jolpica";
import {
  BRIEFING,
  CIRCUIT,
  HOT_RUMOR,
  NEXT_SESSION,
  PLAYER,
  POWER_RANKING,
  PREDICTION_SLIP,
  SAMPLE_LAP,
  STORIES,
  TEAMS,
} from "@/lib/sample-data";
import type { Standings } from "@/lib/standings";

/** Re-render hourly, so a failed standings fetch is retried rather than cached. Matches STANDINGS_REVALIDATE. */
export const revalidate = 3600;

/** Real championship standings, with a message instead if Jolpica is down. */
async function Championship() {
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
          <StandingsPanel drivers={standings.drivers} constructors={standings.constructors} />
        ) : (
          <p className="p-4 text-sm text-fg-dim">
            {standings
              ? "No points on the board yet. Standings appear after the first race."
              : "Standings are off the timing screens right now. Check back shortly."}
          </p>
        )}
      </Panel>
      <p className="mt-2 text-xs text-fg-dim">Data: Jolpica-F1, refreshed hourly.</p>
    </section>
  );
}

/**
 * The Paddock: the daily hub. Championship standings are real; the rest still
 * renders from fictional sample data until Phase 1 replaces it.
 */
export default function PaddockPage() {
  return (
    <main id="paddock" className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 pt-4 md:px-6">
      <p className="mb-4 border-l-2 border-flag-yellow bg-carbon px-3 py-2 text-sm text-fg-dim">
        Championship standings are real. Everything else on this page (countdown, briefing, circuit, news, rumors,
        pecking order and the game) is still fictional sample data.
      </p>

      <div className="grid gap-4 lg:grid-cols-12">
        <PitBoardCountdown className="lg:col-span-4" {...NEXT_SESSION} />

        <Panel className="p-4 lg:col-span-5" aria-labelledby="briefing-title">
          <SectionHeader
            id="briefing-title"
            title="The Briefing"
            kerb
            action={<span className="font-mono text-xs text-fg-dim">60 SEC READ</span>}
          />
          <ul className="space-y-2.5">
            {BRIEFING.map((line) => (
              <li key={line} className="flex gap-2.5">
                <span aria-hidden="true" className="slant mt-2 block h-1.5 w-2.5 shrink-0 bg-box-red" />
                {line}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="p-4 lg:col-span-3" aria-labelledby="circuit-title">
          <SectionHeader id="circuit-title" title="Circuit" />
          <TrackOutline name={CIRCUIT.name} />
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {[
              ["Length", `${CIRCUIT.lengthKm} km`],
              ["Laps", CIRCUIT.laps],
              ["DRS zones", CIRCUIT.drsZones],
              ["Last winner", CIRCUIT.lastWinner],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="font-bold uppercase text-fg-dim">{label}</dt>
                <dd className="font-mono text-sm">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-6">
        <Championship />

        <section id="news" aria-labelledby="news-title" className="scroll-mt-20 lg:col-span-5">
          <SectionHeader id="news-title" title="Radio feed" kerb />
          <div className="space-y-3">
            <Panel as="div" className="flex flex-wrap items-center gap-3 p-4">
              <span className="text-xs font-bold uppercase text-fg-dim">Fastest lap · FP2</span>
              <span className="font-mono font-bold">{SAMPLE_LAP.driver}</span>
              <span className="font-mono text-sector-fastest">{SAMPLE_LAP.lap}</span>
              <TyreDot compound="soft" />
              <div className="flex w-full flex-wrap gap-2">
                {SAMPLE_LAP.sectors.map((s) => (
                  <SectorChip key={s.label} {...s} />
                ))}
              </div>
            </Panel>
            {STORIES.map((story) => (
              <RadioCard key={story.id} {...story} />
            ))}
          </div>
        </section>

        <div className="space-y-8 lg:col-span-3">
          <section id="market" aria-labelledby="market-title" className="scroll-mt-20">
            <SectionHeader id="market-title" title="Silly Season" kerb />
            <RumorCard
              driver={HOT_RUMOR.driver}
              fromTeam={TEAMS[HOT_RUMOR.fromTeam]}
              toTeam={TEAMS[HOT_RUMOR.toTeam]}
              status={HOT_RUMOR.status}
              outlets={HOT_RUMOR.outlets}
            />
          </section>

          <section id="pace" aria-labelledby="pace-title" className="scroll-mt-20">
            <SectionHeader id="pace-title" title="Pecking order" kerb />
            <Panel as="div" className="divide-y divide-line">
              {POWER_RANKING.map((row) => (
                <PowerRankRow
                  key={row.team}
                  rank={row.rank}
                  teamName={TEAMS[row.team].name}
                  color={TEAMS[row.team].color}
                  movement={row.movement}
                  trend={row.trend}
                />
              ))}
            </Panel>
          </section>
        </div>
      </div>

      <section id="play" aria-labelledby="play-title" className="mt-8 scroll-mt-20">
        <SectionHeader id="play-title" title="Play" kerb />
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <PredictionSlip {...PREDICTION_SLIP} />
          </div>
          <Panel as="div" className="flex flex-col gap-5 p-4 lg:col-span-7">
            <div className="flex flex-wrap items-end gap-8">
              <div>
                <div className="text-xs font-bold uppercase text-fg-dim">Season points</div>
                <div className="font-mono text-display leading-none tabular-nums">{PLAYER.points}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase text-fg-dim">{PLAYER.leagueName}</div>
                <div className="headline text-display">P{PLAYER.leagueRank}</div>
              </div>
              <StreakFlame streak={PLAYER.streak} />
            </div>
            <div>
              <div className="mb-2 text-xs font-bold uppercase text-fg-dim">Badges</div>
              <div className="flex flex-wrap gap-3">
                {PLAYER.badges.map((b) => (
                  <EnamelPin key={b} label={b} />
                ))}
              </div>
            </div>
          </Panel>
        </div>
      </section>
    </main>
  );
}
