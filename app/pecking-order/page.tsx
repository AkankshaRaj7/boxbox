import type { Metadata } from "next";
import { Panel } from "@/components/f1/Panel";
import { PowerRankRow } from "@/components/f1/PowerRankRow";
import { POWER_RANKING, TEAMS } from "@/lib/sample-data";

export const metadata: Metadata = {
  title: "Pecking order — BOXBOX",
  description: "Which car is quickest, ranked on race pace and how the order has moved through the season.",
};

/**
 * The car pecking order. Still the fictional sample ranking: the real one is
 * computed from race-lap pace, which lands with the pace pipeline.
 */
export default function PeckingOrderPage() {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">
      <div className="mb-4">
        <h1 className="headline text-display-sm">Pecking order</h1>
        <div className="kerb-stripe mt-1.5 h-1.5 w-16" aria-hidden="true" />
      </div>
      <p className="mb-4 max-w-3xl text-sm text-fg-dim">
        Which car is quickest, and by how much. Each team&apos;s gap is measured against the fastest car of the
        weekend; the sparkline follows that gap through the season, so a line climbing towards the top means a team
        closing in.
      </p>
      <p className="mb-4 border-l-2 border-flag-yellow bg-carbon px-3 py-2 text-sm text-fg-dim">
        This ranking is still fictional sample data. Real race pace replaces it shortly.
      </p>
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
    </main>
  );
}
