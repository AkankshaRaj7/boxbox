import Link from "next/link";
import { Panel } from "@/components/f1/Panel";
import { SectorChip } from "@/components/f1/SectorChip";
import { TyreDot } from "@/components/f1/TyreDot";
import { teamStyle } from "@/lib/color";
import type { FastestLap } from "@/lib/pace";
import { driverHref } from "@/lib/season";
import { teamInfo } from "@/lib/teams";
import { formatLapTime } from "@/lib/time";

/**
 * The quickest lap of the most recent race: who set it, on what tyre, and how
 * its three sectors compared with the rest of the session.
 */
export function FastestLapCard({ lap }: { lap: FastestLap }) {
  const team = teamInfo(lap.constructorId, lap.constructorId);
  return (
    <Panel as="div" className="flex flex-wrap items-center gap-x-3 gap-y-2 p-4">
      <Link
        href={`/races/${lap.round}`}
        className="w-full text-xs font-bold uppercase text-fg-dim hover:text-fg"
      >
        Fastest lap · {lap.event} <span aria-hidden="true">→</span>
      </Link>
      <Link
        href={driverHref(lap.driverCode)}
        style={teamStyle(team.color)}
        className="font-mono font-bold text-(--team-text) hover:underline"
      >
        {lap.driverCode}
      </Link>
      <span className="font-mono text-sector-fastest">{formatLapTime(lap.seconds)}</span>
      <span className="font-mono text-xs uppercase text-fg-dim">Lap {lap.lapNumber}</span>
      {lap.compound && (
        <span className="ml-auto inline-flex items-center gap-2">
          <TyreDot compound={lap.compound} showName />
          {lap.tyreAgeLaps !== null && (
            <span className="text-xs text-fg-dim">
              {lap.tyreAgeLaps} {lap.tyreAgeLaps === 1 ? "lap" : "laps"} old
            </span>
          )}
        </span>
      )}
      <div className="flex w-full flex-wrap gap-2">
        {lap.sectors.map((sector, index) => (
          <SectorChip key={index} label={`S${index + 1}`} time={sector.seconds.toFixed(3)} kind={sector.kind} />
        ))}
      </div>
    </Panel>
  );
}
