/**
 * Race-weekend schedule logic: which session is next and when one is over.
 * Pure functions over the calendar parsed from Jolpica-F1 (see lib/jolpica.ts).
 */
export type SessionKind = "fp1" | "fp2" | "fp3" | "sprint-qualifying" | "sprint" | "qualifying" | "race";

export const SESSION_NAMES: Record<SessionKind, string> = {
  fp1: "Practice 1",
  fp2: "Practice 2",
  fp3: "Practice 3",
  "sprint-qualifying": "Sprint Qualifying",
  sprint: "Sprint",
  qualifying: "Qualifying",
  race: "Race",
};

/** Typical session lengths; once one is over the countdown moves on. */
export const SESSION_MINUTES: Record<SessionKind, number> = {
  fp1: 60,
  fp2: 60,
  fp3: 60,
  "sprint-qualifying": 45,
  sprint: 60,
  qualifying: 60,
  race: 120,
};

export type Session = {
  kind: SessionKind;
  name: string;
  round: number;
  event: string;
  /** ISO 8601 start time in UTC. */
  startsAt: string;
};

export type RaceWeekend = {
  season: string;
  round: number;
  event: string;
  circuitId: string;
  circuitName: string;
  locality: string;
  country: string;
  /** Sessions with a published start time, earliest first. */
  sessions: Session[];
};

/** Epoch milliseconds when `session` is expected to finish. */
export function sessionEndsAt(session: Session): number {
  return Date.parse(session.startsAt) + SESSION_MINUTES[session.kind] * 60_000;
}

/** Sessions that have not finished by `now`, earliest first. */
export function upcomingSessions(weekends: RaceWeekend[], now: number): Session[] {
  return weekends
    .flatMap((w) => w.sessions)
    .filter((s) => sessionEndsAt(s) > now)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
}

/** The first session in an earliest-first list still running or yet to start. */
export function nextSession(sessions: Session[], now: number): Session | undefined {
  return sessions.find((s) => sessionEndsAt(s) > now);
}

/** The first weekend whose race has not finished, or undefined once the season is over. */
export function currentWeekend(weekends: RaceWeekend[], now: number): RaceWeekend | undefined {
  return weekends.find((w) => w.sessions.some((s) => s.kind === "race" && sessionEndsAt(s) > now));
}
