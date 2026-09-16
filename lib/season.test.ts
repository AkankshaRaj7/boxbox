import { describe, expect, it } from "vitest";
import {
  ageOn,
  driverStats,
  driverWeekends,
  findDriverByCode,
  finishLabel,
  headToHead,
  recentForm,
  roundSpan,
  teamHeadToHeads,
  teammateHeadToHeads,
  teamRoster,
  teamSpells,
  teamOf,
  teamStats,
  teamWeekends,
  type Classification,
  type SeasonResults,
} from "./season";

function result(round: number, driverId: string, constructorId: string, position: number, positionText: string, points: number, status = "Finished"): Classification {
  return { round, driverId, constructorId, position, positionText, status, grid: position, points };
}

const quali = (round: number, driverId: string, constructorId: string, position: number) => ({ round, driverId, constructorId, position });

/**
 * Fictional four-round season modelled on 2026's mid-season swap: LAW moves
 * from rb to red_bull at R3, replacing HAD, and TSU takes LAW's rb seat.
 */
const season: SeasonResults = {
  season: "2026",
  rounds: [1, 2, 3, 4].map((round) => ({ round, event: `Grand Prix ${round}`, date: `2026-03-0${round}`, circuitId: `c${round}` })),
  drivers: [
    { id: "max_verstappen", code: "VER", givenName: "Max", familyName: "Verstappen", number: "1", nationality: "Dutch", dateOfBirth: "1997-09-30" },
    { id: "lawson", code: "LAW", givenName: "Liam", familyName: "Lawson", number: "30", nationality: "New Zealander", dateOfBirth: "2002-02-11" },
  ],
  teams: [
    { id: "red_bull", name: "Red Bull" },
    { id: "rb", name: "RB F1 Team" },
  ],
  races: [
    result(1, "max_verstappen", "red_bull", 1, "1", 25),
    result(1, "hadjar", "red_bull", 3, "3", 15),
    result(1, "lawson", "rb", 5, "5", 10),
    result(1, "arvid_lindblad", "rb", 20, "R", 0, "Retired"),
    result(2, "max_verstappen", "red_bull", 19, "R", 0, "Retired"),
    result(2, "hadjar", "red_bull", 2, "2", 18),
    result(2, "lawson", "rb", 9, "9", 2),
    result(2, "arvid_lindblad", "rb", 10, "10", 1),
    result(3, "max_verstappen", "red_bull", 2, "2", 18),
    result(3, "lawson", "red_bull", 4, "4", 12),
    result(3, "tsunoda", "rb", 20, "W", 0, "Did not start"),
    result(3, "arvid_lindblad", "rb", 11, "11", 0),
    result(4, "max_verstappen", "red_bull", 1, "1", 25),
    result(4, "lawson", "red_bull", 6, "6", 8),
    result(4, "tsunoda", "rb", 7, "7", 6),
    result(4, "arvid_lindblad", "rb", 8, "8", 4),
  ],
  sprints: [
    result(2, "hadjar", "red_bull", 1, "1", 8),
    result(2, "max_verstappen", "red_bull", 2, "2", 7),
    result(2, "lawson", "rb", 3, "3", 6),
  ],
  qualifying: [
    quali(1, "max_verstappen", "red_bull", 1),
    quali(1, "hadjar", "red_bull", 2),
    quali(1, "lawson", "rb", 5),
    quali(1, "arvid_lindblad", "rb", 6),
    quali(2, "hadjar", "red_bull", 1),
    quali(2, "max_verstappen", "red_bull", 3),
    quali(2, "lawson", "rb", 7),
    quali(2, "arvid_lindblad", "rb", 8),
    quali(3, "lawson", "red_bull", 2),
    quali(3, "max_verstappen", "red_bull", 3),
    quali(3, "arvid_lindblad", "rb", 9),
    quali(4, "max_verstappen", "red_bull", 1),
    quali(4, "lawson", "red_bull", 4),
    quali(4, "tsunoda", "rb", 6),
    quali(4, "arvid_lindblad", "rb", 7),
  ],
};

describe("finishLabel", () => {
  it("shows classified positions as P-numbers and the rest as broadcast codes", () => {
    expect(finishLabel({ positionText: "12", position: 12 })).toBe("P12");
    expect(finishLabel({ positionText: "R", position: 19 })).toBe("DNF");
    expect(finishLabel({ positionText: "W", position: 22 })).toBe("DNS");
    expect(finishLabel({ positionText: "D", position: 20 })).toBe("DSQ");
  });
});

describe("driverStats", () => {
  it("counts wins, podiums, poles, retirements and race plus sprint points", () => {
    expect(driverStats(season, "max_verstappen")).toEqual({
      starts: 4,
      wins: 2,
      podiums: 3,
      poles: 2,
      dnfs: 1,
      bestFinish: 1,
      points: 75,
    });
  });

  it("doesn't count a non-start as a start or a retirement", () => {
    expect(driverStats(season, "tsunoda")).toMatchObject({ starts: 1, dnfs: 0, bestFinish: 7 });
  });
});

describe("recentForm", () => {
  it("returns the latest results, oldest first, with a kind for each", () => {
    expect(recentForm(season, "max_verstappen", 3)).toEqual([
      { round: 2, label: "DNF", kind: "out" },
      { round: 3, label: "P2", kind: "podium" },
      { round: 4, label: "P1", kind: "win" },
    ]);
    expect(recentForm(season, "arvid_lindblad").map((f) => f.kind)).toEqual(["out", "points", "finish", "points"]);
  });
});

describe("teamSpells", () => {
  it("splits a season at a team change", () => {
    expect(teamSpells(season, "lawson")).toEqual([
      { constructorId: "rb", from: 1, to: 2, rounds: [1, 2] },
      { constructorId: "red_bull", from: 3, to: 4, rounds: [3, 4] },
    ]);
  });
});

describe("headToHead", () => {
  it("only counts rounds both drivers raced for the team", () => {
    const [withHadjar, withLawson] = teammateHeadToHeads(season, "max_verstappen");
    expect(withHadjar).toEqual({
      constructorId: "red_bull",
      drivers: ["max_verstappen", "hadjar"],
      rounds: [1, 2],
      qualifying: [1, 1],
      race: [1, 1],
      points: [32, 41],
    });
    expect(withLawson).toMatchObject({ drivers: ["max_verstappen", "lawson"], rounds: [3, 4], qualifying: [1, 1], race: [2, 0], points: [43, 20] });
  });

  it("skips qualifying without a time and races where either didn't start", () => {
    expect(headToHead(season, "arvid_lindblad", "tsunoda", "rb")).toMatchObject({
      rounds: [3, 4],
      qualifying: [0, 1],
      race: [0, 1],
      points: [4, 6],
    });
  });

  it("gives a driver who changed teams a head-to-head for each seat", () => {
    expect(teammateHeadToHeads(season, "lawson").map((h) => [h.constructorId, h.drivers[1]])).toEqual([
      ["rb", "arvid_lindblad"],
      ["red_bull", "max_verstappen"],
    ]);
  });
});

describe("teamRoster", () => {
  it("lists the latest line-up first with points scored for the team", () => {
    expect(teamRoster(season, "rb")).toEqual([
      { driverId: "tsunoda", rounds: [3, 4], points: 6 },
      { driverId: "arvid_lindblad", rounds: [1, 2, 3, 4], points: 5 },
      { driverId: "lawson", rounds: [1, 2], points: 18 },
    ]);
  });
});

describe("teamHeadToHeads", () => {
  it("pairs only drivers who shared the team's cars, in the order they were paired", () => {
    expect(teamHeadToHeads(season, "rb").map((h) => [h.drivers, h.rounds])).toEqual([
      [["lawson", "arvid_lindblad"], [1, 2]],
      [["arvid_lindblad", "tsunoda"], [3, 4]],
    ]);
  });
});

describe("teamStats", () => {
  it("adds up both cars", () => {
    expect(teamStats(season, "red_bull")).toEqual({ wins: 2, podiums: 5, poles: 3, bestFinish: 1, points: 136 });
  });
});

describe("driverWeekends", () => {
  it("joins qualifying, sprint and race per round, with the team for that round", () => {
    const [r1, r2, r3] = driverWeekends(season, "lawson");
    expect(r1).toMatchObject({ round: 1, event: "Grand Prix 1", constructorId: "rb", qualifying: 5, sprint: null, points: 10 });
    expect(r2.sprint?.position).toBe(3);
    expect(r2.points).toBe(8);
    expect(r3).toMatchObject({ constructorId: "red_bull", qualifying: 2 });
  });
});

describe("findDriverByCode", () => {
  it("matches codes in any case", () => {
    expect(findDriverByCode(season, "law")?.id).toBe("lawson");
    expect(findDriverByCode(season, "XXX")).toBeUndefined();
  });
});

describe("ageOn", () => {
  it("turns a year older on the birthday", () => {
    expect(ageOn("1998-02-15", Date.parse("2026-02-14T23:00:00Z"))).toBe(27);
    expect(ageOn("1998-02-15", Date.parse("2026-02-15T00:00:00Z"))).toBe(28);
  });
});

describe("roundSpan", () => {
  it("names a single round or a run", () => {
    expect(roundSpan([3])).toBe("R3");
    expect(roundSpan([1, 2, 11])).toBe("R1–R11");
    expect(roundSpan([])).toBe("—");
  });
});

describe("teamWeekends", () => {
  it("lists each round's finishes best first with race plus sprint points", () => {
    const [r1, r2] = teamWeekends(season, "red_bull");
    expect(r1.results.map((r) => r.driverId)).toEqual(["max_verstappen", "hadjar"]);
    expect(r1.points).toBe(40);
    expect(r2.results.map((r) => r.driverId)).toEqual(["hadjar", "max_verstappen"]);
    expect(r2.points).toBe(33);
  });

  it("skips rounds the team didn't race", () => {
    expect(teamWeekends(season, "cadillac")).toEqual([]);
  });
});

describe("teamOf", () => {
  it("uses the team map, falling back to the registered name", () => {
    expect(teamOf(season, "red_bull").name).toBe("Red Bull Racing");
    expect(teamOf({ ...season, teams: [{ id: "brand_new", name: "Brand New GP" }] }, "brand_new")).toMatchObject({ name: "Brand New GP", code: "BRA" });
  });
});
