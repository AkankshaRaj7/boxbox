import { ArrowRight } from "lucide-react";
import { Panel } from "@/components/f1/Panel";
import { ShiftLightMeter } from "@/components/f1/ShiftLightMeter";
import { TeamColorBar } from "@/components/f1/TeamColorBar";
import type { RumorStatus } from "@/lib/credibility";

type TeamRef = { name: string; color: string };

/** A driver-market rumor: who, from where to where, and how credible it is. */
export function RumorCard({
  driver,
  fromTeam,
  toTeam,
  status,
  outlets,
}: {
  driver: string;
  fromTeam: TeamRef;
  toTeam: TeamRef;
  status: RumorStatus;
  outlets: number;
}) {
  const staying = fromTeam.name === toTeam.name;
  return (
    <Panel as="article" className="flex">
      <TeamColorBar color={toTeam.color} />
      <div className="flex-1 p-4">
        <div className="text-xs font-bold uppercase text-fg-dim">{staying ? "Contract extension" : "Driver market"}</div>
        <h3 className="mt-0.5 text-lg font-bold">{driver}</h3>
        <p className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-fg-dim">
          {staying ? (
            <>Stays at {toTeam.name}</>
          ) : (
            <>
              {fromTeam.name}
              <ArrowRight size={14} aria-label="to" />
              <span className="font-semibold text-fg">{toTeam.name}</span>
            </>
          )}
        </p>
        <ShiftLightMeter status={status} outlets={outlets} />
      </div>
    </Panel>
  );
}
