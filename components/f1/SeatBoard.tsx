import { SlantTag } from "@/components/f1/SlantTag";
import { TeamColorBar } from "@/components/f1/TeamColorBar";
import type { SeatStatus } from "@/lib/sample-data";

export type SeatBoardRow = {
  teamName: string;
  color: string;
  seats: { driver: string | null; status: SeatStatus; contractEnds?: number }[];
};

const STATUS: Record<Exclude<SeatStatus, "open">, { tone: "green" | "yellow"; label: string }> = {
  confirmed: { tone: "green", label: "Confirmed" },
  likely: { tone: "yellow", label: "Likely" },
};

/** Next season's grid as a garage whiteboard: two magnetic name tags per team. */
export function SeatBoard({ season, rows }: { season: number; rows: SeatBoardRow[] }) {
  return (
    <div className="border border-line bg-kerb bg-[radial-gradient(var(--color-line)_1px,transparent_1px)] bg-size-[14px_14px] p-3">
      <div className="headline mb-3 text-sm text-fg-dim">{season} grid</div>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.teamName}>
            <div className="mb-1.5 flex items-center gap-2 text-sm font-bold">
              <TeamColorBar color={row.color} className="h-4 self-center" />
              {row.teamName}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {row.seats.map((seat, i) =>
                seat.driver === null || seat.status === "open" ? (
                  <div
                    key={i}
                    className="flex min-h-14 items-center justify-center border border-dashed border-fg-dim/50 text-xs font-bold uppercase text-fg-dim"
                  >
                    Open seat
                  </div>
                ) : (
                  <div key={i} className="flex min-h-14 border border-line bg-asphalt shadow-[2px_2px_0_var(--color-line)]">
                    <TeamColorBar color={row.color} />
                    <div className="flex flex-1 flex-col justify-center gap-1 px-2 py-1.5">
                      <span className="font-mono font-bold">{seat.driver}</span>
                      <span className="flex items-center gap-2">
                        <SlantTag tone={STATUS[seat.status].tone}>{STATUS[seat.status].label}</SlantTag>
                        {seat.contractEnds && (
                          <span className="font-mono text-[11px] text-fg-dim">to {seat.contractEnds}</span>
                        )}
                      </span>
                    </div>
                  </div>
                ),
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
