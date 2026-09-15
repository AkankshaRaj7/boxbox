import { describe, expect, it } from "vitest";
import {
  parseConstructorStandings,
  parseDriverStandings,
  parseRound,
  type StandingsResponse,
} from "./jolpica";
import { FALLBACK_TEAM_COLOR, TEAMS_2026 } from "./teams";

const mercedes = { constructorId: "mercedes", name: "Mercedes" };

/** Trimmed from the real 2026 response after round 14. */
const drivers: StandingsResponse = {
  MRData: {
    StandingsTable: {
      season: "2026",
      round: "14",
      StandingsLists: [
        {
          season: "2026",
          round: "14",
          DriverStandings: [
            {
              position: "1",
              points: "292",
              Driver: { driverId: "antonelli", code: "ANT", givenName: "Andrea Kimi", familyName: "Antonelli" },
              Constructors: [mercedes],
            },
            {
              position: "2",
              points: "59.5",
              Driver: { driverId: "lawson", code: "LAW", givenName: "Liam", familyName: "Lawson" },
              Constructors: [
                { constructorId: "rb", name: "RB F1 Team" },
                { constructorId: "red_bull", name: "Red Bull" },
              ],
            },
            {
              position: "3",
              points: "0",
              Driver: { driverId: "new_driver", givenName: "Sam", familyName: "Newman" },
              Constructors: [{ constructorId: "brand_new", name: "Brand New GP" }],
            },
          ],
        },
      ],
    },
  },
};

const constructors: StandingsResponse = {
  MRData: {
    StandingsTable: {
      season: "2026",
      round: "14",
      StandingsLists: [
        {
          season: "2026",
          round: "14",
          ConstructorStandings: [
            { position: "1", points: "503", Constructor: mercedes },
            { position: "2", points: "12", Constructor: { constructorId: "brand_new", name: "Brand New GP" } },
          ],
        },
      ],
    },
  },
};

const preSeason: StandingsResponse = {
  MRData: { StandingsTable: { season: "2027", StandingsLists: [] } },
};

describe("parseDriverStandings", () => {
  it("keeps Jolpica's order and converts points to numbers", () => {
    const rows = parseDriverStandings(drivers);
    expect(rows.map((r) => [r.code, r.points])).toEqual([
      ["ANT", 292],
      ["LAW", 59.5],
      ["NEW", 0],
    ]);
    expect(rows[0]).toMatchObject({ id: "antonelli", name: "Andrea Kimi Antonelli", color: TEAMS_2026.mercedes.color });
  });

  it("colours a driver who switched teams by their latest team", () => {
    expect(parseDriverStandings(drivers)[1].color).toBe(TEAMS_2026.red_bull.color);
  });

  it("falls back to a neutral colour for unknown teams", () => {
    expect(parseDriverStandings(drivers)[2].color).toBe(FALLBACK_TEAM_COLOR);
  });

  it("returns no rows before the first race", () => {
    expect(parseDriverStandings(preSeason)).toEqual([]);
  });

  it("rejects non-numeric points", () => {
    const bad = structuredClone(drivers);
    bad.MRData.StandingsTable.StandingsLists[0].DriverStandings![0].points = "n/a";
    expect(() => parseDriverStandings(bad)).toThrow(/non-numeric/);
  });
});

describe("parseConstructorStandings", () => {
  it("uses BOXBOX team codes, names and colours", () => {
    expect(parseConstructorStandings(constructors)[0]).toEqual({
      id: "mercedes",
      code: "MER",
      name: "Mercedes",
      color: TEAMS_2026.mercedes.color,
      points: 503,
    });
  });

  it("derives a code and keeps the API name for unknown teams", () => {
    expect(parseConstructorStandings(constructors)[1]).toMatchObject({
      code: "BRA",
      name: "Brand New GP",
      color: FALLBACK_TEAM_COLOR,
    });
  });
});

describe("parseRound", () => {
  it("reads the season and last completed round", () => {
    expect(parseRound(drivers)).toEqual({ season: "2026", round: 14 });
  });

  it("has no round before the first race", () => {
    expect(parseRound(preSeason)).toEqual({ season: "2027", round: null });
  });
});
