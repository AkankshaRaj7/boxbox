import { teamStyle } from "@/lib/color";

/** One team's line. `values` may hold null for a race it has no reading for. */
export type TelemetrySeries = { name: string; color: string; values: (number | null)[] };

type Point = { index: number; value: number };

/**
 * Unbroken stretches of readings, so a missing race splits the line in two.
 * A stretch of one still draws: a round stroke cap renders it as a dot.
 */
function runs(values: (number | null)[]): Point[][] {
  const out: Point[][] = [];
  let current: Point[] = [];
  values.forEach((value, index) => {
    if (value === null) {
      if (current.length > 0) {
        out.push(current);
        current = [];
      }
      return;
    }
    current.push({ index, value });
  });
  if (current.length > 0) {
    out.push(current);
  }
  return out;
}

const W = 560;
const H = 220;
const M = { top: 12, right: 12, bottom: 24, left: 42 };

/**
 * Season pace trend on a telemetry screen: gap to the fastest car (%) per round,
 * one glowing line per team. Lower is quicker, so the axis is drawn with 0 on top.
 *
 * A gap of null breaks the line rather than joining across it, so a team that
 * has no reading for a race doesn't get an invented one. Pass `labels` when the
 * rounds plotted don't start at round 1.
 */
export function TelemetryChart({
  series,
  title,
  labels,
}: {
  series: TelemetrySeries[];
  title: string;
  labels?: string[];
}) {
  const rounds = Math.max(...series.map((s) => s.values.length));
  const gaps = series.flatMap((s) => s.values).filter((v): v is number => v !== null);
  const maxGap = Math.max(...gaps, 0.1);
  const plotW = W - M.left - M.right;
  const plotH = H - M.top - M.bottom;
  const x = (i: number) => M.left + (rounds > 1 ? (i / (rounds - 1)) * plotW : plotW / 2);
  const y = (v: number) => M.top + (v / maxGap) * plotH;
  const ticks = [0, maxGap / 2, maxGap];

  return (
    <figure className="border border-line bg-asphalt p-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={title}>
        <title>{title}</title>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} className="stroke-line" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
            <text x={M.left - 6} y={y(t) + 3} textAnchor="end" className="fill-fg-dim font-mono text-[11px]">
              {t.toFixed(1)}%
            </text>
          </g>
        ))}
        {Array.from({ length: rounds }, (_, i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle" className="fill-fg-dim font-mono text-[11px]">
            {labels?.[i] ?? `R${i + 1}`}
          </text>
        ))}
        {series.map((s) => (
          <g key={s.name} style={teamStyle(s.color)}>
            {runs(s.values).map((run) => (
              <polyline
                key={run[0].index}
                points={run.map((point) => `${x(point.index).toFixed(1)},${y(point.value).toFixed(1)}`).join(" ")}
                fill="none"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className="stroke-(--team-text) drop-shadow-[0_0_3px_var(--team-text)]"
              />
            ))}
          </g>
        ))}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5">
            <span aria-hidden="true" style={teamStyle(s.color)} className="block h-0.5 w-4 bg-(--team-text)" />
            {s.name}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
