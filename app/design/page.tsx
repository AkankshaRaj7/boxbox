import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LightsReplay } from "@/components/design/LightsReplay";
import { TowerShuffleDemo } from "@/components/design/TowerShuffleDemo";
import { Panel, SectionHeader } from "@/components/f1/Panel";
import { PitBoardCountdown } from "@/components/f1/PitBoardCountdown";
import { PowerRankRow } from "@/components/f1/PowerRankRow";
import { PredictionSlip } from "@/components/f1/PredictionSlip";
import { RadioCard } from "@/components/f1/RadioCard";
import { EnamelPin, StreakFlame } from "@/components/f1/Rewards";
import { RumorCard } from "@/components/f1/RumorCard";
import { SeatBoard } from "@/components/f1/SeatBoard";
import { SectorChip } from "@/components/f1/SectorChip";
import { ShiftLightMeter } from "@/components/f1/ShiftLightMeter";
import { SlantTag } from "@/components/f1/SlantTag";
import { TelemetryChart } from "@/components/f1/TelemetryChart";
import { TrackOutline } from "@/components/f1/TrackOutline";
import { TyreDot, type TyreCompound } from "@/components/f1/TyreDot";
import { Wordmark } from "@/components/f1/Wordmark";
import { readableOn } from "@/lib/color";
import type { RumorStatus } from "@/lib/credibility";
import {
  CIRCUIT,
  NEXT_SESSION,
  POWER_RANKING,
  PREDICTION_SLIP,
  RUMORS,
  SAMPLE_LAP,
  SEATS,
  STORIES,
  TEAMS,
  driverStandings,
} from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Style guide — BOXBOX",
  robots: { index: false, follow: false },
};

const SWATCH_GROUPS: { title: string; swatches: { name: string; className: string; use: string }[] }[] = [
  {
    title: "Base",
    swatches: [
      { name: "asphalt", className: "bg-asphalt", use: "Page background" },
      { name: "carbon", className: "bg-carbon", use: "Cards" },
      { name: "kerb", className: "bg-kerb", use: "Raised, hover" },
      { name: "line", className: "bg-line", use: "Dividers" },
      { name: "fg", className: "bg-fg", use: "Primary text" },
      { name: "fg-dim", className: "bg-fg-dim", use: "Secondary text" },
      { name: "box-red", className: "bg-box-red", use: "Brand accent, live" },
    ],
  },
  {
    title: "Timing",
    swatches: [
      { name: "sector-fastest", className: "bg-sector-fastest", use: "Fastest overall" },
      { name: "sector-pb", className: "bg-sector-pb", use: "Personal best" },
      { name: "sector-slower", className: "bg-sector-slower", use: "Slower" },
    ],
  },
  {
    title: "Tyres",
    swatches: [
      { name: "tyre-soft", className: "bg-tyre-soft", use: "Soft" },
      { name: "tyre-medium", className: "bg-tyre-medium", use: "Medium" },
      { name: "tyre-hard", className: "bg-tyre-hard", use: "Hard" },
      { name: "tyre-inter", className: "bg-tyre-inter", use: "Intermediate" },
      { name: "tyre-wet", className: "bg-tyre-wet", use: "Wet" },
    ],
  },
  {
    title: "Flags",
    swatches: [
      { name: "flag-green", className: "bg-flag-green", use: "Confirmed, live" },
      { name: "flag-yellow", className: "bg-flag-yellow", use: "Caution, rumor" },
      { name: "flag-red", className: "bg-flag-red", use: "Breaking" },
      { name: "flag-blue", className: "bg-flag-blue", use: "Info" },
      { name: "chequered", className: "chequered", use: "Finished, signed" },
    ],
  },
];

const TYPE_SCALE = [
  { className: "headline text-hero", label: "Hero · 64 · Titillium 900 italic", sample: "Lights out" },
  { className: "headline text-display", label: "Display · 40", sample: "Pecking order" },
  { className: "headline text-display-sm", label: "Display small · 28", sample: "Silly Season" },
  { className: "text-xl font-bold", label: "Title · 20 · 700", sample: "Aurora confirm upgrade package" },
  { className: "text-base", label: "Body · 16 · 400", sample: "New sidepods and a revised beam wing." },
  { className: "text-sm text-fg-dim", label: "Small · 14", sample: "Reported by 6 outlets" },
  { className: "font-mono text-xl tabular-nums", label: "Timing · JetBrains Mono · tabular", sample: "1:18.214  +0.087" },
];

const COMPOUNDS: TyreCompound[] = ["soft", "medium", "hard", "inter", "wet"];
const STATUSES: RumorStatus[] = ["whisper", "linked", "strong", "signed"];

function GuideSection({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t border-line pt-8">
      <SectionHeader id={id} title={title} kerb />
      {children}
    </section>
  );
}

function Specimen({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="mb-2 font-mono text-xs text-fg-dim">{label}</div>
      {children}
    </div>
  );
}

/**
 * Dev-only style guide: every design token and F1 component in one place.
 * Returns 404 in production builds.
 */
export default function DesignPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const towerRows = driverStandings()
    .slice(0, 6)
    .map((r) => ({ id: r.id, code: r.code, name: r.name, color: r.color, value: `${r.points} PTS` }));

  return (
    <main className="mx-auto w-full max-w-7xl space-y-10 px-4 py-8 md:px-6">
      <header className="space-y-3">
        <SlantTag tone="red">Dev only</SlantTag>
        <h1 className="headline text-display">Pit Wall at Night</h1>
        <p className="max-w-2xl text-fg-dim">
          The BOXBOX design system: tokens, type, shapes, motion and every F1 component, rendered with fictional
          sample data.
        </p>
      </header>

      <GuideSection id="brand" title="Brand">
        <div className="grid gap-6 md:grid-cols-3">
          <Specimen label="Wordmark · lg" className="md:col-span-2">
            <Wordmark size="lg" />
          </Specimen>
          <Specimen label="Voice">
            <ul className="space-y-1">
              <li className="headline text-lg">Everything from the pit wall.</li>
              <li className="headline text-lg text-box-red">Lights out and away we go.</li>
              <li className="font-mono text-sm text-fg-dim">Copy. ALV P1 by 0.214.</li>
            </ul>
          </Specimen>
        </div>
      </GuideSection>

      <GuideSection id="colour" title="Colour">
        <div className="space-y-6">
          {SWATCH_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 text-sm font-bold uppercase text-fg-dim">{group.title}</h3>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
                {group.swatches.map((s) => (
                  <li key={s.name}>
                    <div className={`h-14 border border-line ${s.className}`} />
                    <div className="mt-1 font-mono text-xs">{s.name}</div>
                    <div className="text-xs text-fg-dim">{s.use}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="mb-2 text-sm font-bold uppercase text-fg-dim">Team colours · text auto-lightened to AA</h3>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {Object.values(TEAMS).map((team) => (
                <li key={team.id} className="flex items-stretch gap-3 border border-line bg-carbon">
                  <span className="block w-1" style={{ background: team.color }} aria-hidden="true" />
                  <span className="flex-1 py-2 font-bold" style={{ color: readableOn(team.color) }}>
                    {team.name}
                  </span>
                  <span className="self-center pr-3 text-right font-mono text-[11px] text-fg-dim">
                    {team.color} → {readableOn(team.color)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </GuideSection>

      <GuideSection id="type" title="Typography">
        <ul className="space-y-4">
          {TYPE_SCALE.map((t) => (
            <li key={t.label} className="grid gap-1 md:grid-cols-[16rem_1fr] md:items-baseline">
              <span className="font-mono text-xs text-fg-dim">{t.label}</span>
              <span className={`${t.className} min-w-0 break-words`}>{t.sample}</span>
            </li>
          ))}
        </ul>
      </GuideSection>

      <GuideSection id="shape" title="Shape">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Specimen label="Speed slant · −12°">
            <div className="flex flex-wrap gap-2">
              <SlantTag tone="red">Breaking</SlantTag>
              <SlantTag tone="yellow">Rumor</SlantTag>
              <SlantTag tone="green">Confirmed</SlantTag>
              <SlantTag tone="blue">Info</SlantTag>
              <SlantTag>Neutral</SlantTag>
            </div>
          </Specimen>
          <Specimen label="Pit-board card">
            <Panel as="div" className="h-20 p-3 text-sm text-fg-dim">
              Cut corner, carbon weave
            </Panel>
          </Specimen>
          <Specimen label="Kerb stripe · once per page">
            <div className="kerb-stripe h-3" />
          </Specimen>
          <Specimen label="Chequered · winners and signed deals only">
            <div className="chequered h-10" />
          </Specimen>
        </div>
      </GuideSection>

      <GuideSection id="motion" title="Motion">
        <div className="grid gap-6 md:grid-cols-2">
          <Specimen label="LightsOut · once per session, off under reduced motion">
            <LightsReplay />
          </Specimen>
          <Specimen label="Timing tower · rows animate into their new order">
            <Panel as="div">
              <TowerShuffleDemo rows={towerRows} />
            </Panel>
          </Specimen>
        </div>
      </GuideSection>

      <GuideSection id="components" title="Components">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Specimen label="PitBoardCountdown">
            <PitBoardCountdown {...NEXT_SESSION} />
          </Specimen>
          <Specimen label="TrackOutline">
            <Panel as="div" className="p-4">
              <TrackOutline name={CIRCUIT.name} />
            </Panel>
          </Specimen>
          <Specimen label="SectorChip · TyreDot">
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {SAMPLE_LAP.sectors.map((s) => (
                  <SectorChip key={s.label} {...s} />
                ))}
              </div>
              <div className="flex flex-wrap gap-4">
                {COMPOUNDS.map((c) => (
                  <TyreDot key={c} compound={c} showName />
                ))}
              </div>
            </div>
          </Specimen>
          <Specimen label="RadioCard" className="md:col-span-2">
            <div className="space-y-3">
              {STORIES.slice(0, 2).map((s) => (
                <RadioCard key={s.id} {...s} />
              ))}
            </div>
          </Specimen>
          <Specimen label="ShiftLightMeter · every status">
            <Panel as="div" className="space-y-4 p-4">
              {STATUSES.map((status) => (
                <ShiftLightMeter key={status} status={status} />
              ))}
            </Panel>
          </Specimen>
          <Specimen label="RumorCard" className="md:col-span-2 lg:col-span-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {RUMORS.map((r) => (
                <RumorCard
                  key={r.id}
                  driver={r.driver}
                  fromTeam={TEAMS[r.fromTeam]}
                  toTeam={TEAMS[r.toTeam]}
                  status={r.status}
                  outlets={r.outlets}
                />
              ))}
            </div>
          </Specimen>
          <Specimen label="PowerRankRow">
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
          </Specimen>
          <Specimen label="TelemetryChart" className="md:col-span-1 lg:col-span-2">
            <TelemetryChart
              title="Gap to the fastest car by round, sample data"
              series={POWER_RANKING.slice(0, 4).map((row) => ({
                name: TEAMS[row.team].name,
                color: TEAMS[row.team].color,
                values: row.trend,
              }))}
            />
          </Specimen>
          <Specimen label="SeatBoard">
            <SeatBoard
              season={2027}
              rows={SEATS.map((s) => ({ teamName: TEAMS[s.team].name, color: TEAMS[s.team].color, seats: s.seats }))}
            />
          </Specimen>
          <Specimen label="PredictionSlip">
            <PredictionSlip {...PREDICTION_SLIP} />
          </Specimen>
          <Specimen label="StreakFlame · EnamelPin">
            <div className="flex flex-wrap gap-3">
              <StreakFlame streak={5} />
              <EnamelPin label="Nostradamus" />
              <EnamelPin label="Rain Master" />
            </div>
          </Specimen>
        </div>
      </GuideSection>

      <GuideSection id="a11y" title="Accessibility rules">
        <ul className="grid gap-2 text-sm md:grid-cols-2">
          <li>Text meets WCAG AA; team colours use an auto-lightened text variant.</li>
          <li>Colour is never the only signal: sectors, tyres and flags always carry a label.</li>
          <li>Reduced motion turns off the lights-out intro, page wipes, pulses and tower animation.</li>
          <li>Visible red focus ring on every interactive element; touch targets at least 44px.</li>
        </ul>
      </GuideSection>
    </main>
  );
}
