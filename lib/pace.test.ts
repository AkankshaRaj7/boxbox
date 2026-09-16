import { describe, expect, it } from "vitest";
import { TEAMS_2026 } from "./teams";
import {
  PACE,
  cleanLapsByDriver,
  gapsToFastest,
  median,
  peckingOrder,
  rankTeams,
  representativePace,
  teamPace,
  type Lap,
  type RacePace,
} from "./pace";

const lap = (driverNumber: number, lapNumber: number, seconds: number | null, pitOut = false): Lap => ({
  driverNumber,
  lapNumber,
  seconds,
  pitOut,
});

/** `count` laps of `seconds`, numbered from 1, for one driver. */
const stint = (driverNumber: number, seconds: number, count: number): Lap[] =>
  Array.from({ length: count }, (_, i) => lap(driverNumber, i + 1, seconds));

describe("median", () => {
  it("takes the middle value", () => {
    expect(median([3, 1, 2])).toBe(2);
  });

  it("averages the middle pair of an even list", () => {
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("refuses an empty list", () => {
    expect(() => median([])).toThrow();
  });
});

describe("representativePace", () => {
  it("ignores laps well off the driver's own median", () => {
    // A safety-car lap and a traffic lap shouldn't slow the reading.
    expect(representativePace([90, 90, 90.5, 91, 90, 140, 120])).toBeCloseTo(90, 5);
  });

  it("keeps laps just inside the outlier cut", () => {
    expect(representativePace([100, 100, 100, 106, 107])).toBeCloseTo(100, 5);
  });

  it("needs enough laps to mean anything", () => {
    expect(representativePace([90, 90, 90, 90])).toBeNull();
  });

  it("gives up when too few laps survive the cut", () => {
    // A handful of normal laps, then a crawl to the garage.
    expect(representativePace([100, 100, 100, 100, 300, 300])).toBeNull();
  });

  it("reads a driver who was slow all afternoon rather than calling it noise", () => {
    // The cut only removes laps slower than the median, so one flying lap
    // among slow ones does not become the reading.
    expect(representativePace([90, 200, 210, 220, 230, 240])).toBeCloseTo(210, 5);
  });
});

describe("cleanLapsByDriver", () => {
  it("drops untimed, pit-out and in-laps", () => {
    const laps = [
      lap(1, 1, 95),
      lap(1, 2, null),
      lap(1, 3, 120), // in-lap
      lap(1, 4, 110, true), // out-lap
      lap(1, 5, 94),
      lap(2, 1, 96),
    ];
    const byDriver = cleanLapsByDriver(laps, new Set(["1:3"]));
    expect(byDriver.get(1)).toEqual([95, 94]);
    expect(byDriver.get(2)).toEqual([96]);
  });
});

describe("teamPace", () => {
  const seats: Record<number, string> = { 1: "mclaren", 2: "mclaren", 3: "ferrari", 4: "ferrari" };
  const seatOf = (n: number) => seats[n];

  it("judges a team on its quicker car", () => {
    const laps = [...stint(1, 95, 10), ...stint(2, 93, 10), ...stint(3, 96, 10)];
    expect(teamPace(laps, new Set(), seatOf)).toEqual({ mclaren: 93, ferrari: 96 });
  });

  it("ignores a driver who retired early", () => {
    // Driver 2 sets a flattering time over three laps before stopping.
    const laps = [...stint(1, 95, 40), ...stint(2, 80, 3)];
    expect(teamPace(laps, new Set(), seatOf)).toEqual({ mclaren: 95 });
  });

  it("leaves out drivers with no known seat", () => {
    const laps = [...stint(1, 95, 10), ...stint(9, 91, 10)];
    expect(teamPace(laps, new Set(), seatOf)).toEqual({ mclaren: 95 });
  });

  it("returns nothing when a session has no usable laps", () => {
    expect(teamPace([], new Set(), seatOf)).toEqual({});
  });
});

describe("gapsToFastest", () => {
  it("measures every team against the quickest", () => {
    const gaps = gapsToFastest({ mclaren: 100, ferrari: 101, haas: 107 });
    expect(gaps.mclaren).toBe(0);
    expect(gaps.ferrari).toBeCloseTo(1, 5);
    expect(gaps.haas).toBeCloseTo(7, 5);
  });

  it("copes with a race nobody has data for", () => {
    expect(gapsToFastest({})).toEqual({});
  });
});

const race = (round: number, teams: Record<string, number>): RacePace => ({
  round,
  event: `Round ${round}`,
  circuitId: `circuit-${round}`,
  date: `2026-0${round}-01`,
  teams,
});

describe("rankTeams", () => {
  const races = [
    race(1, { mclaren: 100, ferrari: 101, haas: 105 }),
    race(2, { mclaren: 100, ferrari: 100.5, haas: 104 }),
    race(3, { ferrari: 100, mclaren: 100.2, haas: 103 }),
  ];

  it("ranks by mean gap across the window, quickest first", () => {
    const ranked = rankTeams(races, 3);
    expect(ranked.map((team) => team.constructorId)).toEqual(["mclaren", "ferrari", "haas"]);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].gap).toBeCloseTo(0.0667, 3);
  });

  it("carries one gap per race for the sparkline", () => {
    expect(rankTeams(races, 3)[2].trend).toHaveLength(3);
  });

  it("honours the window when there are more races than it covers", () => {
    expect(rankTeams(races, 2)[0].trend).toHaveLength(2);
  });

  it("reports movement against the same window one race earlier", () => {
    // Over rounds 1-2 Ferrari is quicker than Haas; a huge round 3 flips them.
    const flipped = [...races.slice(0, 2), race(3, { haas: 100, ferrari: 130, mclaren: 100.2 })];
    const ranked = rankTeams(flipped, 3);
    const haas = ranked.find((team) => team.constructorId === "haas");
    const ferrari = ranked.find((team) => team.constructorId === "ferrari");
    expect(haas?.movement).toBe(1);
    expect(ferrari?.movement).toBe(-1);
  });

  it("counts a team only for the races it appears in", () => {
    const patchy = [race(1, { mclaren: 100, ferrari: 102 }), race(2, { mclaren: 100 })];
    const ferrari = rankTeams(patchy, 5).find((team) => team.constructorId === "ferrari");
    expect(ferrari?.trend).toHaveLength(1);
    expect(ferrari?.trend[0]).toBeCloseTo(2, 5);
    expect(ferrari?.gap).toBeCloseTo(2, 5);
  });

  it("has nothing to rank before the season starts", () => {
    expect(rankTeams([])).toEqual([]);
  });

  it("gives a first race no movement", () => {
    expect(rankTeams([race(1, { mclaren: 100, ferrari: 101 })]).every((team) => team.movement === 0)).toBe(true);
  });
});

describe("the committed data/pace.json", () => {
  it("holds the current season's races in round order", () => {
    expect(PACE.races.length).toBeGreaterThan(0);
    const rounds = PACE.races.map((race) => race.round);
    expect(rounds).toEqual([...rounds].sort((a, b) => a - b));
    expect(new Set(rounds).size).toBe(rounds.length);
  });

  it("names only constructors the site can colour", () => {
    // An unknown constructorId would render grey with a derived code, so a new
    // team on the grid means TEAMS_2026 needs updating.
    const unknown = [...new Set(PACE.races.flatMap((race) => Object.keys(race.teams)))].filter(
      (id) => !(id in TEAMS_2026),
    );
    expect(unknown).toEqual([]);
  });

  it("carries believable lap times", () => {
    // Every F1 lap sits between Monza-fast and Singapore-slow, by some margin.
    const paces = PACE.races.flatMap((race) => Object.values(race.teams));
    expect(Math.min(...paces)).toBeGreaterThan(60);
    expect(Math.max(...paces)).toBeLessThan(200);
  });

  it("ranks every team that raced, quickest first", () => {
    const ranked = peckingOrder();
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked.map((team) => team.rank)).toEqual(ranked.map((_, i) => i + 1));
    expect(ranked[0].gap).toBeLessThanOrEqual(ranked.at(-1)!.gap);
    expect(ranked[0].gap).toBeGreaterThanOrEqual(0);
  });

  it("has a fastest lap with three sectors that add up", () => {
    const lap = PACE.fastestLap;
    if (lap === null) {
      return;
    }
    expect(lap.sectors).toHaveLength(3);
    const summed = lap.sectors.reduce((total, sector) => total + sector.seconds, 0);
    expect(summed).toBeCloseTo(lap.seconds, 1);
    expect(lap.constructorId in TEAMS_2026).toBe(true);
  });
});
