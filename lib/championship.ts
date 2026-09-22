/**
 * Championship arithmetic: who can still win, and what it would take.
 *
 * Everything here is exact. There is no win probability anywhere in this file,
 * and that is deliberate — a percentage would come from a model we cannot
 * validate against nine remaining races, and dressing a guess in a number is
 * the one thing that would make this page untrustworthy. What it offers
 * instead is arithmetic a reader can check: the points still available, the
 * swing a chaser needs per round, what they have actually managed lately, and
 * one concrete finishing scenario.
 */
import seasonData from "@/data/season.json";
import type { RaceWeekend } from "@/lib/schedule";
import type { StandingRow } from "@/lib/standings";

/** Points for the top ten in a Grand Prix, 2026. */
export const RACE_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
/** Points for the top eight in a sprint, 2026. */
export const SPRINT_POINTS = [8, 7, 6, 5, 4, 3, 2, 1];

/** The most one driver can score in a round; a team scores with both cars. */
export const MOST_PER_RACE = { driver: RACE_POINTS[0], team: RACE_POINTS[0] + RACE_POINTS[1] };
export const MOST_PER_SPRINT = { driver: SPRINT_POINTS[0], team: SPRINT_POINTS[0] + SPRINT_POINTS[1] };

export type Championship = "driver" | "team";

/** Rounds still to come, and the most one entrant could still score. */
export function pointsRemaining(calendar: RaceWeekend[], afterRound: number, of: Championship = "driver") {
  const left = calendar.filter((weekend) => weekend.round > afterRound);
  const sprints = left.filter((weekend) => weekend.sessions.some((session) => session.kind === "sprint")).length;
  return {
    rounds: left.length,
    sprints,
    points: left.length * MOST_PER_RACE[of] + sprints * MOST_PER_SPRINT[of],
  };
}

/**
 * The best a rival driver can finish while the chaser wins, and still lose
 * `swing` points that round.
 *
 * Phrased as "win every race, with them no better than Nth", because that is
 * how the question actually gets asked. Null when even a win against a rival
 * who scores nothing is not enough.
 *
 * Drivers only. A constructors' round is two cars against two cars, so this
 * one-car framing would give a confidently wrong answer there — `contenders`
 * leaves the scenario null for teams rather than reshaping the sentence.
 */
export function winScenario(swing: number): { rivalNoBetterThan: number } | null {
  if (swing > RACE_POINTS[0]) {
    return null;
  }
  for (let position = 2; position <= RACE_POINTS.length; position++) {
    if (RACE_POINTS[0] - RACE_POINTS[position - 1] >= swing) {
      return { rivalNoBetterThan: position };
    }
  }
  // Beating them by this much needs them out of the points altogether.
  return { rivalNoBetterThan: RACE_POINTS.length + 1 };
}

export type Contender = {
  row: StandingRow;
  /** Points behind the leader; 0 for the leader. */
  behind: number;
  /** Whether enough points remain to catch the leader. */
  alive: boolean;
  /** Points per remaining round they must outscore the leader by. */
  requiredSwing: number | null;
  /** How they have actually scored against the leader lately, per round. */
  recentSwing: number | null;
  scenario: { rivalNoBetterThan: number } | null;
};

/** Points scored per round by one entrant, newest round last. */
export type ScoringHistory = Map<string, { round: number; points: number }[]>;

/** How many recent rounds the form comparison looks at. */
export const FORM_ROUNDS = 5;

/**
 * Points per round a chaser has outscored the leader by across the last
 * `FORM_ROUNDS` rounds. Negative when they are losing ground.
 *
 * Season averages would only restate the gap; recent form is the part that
 * says whether a required swing is remotely in reach.
 */
export function recentSwing(history: ScoringHistory, id: string, leaderId: string, window = FORM_ROUNDS) {
  const mine = history.get(id);
  const theirs = history.get(leaderId);
  if (!mine || !theirs) {
    return null;
  }
  const rounds = [...new Set([...mine, ...theirs].map((entry) => entry.round))].sort((a, b) => a - b).slice(-window);
  if (rounds.length === 0) {
    return null;
  }
  const scored = (entries: { round: number; points: number }[], round: number) =>
    entries.find((entry) => entry.round === round)?.points ?? 0;
  const total = rounds.reduce((sum, round) => sum + scored(mine, round) - scored(theirs, round), 0);
  return total / rounds.length;
}

/**
 * Every entrant, with what catching the leader would take.
 *
 * "Alive" means the points still available cover the gap. A tie on points is
 * settled by countback, not by this, so the arithmetic uses the raw gap and the
 * page says so.
 */
export function contenders(
  table: StandingRow[],
  calendar: RaceWeekend[],
  afterRound: number,
  history: ScoringHistory,
  of: Championship = "driver",
  /**
   * How a standings row maps onto `history`. Driver standings key on the
   * Jolpica driverId, but race records carry the three-letter code, so the
   * caller says which to use rather than the two silently failing to match.
   */
  keyOf: (row: StandingRow) => string = (row) => row.id,
): Contender[] {
  const leader = table[0];
  if (!leader) {
    return [];
  }
  const { points, rounds } = pointsRemaining(calendar, afterRound, of);
  return table.map((row) => {
    const behind = leader.points - row.points;
    const alive = behind <= points;
    const requiredSwing = alive && rounds > 0 && behind > 0 ? behind / rounds : null;
    return {
      row,
      behind,
      alive,
      requiredSwing,
      recentSwing: recentSwing(history, keyOf(row), keyOf(leader)),
      // See winScenario: the one-car framing does not hold for a team.
      scenario: requiredSwing === null || of === "team" ? null : winScenario(requiredSwing),
    };
  });
}

/**
 * The earliest round the leader could seal it: they win everything from here,
 * the nearest rival scores nothing. Null when it cannot happen this season, or
 * when it is already done.
 *
 * Explicitly a best case, and the page labels it as one.
 */
export function earliestClinch(
  table: StandingRow[],
  calendar: RaceWeekend[],
  afterRound: number,
  of: Championship = "driver",
): number | null {
  const [leader, rival] = table;
  if (!leader || !rival) {
    return null;
  }
  const upcoming = calendar.filter((weekend) => weekend.round > afterRound);
  let lead = leader.points - rival.points;
  for (const weekend of upcoming) {
    const sprint = weekend.sessions.some((session) => session.kind === "sprint");
    lead += MOST_PER_RACE[of] + (sprint ? MOST_PER_SPRINT[of] : 0);
    const after = pointsRemaining(calendar, weekend.round, of).points;
    if (lead > after) {
      return weekend.round;
    }
  }
  return null;
}

/** One race's points, as the scoring history needs them. */
export type ScoredRound = { round: number; entries: { key: string; points: number }[] };

/** Points per round per entrant, from the committed race records. */
export function scoringHistory(rounds: ScoredRound[]): ScoringHistory {
  const history: ScoringHistory = new Map();
  for (const { round, entries } of rounds) {
    const byKey = new Map<string, number>();
    for (const entry of entries) {
      byKey.set(entry.key, (byKey.get(entry.key) ?? 0) + entry.points);
    }
    for (const [key, points] of byKey) {
      history.set(key, [...(history.get(key) ?? []), { round, points }]);
    }
  }
  for (const entries of history.values()) {
    entries.sort((a, b) => a.round - b.round);
  }
  return history;
}

/** One race, as the season index needs it. */
export type SeasonRace = {
  round: number;
  event: string;
  circuitId: string;
  date: string;
  winner: { code: string; constructorId: string } | null;
};

/**
 * The committed season aggregate. Imported rather than read from disk because
 * the pages that use it revalidate and must not touch the filesystem at
 * request time.
 */
export const SCORING = seasonData as {
  season: string;
  races: SeasonRace[];
  drivers: ScoredRound[];
  teams: ScoredRound[];
};

/** Points per round by driver code. */
export const driverScoring = () => scoringHistory(SCORING.drivers);
/** Points per round by constructor id, both cars totalled. */
export const teamScoring = () => scoringHistory(SCORING.teams);
