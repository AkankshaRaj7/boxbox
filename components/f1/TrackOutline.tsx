import type { Outline } from "@/lib/circuits";

/**
 * Circuit outline, with a chequered start/finish marker when the outline knows
 * where the line is. Real layouts come from `circuitInfo` in lib/circuits.ts.
 * Strokes keep their on-screen width whatever the outline's scale.
 */
export function TrackOutline({ name, outline, className = "" }: { name: string; outline: Outline; className?: string }) {
  const { d, viewBox, start } = outline;
  const cell = Number(viewBox.split(" ")[2]) / 60;

  return (
    <svg viewBox={viewBox} className={`w-full ${className}`} role="img" aria-label={`${name} layout`}>
      <path
        d={d}
        fill="none"
        className="stroke-line"
        strokeWidth="12"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      <path
        d={d}
        fill="none"
        className="stroke-fg"
        strokeWidth="4"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
      {start && (
        <g transform={`translate(${start.x - cell} ${start.y - cell})`}>
          {[0, 1].map((row) =>
            [0, 1].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={col * cell}
                y={row * cell}
                width={cell}
                height={cell}
                className={(row + col) % 2 === 0 ? "fill-fg" : "fill-asphalt"}
              />
            )),
          )}
        </g>
      )}
    </svg>
  );
}
