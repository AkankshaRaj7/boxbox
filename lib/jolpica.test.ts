import { describe, expect, it } from "vitest";
import {
  parseCalendar,
  parseConstructorStandings,
  parseDriverStandings,
  parseLastWinner,
  parseRound,
  parseSeasonResults,
  type ClassifiedRace,
  type RaceTableResponse,
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

/** The real 2026 Singapore sprint weekend, fields in Jolpica's order, plus an untimed session. */
const calendar: RaceTableResponse = {
  MRData: {
    RaceTable: {
      season: "2026",
      Races: [
        {
          season: "2026",
          round: "17",
          raceName: "Singapore Grand Prix",
          Circuit: {
            circuitId: "marina_bay",
            circuitName: "Marina Bay Street Circuit",
            Location: { locality: "Marina Bay", country: "Singapore" },
          },
          date: "2026-10-11",
          time: "12:00:00Z",
          FirstPractice: { date: "2026-10-09", time: "08:30:00Z" },
          SecondPractice: { date: "2026-10-09" },
          Qualifying: { date: "2026-10-10", time: "13:00:00Z" },
          Sprint: { date: "2026-10-10", time: "09:00:00Z" },
          SprintQualifying: { date: "2026-10-09", time: "12:30:00Z" },
        },
      ],
    },
  },
};

describe("parseCalendar", () => {
  it("orders a sprint weekend's sessions by start time", () => {
    const [weekend] = parseCalendar(calendar);
    expect(weekend.sessions.map((s) => [s.kind, s.startsAt])).toEqual([
      ["fp1", "2026-10-09T08:30:00Z"],
      ["sprint-qualifying", "2026-10-09T12:30:00Z"],
      ["sprint", "2026-10-10T09:00:00Z"],
      ["qualifying", "2026-10-10T13:00:00Z"],
      ["race", "2026-10-11T12:00:00Z"],
    ]);
  });

  it("leaves out sessions without a start time", () => {
    expect(parseCalendar(calendar)[0].sessions.some((s) => s.kind === "fp2")).toBe(false);
  });

  it("carries the event and circuit onto the weekend and its sessions", () => {
    const [weekend] = parseCalendar(calendar);
    expect(weekend).toMatchObject({ round: 17, event: "Singapore Grand Prix", circuitId: "marina_bay", country: "Singapore" });
    expect(weekend.sessions[1]).toMatchObject({ name: "Sprint Qualifying", round: 17, event: "Singapore Grand Prix" });
  });
});

describe("parseLastWinner", () => {
  const driver = (code: string | undefined, familyName: string) => ({
    driverId: familyName.toLowerCase(),
    code,
    givenName: "X",
    familyName,
  });
  const results = (...races: [string, ReturnType<typeof driver>][]): Parameters<typeof parseLastWinner>[0] => ({
    MRData: { RaceTable: { Races: races.map(([season, d]) => ({ season, Results: [{ Driver: d }] })) } },
  });

  it("returns the most recent winner", () => {
    expect(parseLastWinner(results(["2024", driver("PIA", "Piastri")], ["2025", driver("VER", "Verstappen")]))).toEqual({
      code: "VER",
      season: "2025",
    });
  });

  it("derives a code for winners from before codes existed", () => {
    expect(parseLastWinner(results(["1957", driver(undefined, "Fangio")]))?.code).toBe("FAN");
  });

  it("is null for a new venue", () => {
    expect(parseLastWinner(results())).toBeNull();
  });
});

describe("parseSeasonResults", () => {
  const driver = (driverId: string, code: string) => ({
    driverId,
    code,
    givenName: "Sam",
    familyName: driverId,
    permanentNumber: "9",
    nationality: "British",
    dateOfBirth: "2000-01-01",
  });
  const row = (d: ReturnType<typeof driver>, position: number, extra: Record<string, string> = {}) => ({
    number: "9",
    position: String(position),
    positionText: String(position),
    points: position === 1 ? "25" : "0.5",
    grid: String(position),
    status: "Finished",
    Driver: d,
    Constructor: mercedes,
    ...extra,
  });
  const race = (round: number, rows: Partial<ClassifiedRace>): ClassifiedRace => ({
    season: "2026",
    round: String(round),
    raceName: `Grand Prix ${round}`,
    date: `2026-03-0${round}`,
    Circuit: { circuitId: `circuit_${round}` },
    ...rows,
  });
  const rus = driver("russell", "RUS");
  const ant = driver("antonelli", "ANT");

  /** Round 2 is split across two pages, as Jolpica does wherever the page limit falls. */
  const season = parseSeasonResults({
    results: [
      race(1, { Results: [row(rus, 1), row(ant, 2)] }),
      race(2, { Results: [row(rus, 1, { number: "63" })] }),
      race(2, { Results: [row(ant, 2, { grid: "0", positionText: "R", status: "Retired" })] }),
    ],
    sprints: [race(2, { SprintResults: [row(ant, 1)] })],
    qualifying: [race(2, { QualifyingResults: [{ position: "1", Driver: ant, Constructor: mercedes }] })],
  });

  it("merges rounds split across pages", () => {
    expect(season.rounds).toEqual([
      { round: 1, event: "Grand Prix 1", date: "2026-03-01", circuitId: "circuit_1" },
      { round: 2, event: "Grand Prix 2", date: "2026-03-02", circuitId: "circuit_2" },
    ]);
    expect(season.races.filter((r) => r.round === 2).map((r) => r.driverId)).toEqual(["russell", "antonelli"]);
  });

  it("converts numbers and keeps the finish code and a pit-lane grid of 0", () => {
    expect(season.races.at(-1)).toEqual({
      round: 2,
      driverId: "antonelli",
      constructorId: "mercedes",
      position: 2,
      positionText: "R",
      status: "Retired",
      grid: 0,
      points: 0.5,
    });
  });

  it("takes driver details from the latest race", () => {
    expect(season.drivers.find((d) => d.id === "russell")).toEqual({
      id: "russell",
      code: "RUS",
      givenName: "Sam",
      familyName: "russell",
      number: "63",
      nationality: "British",
      dateOfBirth: "2000-01-01",
    });
    expect(season.teams).toEqual([{ id: "mercedes", name: "Mercedes" }]);
  });

  it("parses sprints and qualifying", () => {
    expect(season.season).toBe("2026");
    expect(season.sprints).toMatchObject([{ round: 2, driverId: "antonelli", points: 25 }]);
    expect(season.qualifying).toEqual([{ round: 2, driverId: "antonelli", constructorId: "mercedes", position: 1 }]);
  });
});
