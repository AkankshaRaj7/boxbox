"use client";

import { useClock } from "@/lib/use-clock";
import { formatCountdown } from "@/lib/time";

/**
 * Countdown to the next session, stacked like a pit board. Times are shown in
 * the viewer's own timezone; before the clock starts the digits read "--:--:--"
 * so server and client HTML match.
 */
export function PitBoardCountdown({
  session,
  event,
  round,
  startsAt,
  className = "",
}: {
  session: string;
  event: string;
  round: number;
  /** ISO 8601 start time. */
  startsAt: string;
  className?: string;
}) {
  const now = useClock();
  const target = Date.parse(startsAt);
  const started = now > 0 && target <= now;
  const localStart =
    now > 0
      ? new Intl.DateTimeFormat(undefined, { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(target)
      : null;

  return (
    <div className={`pit-board flex flex-col border border-line bg-carbon ${className}`}>
      <div className="flex items-center justify-between bg-box-red px-4 py-1.5 text-xs font-bold uppercase text-asphalt">
        <span>Round {round}</span>
        <span>{event}</span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-1 px-4 py-4">
        <span className="text-xs font-bold uppercase text-fg-dim">Next session</span>
        <span className="headline text-display-sm">{session}</span>
        <span role="timer" aria-live="off" className="font-mono text-display leading-none tabular-nums">
          {started ? (
            <span className="live-pulse text-box-red">LIGHTS OUT</span>
          ) : now > 0 ? (
            formatCountdown(target - now)
          ) : (
            "--:--:--"
          )}
        </span>
        <span className="text-sm text-fg-dim">{localStart ? `${localStart} your time` : " "}</span>
      </div>
    </div>
  );
}
