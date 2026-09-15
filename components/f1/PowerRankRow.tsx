import { ChevronDown, ChevronUp, Minus } from "lucide-react";
import { TeamColorBar } from "@/components/f1/TeamColorBar";
import { teamStyle } from "@/lib/color";

const W = 64;
const H = 20;
const PAD = 2;

/** Sparkline of gap-to-fastest; lower gaps plot higher, so "up" always means quicker. */
function Sparkline({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const points = values
    .map((v, i) => {
      const x = values.length > 1 ? (i / (values.length - 1)) * W : W / 2;
      const y = PAD + ((v - min) / range) * (H - 2 * PAD);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-5 w-16 overflow-visible" aria-hidden="true" focusable="false">
      <polyline points={points} fill="none" strokeWidth="2" className="stroke-(--team-text)" />
    </svg>
  );
}

function Movement({ movement }: { movement: number }) {
  if (movement > 0) {
    return (
      <span className="flex w-10 items-center text-flag-green">
        <ChevronUp size={16} aria-hidden="true" />
        <span className="font-mono text-xs">{movement}</span>
        <span className="sr-only">up {movement} places</span>
      </span>
    );
  }
  if (movement < 0) {
    return (
      <span className="flex w-10 items-center text-box-red">
        <ChevronDown size={16} aria-hidden="true" />
        <span className="font-mono text-xs">{-movement}</span>
        <span className="sr-only">down {-movement} places</span>
      </span>
    );
  }
  return (
    <span className="flex w-10 items-center text-fg-dim">
      <Minus size={16} aria-hidden="true" />
      <span className="sr-only">no change</span>
    </span>
  );
}

/** One row of the weekly car Power Ranking. */
export function PowerRankRow({
  rank,
  teamName,
  color,
  movement,
  trend,
}: {
  rank: number;
  teamName: string;
  color: string;
  movement: number;
  /** Gap to the fastest car in %, oldest round first. */
  trend: number[];
}) {
  const latest = trend[trend.length - 1];
  return (
    <div style={teamStyle(color)} className="flex min-h-11 items-center gap-3 px-3 py-2">
      <span className="headline w-6 text-xl">{rank}</span>
      <TeamColorBar color={color} className="h-6 self-center" />
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{teamName}</span>
      <Sparkline values={trend} />
      <span className="w-12 text-right font-mono text-xs tabular-nums text-fg-dim">
        {latest === 0 ? "P1" : `+${latest.toFixed(1)}%`}
      </span>
      <Movement movement={movement} />
    </div>
  );
}
