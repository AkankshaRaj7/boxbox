import { Panel } from "@/components/f1/Panel";
import { PowerRankRow } from "@/components/f1/PowerRankRow";
import type { RankedTeam } from "@/lib/pace";
import { teamInfo } from "@/lib/teams";

/**
 * The car pecking order as a table of rows. `limit` cuts it to a preview, and
 * `compact` drops the sparkline for a narrow column, where it would otherwise
 * squeeze the team name down to an initial.
 *
 * Renders nothing but an explanation before the season's first race, when
 * there are no laps to rank anyone on.
 */
export function PeckingOrderTable({
  teams,
  limit,
  compact = false,
}: {
  teams: RankedTeam[];
  limit?: number;
  compact?: boolean;
}) {
  if (teams.length === 0) {
    return (
      <Panel as="div" className="p-4 text-sm text-fg-dim">
        No race pace yet. The order appears once the season&apos;s first race has run.
      </Panel>
    );
  }
  return (
    <Panel as="div" className="divide-y divide-line">
      {(limit === undefined ? teams : teams.slice(0, limit)).map((team) => {
        const info = teamInfo(team.constructorId, team.constructorId);
        return (
          <PowerRankRow
            key={team.constructorId}
            rank={team.rank}
            teamName={info.name}
            color={info.color}
            movement={team.movement}
            gap={team.gap}
            trend={team.trend}
            showTrend={!compact}
          />
        );
      })}
    </Panel>
  );
}
