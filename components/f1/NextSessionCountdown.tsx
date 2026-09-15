"use client";

import { PitBoardCountdown } from "@/components/f1/PitBoardCountdown";
import { nextSession, type Session } from "@/lib/schedule";
import { useClock } from "@/lib/use-clock";

/**
 * Counts down to the next unfinished session on the viewer's clock, so the
 * board rolls over on time even when the page HTML is an hour old.
 * `sessions` must be earliest first; until the clock starts the first one is
 * shown so server and client HTML match.
 */
export function NextSessionCountdown({
  sessions,
  unavailable = false,
  className = "",
}: {
  sessions: Session[];
  /** True when the schedule could not be loaded, as opposed to the season being over. */
  unavailable?: boolean;
  className?: string;
}) {
  const now = useClock();
  const session = now > 0 ? nextSession(sessions, now) : sessions[0];

  if (!session) {
    return (
      <div className={`pit-board flex flex-col justify-center gap-1 border border-line bg-carbon p-4 ${className}`}>
        <span className="text-xs font-bold uppercase text-fg-dim">Next session</span>
        <span className="headline text-display-sm">{unavailable ? "No signal" : "Season complete"}</span>
        <span className="text-sm text-fg-dim">
          {unavailable
            ? "The schedule is off the timing screens right now. Check back shortly."
            : "The countdown returns when next season's calendar is published."}
        </span>
      </div>
    );
  }

  return (
    <PitBoardCountdown
      className={className}
      session={session.name}
      event={session.event}
      round={session.round}
      startsAt={session.startsAt}
    />
  );
}
