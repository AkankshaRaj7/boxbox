import type { Metadata } from "next";
import { Panel, SectionHeader } from "@/components/f1/Panel";
import { PeckingOrderTable } from "@/components/f1/PeckingOrderTable";
import { TelemetryChart } from "@/components/f1/TelemetryChart";
import { FORM_RACES, OUTLIER_FACTOR, PACE, peckingOrder, seasonTrend } from "@/lib/pace";
import { teamInfo } from "@/lib/teams";
import { formatUtcStamp } from "@/lib/time";

export const metadata: Metadata = {
  title: "Pecking order — BOXBOX",
  description: "Which car is quickest, ranked on race pace from every round of the season so far.",
};

/** Lines on the season chart: every team at once is unreadable. */
const CHART_TEAMS = 5;

/** The car pecking order, ranked on race pace from OpenF1 lap times. */
export default function PeckingOrderPage() {
  const teams = peckingOrder();
  const { races, generatedAt } = PACE;
  const window = races.slice(-FORM_RACES);
  const rounds = window.length > 1 ? `rounds ${window[0].round}–${window.at(-1)!.round}` : `round ${window[0]?.round}`;
  const series = teams.slice(0, CHART_TEAMS).map((team) => ({
    name: teamInfo(team.constructorId, team.constructorId).name,
    color: teamInfo(team.constructorId, team.constructorId).color,
    values: seasonTrend(races, team.constructorId),
  }));

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="headline text-display-sm">Pecking order</h1>
          <div className="kerb-stripe mt-1.5 h-1.5 w-16" aria-hidden="true" />
        </div>
        {races.length > 0 && (
          <span className="font-mono text-xs uppercase text-fg-dim">
            {races.length} races · to R{races.at(-1)!.round}
          </span>
        )}
      </div>
      <p className="mb-4 max-w-3xl text-sm text-fg-dim">
        Which car is quickest, measured on race pace rather than a single qualifying lap. Each team&apos;s gap is
        taken against the quickest car of that race and averaged over the last {FORM_RACES} rounds, so one wet
        afternoon or one safety car doesn&apos;t decide the order.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <PeckingOrderTable teams={teams} />
          {teams.length > 0 && (
            <p className="mt-2 text-xs text-fg-dim">
              Average gap across {rounds}. The sparkline follows that gap race by race — climbing means closing in.
            </p>
          )}
        </div>

        {series.length > 0 && (
          <section aria-labelledby="trend-title" className="lg:col-span-5">
            <SectionHeader id="trend-title" title="Season trend" />
            <TelemetryChart
              title={`Gap to the quickest car by round, top ${series.length} teams`}
              series={series}
              labels={races.map((race) => `R${race.round}`)}
            />
            <p className="mt-2 text-xs text-fg-dim">
              A break in a line is a race that car has no usable pace from — both cars out early, or too few clean laps.
            </p>
          </section>
        )}
      </div>

      <Panel className="mt-8 p-4" aria-labelledby="method-title">
        <SectionHeader id="method-title" title="How this is measured" kerb />
        <div className="grid gap-4 text-sm text-fg-dim md:grid-cols-2">
          <div className="space-y-2">
            <p>
              Every race lap a driver completed, minus the lap they pitted on, the lap out of the pits, and any lap
              more than {Math.round((OUTLIER_FACTOR - 1) * 100)}% off their own median — which takes out safety cars,
              traffic and a lap spent nursing a problem. What is left gives a median lap time.
            </p>
            <p>
              A team is judged on its quicker car, so a retirement or an afternoon stuck behind someone else
              doesn&apos;t become the car&apos;s pace. That median is compared with the quickest team&apos;s in the
              same race, then averaged over the last {FORM_RACES} rounds.
            </p>
          </div>
          <div className="space-y-2">
            <p>
              <span className="font-bold text-fg">What it cannot see:</span> fuel loads, tyre compounds, an engine
              turned down once a result was safe, track position, or a wet race. Two teams within a tenth of a
              percent are, in practice, level — read the order, not the decimals.
            </p>
            <p>
              Lap times from{" "}
              <a href="https://openf1.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-fg">
                OpenF1
              </a>
              , rounds and entries from Jolpica-F1.
              {generatedAt && ` Last built ${formatUtcStamp(generatedAt)}.`}
            </p>
          </div>
        </div>
      </Panel>
    </main>
  );
}
