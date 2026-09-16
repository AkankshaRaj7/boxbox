import { describe, expect, it } from "vitest";
import { briefing, pointsRemaining, type BriefingFacts } from "./briefing";
import type { RankedTeam } from "./pace";
import type { Story } from "./news-model";
import type { RaceWeekend, SessionKind } from "./schedule";
import type { Standings } from "./standings";

const weekend = (round: number, kinds: SessionKind[] = ["qualifying", "race"]): RaceWeekend => ({
  season: "2026",
  round,
  event: `Round ${round}`,
  circuitId: `circuit-${round}`,
  circuitName: `Circuit ${round}`,
  locality: "Town",
  country: "Country",
  sessions: kinds.map((kind) => ({
    kind,
    name: kind,
    round,
    event: `Round ${round}`,
    startsAt: `2026-0${(round % 9) + 1}-01T12:00:00Z`,
  })),
});

const CALENDAR = [
  ...Array.from({ length: 14 }, (_, i) => weekend(i + 1)),
  ...Array.from({ length: 8 }, (_, i) => weekend(i + 15)),
  weekend(23, ["sprint-qualifying", "sprint", "qualifying", "race"]),
];

const row = (id: string, name: string, points: number) => ({ id, code: id.slice(0, 3).toUpperCase(), name, color: "#fff", points });

const standings = (drivers: [string, string, number][], teams: [string, string, number][]): Standings => ({
  season: "2026",
  round: 14,
  drivers: drivers.map(([id, name, points]) => row(id, name, points)),
  constructors: teams.map(([id, name, points]) => row(id, name, points)),
});

const ranked = (constructorId: string, rank: number, gap: number, movement = 0): RankedTeam => ({
  constructorId,
  rank,
  gap,
  movement,
  trend: [gap],
});

const FACTS: BriefingFacts = {
  standings: standings(
    [["antonelli", "Andrea Kimi Antonelli", 292], ["russell", "George Russell", 211], ["hamilton", "Lewis Hamilton", 191]],
    [["mercedes", "Mercedes", 503], ["ferrari", "Ferrari", 358], ["mclaren", "McLaren", 306]],
  ),
  calendar: CALENDAR,
  pecking: [ranked("mercedes", 1, 0.14), ranked("ferrari", 2, 0.37), ranked("audi", 5, 1.81, 1), ranked("rb", 6, 1.85, -1)],
  stories: [],
};

describe("pointsRemaining", () => {
  it("counts a win a round, plus the sprints still to come", () => {
    expect(pointsRemaining(CALENDAR, 14)).toEqual({ rounds: 9, sprints: 1, points: 9 * 25 + 8 });
  });

  it("has nothing left after the last round", () => {
    expect(pointsRemaining(CALENDAR, 23)).toEqual({ rounds: 0, sprints: 0, points: 0 });
  });
});

describe("briefing", () => {
  it("opens with the title race, measured against what is still available", () => {
    expect(briefing(FACTS)[0]).toBe(
      "Antonelli leads Russell by 81 points, with 233 still on the table over nine rounds.",
    );
  });

  it("calls the title only when the lead is beyond reach", () => {
    const decided = { ...FACTS, standings: standings(
      [["antonelli", "Andrea Kimi Antonelli", 500], ["russell", "George Russell", 211]],
      [["mercedes", "Mercedes", 503], ["ferrari", "Ferrari", 358]],
    ) };
    expect(briefing(decided)[0]).toContain("has the drivers' title");
  });

  it("does not call it when the lead exactly equals what is left", () => {
    // 233 available and a 233-point lead still leaves a tie on countback.
    const knife = { ...FACTS, standings: standings(
      [["antonelli", "Andrea Kimi Antonelli", 444], ["russell", "George Russell", 211]],
      [["mercedes", "Mercedes", 503], ["ferrari", "Ferrari", 358]],
    ) };
    expect(briefing(knife).join(" ")).not.toContain("has the drivers' title");
  });

  it("says when the quickest car is not the one leading the constructors'", () => {
    const mismatch = { ...FACTS, pecking: [ranked("ferrari", 1, 0.1), ranked("mercedes", 2, 0.3)] };
    expect(briefing(mismatch)[1]).toBe(
      "Ferrari have the quickest car of recent races but trail Mercedes by 145 points in the constructors'.",
    );
  });

  it("stays quiet about that when the quickest car is also top of the table", () => {
    expect(briefing(FACTS).join(" ")).not.toContain("but trail");
  });

  it("reports the constructors' lead and the pace gap", () => {
    const lines = briefing(FACTS);
    expect(lines[1]).toBe("Mercedes lead the constructors' by 145 from Ferrari.");
    expect(lines[2]).toBe("Mercedes have the quickest car of the last five races, 0.23% clear of Ferrari.");
  });

  it("names the biggest climber", () => {
    expect(briefing(FACTS)[3]).toBe("Audi are the biggest climbers in the pecking order, up a place to fifth.");
  });

  it("shows no more lines than asked for", () => {
    expect(briefing(FACTS, 2)).toHaveLength(2);
  });

  it("shortens rather than padding when there is little to say", () => {
    const quiet: BriefingFacts = { standings: null, calendar: [], pecking: [], stories: [] };
    expect(briefing(quiet)).toEqual([]);
  });

  it("says nothing about the championship before the first race", () => {
    const preseason: BriefingFacts = {
      ...FACTS,
      standings: { season: "2026", round: null, drivers: [], constructors: [] },
      pecking: [],
    };
    expect(briefing(preseason)).toEqual([]);
  });

  it("counts stories breaking across the wire", () => {
    const breaking = [1, 2].map((n) => ({ id: `s${n}`, breaking: true }) as Story);
    expect(briefing({ ...FACTS, stories: breaking }, 9).at(-1)).toBe(
      "Two stories are breaking across the wire right now.",
    );
  });
});
