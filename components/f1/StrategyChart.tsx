import type { Neutralisation, PitStop, RaceResult, Stint } from "@/lib/race";
import { teamInfo } from "@/lib/teams";

const W = 1000;
const ROW = 20;
const LABEL = 92;
const PAD = { top: 30, right: 12, bottom: 22 };

/**
 * Tyre colours, matching the TyreDot tokens so the page reads as one system.
 *
 * Two classes per compound on purpose: `fill` paints the SVG stint bars, `bg`
 * paints the legend swatch. They are not interchangeable — `fill-*` on an HTML
 * element sets a property nothing renders, which left the legend colourless.
 */
const COMPOUND: Record<string, { fill: string; swatch: string; name: string }> = {
  soft: { fill: "fill-tyre-soft", swatch: "bg-tyre-soft", name: "Soft" },
  medium: { fill: "fill-tyre-medium", swatch: "bg-tyre-medium", name: "Medium" },
  hard: { fill: "fill-tyre-hard", swatch: "bg-tyre-hard", name: "Hard" },
  inter: { fill: "fill-tyre-inter", swatch: "bg-tyre-inter", name: "Intermediate" },
  wet: { fill: "fill-tyre-wet", swatch: "bg-tyre-wet", name: "Wet" },
};

/** "L14–15", or "L50–" when the period never ended. */
function bandLabel(period: Neutralisation): string {
  const kind = period.kind === "vsc" ? "VSC" : "SC";
  if (period.toLap === null) {
    return `${kind} L${period.fromLap}–`;
  }
  return period.fromLap === period.toLap
    ? `${kind} L${period.fromLap}`
    : `${kind} L${period.fromLap}–${period.toLap}`;
}

/**
 * The race as a strategy chart: one row per driver, each stint a bar in its
 * tyre's colour, every pit stop a mark, safety car periods as bands down the
 * whole field.
 *
 * A row per driver is what makes it readable — the earlier version stacked
 * driver codes at the lap they pitted, so a cluster of ten became a wall of
 * text with no way to tell where one name ended and the next began.
 */
export function StrategyChart({
  laps,
  drivers,
  neutralisations,
  pit,
  stints,
}: {
  laps: number;
  /** Rows, top to bottom — already in the order the page wants. */
  drivers: RaceResult[];
  neutralisations: Neutralisation[];
  pit: PitStop[];
  stints: Stint[];
}) {
  const shown = drivers.filter((driver) => stints.some((stint) => stint.driverCode === driver.driverCode));
  const height = PAD.top + shown.length * ROW + PAD.bottom;
  const plot = W - LABEL - PAD.right;
  const x = (lap: number) => LABEL + ((lap - 1) / Math.max(1, laps)) * plot;
  const ticks = [1, ...Array.from({ length: Math.floor(laps / 10) }, (_, i) => (i + 1) * 10)];
  const used = [...new Set(stints.map((stint) => stint.compound).filter(Boolean))] as string[];

  return (
    <figure className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${height}`}
        className="w-full min-w-[680px]"
        role="img"
        aria-label={`Tyre strategy and pit stops for ${shown.length} drivers across ${laps} laps`}
      >
        {neutralisations.map((period, i) => {
          const from = x(period.fromLap);
          const to = x(Math.min(laps, (period.toLap ?? laps) + 1));
          return (
            <g key={i}>
              <rect
                x={from}
                y={PAD.top - 14}
                width={Math.max(6, to - from)}
                height={shown.length * ROW + 14}
                className="fill-flag-yellow/15"
              />
              <line
                x1={from}
                x2={from}
                y1={PAD.top - 14}
                y2={PAD.top + shown.length * ROW}
                className="stroke-flag-yellow/80"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <line
                x1={Math.max(from + 6, to)}
                x2={Math.max(from + 6, to)}
                y1={PAD.top - 14}
                y2={PAD.top + shown.length * ROW}
                className="stroke-flag-yellow/80"
                strokeDasharray="3 2"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={from}
                y={PAD.top - 18}
                textAnchor={from > W - 120 ? "end" : "start"}
                className="fill-flag-yellow font-mono text-[10px] font-bold"
              >
                {bandLabel(period)}
              </text>
            </g>
          );
        })}

        {shown.map((driver, row) => {
          const y = PAD.top + row * ROW;
          const team = teamInfo(driver.constructorId, driver.constructorId);
          return (
            <g key={driver.driverCode}>
              <rect x={0} y={y - 9} width={3} height={14} style={{ fill: team.color }} />
              <text x={10} y={y + 2} className="fill-fg font-mono text-[11px] font-bold">
                {driver.driverCode}
              </text>
              <text x={46} y={y + 2} className="fill-fg-dim font-mono text-[10px]">
                P{driver.positionText}
              </text>
              {stints
                .filter((stint) => stint.driverCode === driver.driverCode)
                .map((stint, i) => {
                  const left = x(stint.fromLap);
                  const width = Math.max(3, x(stint.toLap + 1) - left);
                  const tyre = stint.compound ? COMPOUND[stint.compound] : null;
                  return (
                    <rect
                      key={i}
                      x={left}
                      y={y - 6}
                      width={width}
                      height={11}
                      rx={2}
                      className={tyre ? tyre.fill : "fill-line"}
                    >
                      <title>{`${driver.driverCode}: ${tyre?.name ?? "unknown"} tyre, laps ${stint.fromLap}–${stint.toLap}`}</title>
                    </rect>
                  );
                })}
              {pit
                .filter((stop) => stop.driverCode === driver.driverCode)
                .map((stop, i) => (
                  <rect
                    key={i}
                    x={x(stop.lap + 1) - 1.5}
                    y={y - 10}
                    width={3}
                    height={19}
                    className={stop.underNeutralisation ? "fill-flag-yellow" : "fill-fg"}
                  >
                    <title>
                      {`${driver.driverCode} pitted on lap ${stop.lap}${stop.underNeutralisation ? ", under a neutralisation" : ""}`}
                    </title>
                  </rect>
                ))}
            </g>
          );
        })}

        <line
          x1={LABEL}
          x2={W - PAD.right}
          y1={height - PAD.bottom + 2}
          y2={height - PAD.bottom + 2}
          className="stroke-line"
        />
        {ticks.map((lap) => (
          <text
            key={lap}
            x={x(lap)}
            y={height - PAD.bottom + 15}
            textAnchor="middle"
            className="fill-fg-dim font-mono text-[10px]"
          >
            {lap}
          </text>
        ))}
      </svg>
      <figcaption className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-fg-dim">
        {used.map((compound) => (
          <span key={compound} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`block h-2.5 w-5 rounded-sm ${COMPOUND[compound]?.swatch}`} />
            {COMPOUND[compound]?.name}
          </span>
        ))}
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="block h-3.5 w-[3px] bg-flag-yellow" />
          Stop under a safety car
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="block h-3.5 w-[3px] bg-fg" />
          Stop under green
        </span>
        <span>Rows are grouped by team, teams in championship order. Lap numbers run along the bottom.</span>
      </figcaption>
    </figure>
  );
}
