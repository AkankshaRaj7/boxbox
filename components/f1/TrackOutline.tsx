/** Outline of the fictional sample circuit. Real circuits replace this in Phase 1. */
const TRACK =
  "M40 160 L250 160 Q300 160 300 115 L300 85 Q300 50 265 50 L205 50 Q180 50 168 72 L152 102 Q140 122 112 116 L72 106 Q40 100 40 132 Z";

/** DRS zones on the sample circuit: the main straight and the back straight. */
const DRS_ZONES = ["M70 160 L240 160", "M300 112 L300 88"];

/**
 * Circuit outline with DRS zones in green and a chequered start/finish line.
 */
export function TrackOutline({ name, className = "" }: { name: string; className?: string }) {
  return (
    <svg
      viewBox="20 30 300 150"
      className={`w-full ${className}`}
      role="img"
      aria-label={`${name} layout with DRS zones marked in green`}
    >
      <path d={TRACK} fill="none" className="stroke-line" strokeWidth="12" strokeLinejoin="round" />
      <path d={TRACK} fill="none" className="stroke-fg" strokeWidth="4" strokeLinejoin="round" />
      {DRS_ZONES.map((d) => (
        <path key={d} d={d} fill="none" className="stroke-flag-green" strokeWidth="4" strokeLinecap="round" />
      ))}
      <g transform="translate(150 152)">
        {[0, 1, 2, 3].map((row) =>
          [0, 1].map((col) => (
            <rect
              key={`${row}-${col}`}
              x={col * 4}
              y={row * 4}
              width="4"
              height="4"
              className={(row + col) % 2 === 0 ? "fill-fg" : "fill-asphalt"}
            />
          )),
        )}
      </g>
    </svg>
  );
}
