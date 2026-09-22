import { describe, expect, it } from "vitest";
import {
  contenders,
  earliestClinch,
  pointsRemaining,
  recentSwing,
  scoringHistory,
  winScenario,
  type ScoringHistory,
} from "./championship";
import type { RaceWeekend, SessionKind } from "./schedule";
import type { StandingRow } from "./standings";

const weekend = (round: number, kinds: SessionKind[] = ["qualifying", "race"]): RaceWeekend => ({
  season: "2026",
  round,
  event: `Round ${round}`,
  circuitId: `circuit-${round}`,
  circuitName: `Circuit ${round}`,
  locality: "Town",
  country: "Country",
  sessions: kinds.map((kind) => ({ kind, name: kind, round, event: `Round ${round}`, startsAt: "2026-01-01T12:00:00Z" })),
});

/** 23 rounds, with a sprint at the last — the shape of the real 2026 season. */
const CALENDAR = [
  ...Array.from({ length: 22 }, (_, i) => weekend(i + 1)),
  weekend(23, ["sprint-qualifying", "sprint", "qualifying", "race"]),
];

const row = (id: string, points: number): StandingRow => ({
  id,
  code: id.slice(0, 3).toUpperCase(),
  name: id,
  color: "#fff",
  points,
});

describe("pointsRemaining", () => {
  it("counts a win a round, plus the sprints still to come", () => {
    expect(pointsRemaining(CALENDAR, 14)).toEqual({ rounds: 9, sprints: 1, points: 9 * 25 + 8 });
  });

  it("gives a team both cars", () => {
    // A constructor can take 25 and 18 in a race, 8 and 7 in a sprint.
    expect(pointsRemaining(CALENDAR, 14, "team")).toEqual({ rounds: 9, sprints: 1, points: 9 * 43 + 15 });
  });

  it("has nothing left after the last round", () => {
    expect(pointsRemaining(CALENDAR, 23)).toEqual({ rounds: 0, sprints: 0, points: 0 });
  });
});

describe("winScenario", () => {
  it("says how far back the rival must finish", () => {
    // Winning while they finish 3rd is a swing of 10.
    expect(winScenario(10)).toEqual({ rivalNoBetterThan: 3 });
    expect(winScenario(7)).toEqual({ rivalNoBetterThan: 2 });
  });

  it("puts them out of the points when the swing demands it", () => {
    expect(winScenario(24.5)).toEqual({ rivalNoBetterThan: 11 });
  });

  it("gives up when even a win against a non-scorer is not enough", () => {
    expect(winScenario(26)).toBeNull();
  });
});

describe("recentSwing", () => {
  const history: ScoringHistory = new Map([
    ["chaser", [10, 11, 12, 13, 14].map((round) => ({ round, points: 25 }))],
    ["leader", [10, 11, 12, 13, 14].map((round) => ({ round, points: 15 }))],
  ]);

  it("measures points per round against the leader", () => {
    expect(recentSwing(history, "chaser", "leader")).toBe(10);
  });

  it("goes negative when they are losing ground", () => {
    expect(recentSwing(history, "leader", "chaser")).toBe(-10);
  });

  it("treats a round someone missed as no points", () => {
    const patchy: ScoringHistory = new Map([
      ["chaser", [{ round: 14, points: 25 }]],
      ["leader", [{ round: 14, points: 0 }]],
    ]);
    expect(recentSwing(patchy, "chaser", "leader")).toBe(25);
  });

  it("declines when it has no history for someone", () => {
    expect(recentSwing(history, "nobody", "leader")).toBeNull();
  });
});

describe("contenders", () => {
  const history: ScoringHistory = new Map();
  const table = [row("antonelli", 292), row("russell", 211), row("hamilton", 191), row("stroll", 20)];

  it("keeps a driver alive while the points can still cover the gap", () => {
    const [, second] = contenders(table, CALENDAR, 14, history);
    expect(second.behind).toBe(81);
    expect(second.alive).toBe(true);
    expect(second.requiredSwing).toBeCloseTo(9, 5);
  });

  it("rules out a driver the remaining points cannot reach", () => {
    // 272 behind with 233 available.
    const last = contenders(table, CALENDAR, 14, history).at(-1)!;
    expect(last.alive).toBe(false);
    expect(last.requiredSwing).toBeNull();
  });

  it("asks nothing of the leader", () => {
    const [first] = contenders(table, CALENDAR, 14, history);
    expect(first).toMatchObject({ behind: 0, alive: true, requiredSwing: null });
  });

  it("gives a chaser a scenario they could check against a result sheet", () => {
    const [, second] = contenders(table, CALENDAR, 14, history);
    expect(second.scenario).toEqual({ rivalNoBetterThan: 3 });
  });

  it("has nothing to say before the season starts", () => {
    expect(contenders([], CALENDAR, 0, history)).toEqual([]);
  });
});

describe("earliestClinch", () => {
  it("finds the first round the leader could seal it", () => {
    // 81 clear after round 14. Winning out puts them 181 up after round 18,
    // against the 133 still available — but only 156 up after 17, with 158
    // left. So the earliest is 18, not 17.
    expect(earliestClinch([row("antonelli", 292), row("russell", 211)], CALENDAR, 14)).toBe(18);
  });

  it("allows the last round, where one point can still be enough", () => {
    // Winning the finale while the rival scores nothing settles any gap.
    expect(earliestClinch([row("a", 100), row("b", 99)], CALENDAR, 22)).toBe(23);
  });

  it("returns nothing once the season is over", () => {
    expect(earliestClinch([row("a", 100), row("b", 99)], CALENDAR, 23)).toBeNull();
  });

  it("returns nothing without a rival to beat", () => {
    expect(earliestClinch([row("a", 100)], CALENDAR, 14)).toBeNull();
  });
});

describe("scoringHistory", () => {
  it("totals a team's cars into one entry per round", () => {
    const history = scoringHistory([
      { round: 13, entries: [{ key: "mercedes", points: 25 }, { key: "mercedes", points: 12 }] },
      { round: 14, entries: [{ key: "mercedes", points: 18 }] },
    ]);
    expect(history.get("mercedes")).toEqual([
      { round: 13, points: 37 },
      { round: 14, points: 18 },
    ]);
  });

  it("puts rounds in order whatever order they arrive in", () => {
    const history = scoringHistory([
      { round: 14, entries: [{ key: "ANT", points: 25 }] },
      { round: 12, entries: [{ key: "ANT", points: 18 }] },
    ]);
    expect(history.get("ANT")?.map((entry) => entry.round)).toEqual([12, 14]);
  });
});

describe("contenders, for a constructors' championship", () => {
  const history: ScoringHistory = new Map();
  const teams = [row("mercedes", 503), row("ferrari", 358), row("mclaren", 306), row("rb", 77)];

  it("offers no one-car scenario, which would be wrong for two cars", () => {
    // "Win every round with them no better than 9th" is a driver's arithmetic.
    // A constructors' round is 43 points against 43, not 25 against 25.
    expect(contenders(teams, CALENDAR, 14, history, "team").every((entrant) => entrant.scenario === null)).toBe(true);
  });

  it("keeps a team alive on the larger pool a team can score", () => {
    // 273 behind would be out for a driver, with 233 available; a team has 402.
    const redBull = contenders(teams, CALENDAR, 14, history, "team")[3];
    expect(redBull.alive).toBe(false);
    const mclaren = contenders(teams, CALENDAR, 14, history, "team")[2];
    expect(mclaren.alive).toBe(true);
  });
});
