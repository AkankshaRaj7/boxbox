import Link from "next/link";
import { Panel } from "@/components/f1/Panel";
import { teamStyle } from "@/lib/color";

export type HeadToHeadSide = { code: string; name: string; href?: string };

type Tally = [number, number];

function Row({ label, tally, a, b }: { label: string; tally: Tally; a: HeadToHeadSide; b: HeadToHeadSide }) {
  const total = tally[0] + tally[1];
  const share = total > 0 ? (tally[0] / total) * 100 : 50;
  const strong = (i: 0 | 1) => (tally[i] > tally[1 - i] ? "text-fg" : "text-fg-dim");
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-3 font-mono tabular-nums">
        <span className={`text-xl font-bold ${strong(0)}`}>
          <span className="sr-only">{a.code} </span>
          {tally[0]}
        </span>
        <span className="text-xs font-bold uppercase text-fg-dim">{label}</span>
        <span className={`text-xl font-bold ${strong(1)}`}>
          <span className="sr-only">{b.code} </span>
          {tally[1]}
        </span>
      </div>
      <div aria-hidden="true" className="flex h-2 gap-0.5">
        <span className="slant block bg-(--team)" style={{ width: `${share}%` }} />
        <span className="slant block flex-1 bg-fg-dim" />
      </div>
    </div>
  );
}

function Name({ side, align }: { side: HeadToHeadSide; align: "left" | "right" }) {
  const body = (
    <>
      <span className="block font-mono text-lg font-bold">{side.code}</span>
      <span className="block truncate text-xs text-fg-dim">{side.name}</span>
    </>
  );
  const className = `min-w-0 ${align === "right" ? "text-right" : ""}`;
  return side.href ? (
    <Link href={side.href} className={`${className} hover:underline`}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/**
 * Teammate head-to-head: qualifying, race and points as split bars. The left
 * driver's share is in the team colour, the right driver's in grey, and every
 * figure is printed, so colour is never the only signal.
 */
export function HeadToHeadCard({
  a,
  b,
  color,
  context,
  qualifying,
  race,
  points,
}: {
  a: HeadToHeadSide;
  b: HeadToHeadSide;
  color: string;
  /** e.g. "Red Bull Racing · R1–R11 · 11 rounds". */
  context: string;
  qualifying: Tally;
  race: Tally;
  points: Tally;
}) {
  return (
    <Panel as="article" style={teamStyle(color)} className="p-4" aria-label={`${a.name} versus ${b.name}`}>
      <div className="mb-1 flex items-start justify-between gap-3">
        <Name side={a} align="left" />
        <span className="headline pt-1 text-sm text-fg-dim">vs</span>
        <Name side={b} align="right" />
      </div>
      <p className="mb-3 border-b border-line pb-2 text-center text-xs text-fg-dim">{context}</p>
      <div className="space-y-3">
        <Row label="Qualifying" tally={qualifying} a={a} b={b} />
        <Row label="Race" tally={race} a={a} b={b} />
        <Row label="Points" tally={points} a={a} b={b} />
      </div>
    </Panel>
  );
}
