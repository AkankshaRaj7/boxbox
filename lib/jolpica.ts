/**
 * Championship standings and the race calendar from the free Jolpica-F1 API
 * (the Ergast successor).
 *
 * Jolpica allows roughly 500 unauthenticated requests an hour, so responses are
 * cached by Next.js and refetched at most once per `JOLPICA_REVALIDATE`.
 */
import { SESSION_NAMES, type RaceWeekend, type Session, type SessionKind } from "@/lib/schedule";
import type { StandingRow, Standings } from "@/lib/standings";
import { FALLBACK_TEAM_COLOR, teamInfo } from "@/lib/teams";

export const JOLPICA_BASE = "https://api.jolpi.ca/ergast/f1";

/** Seconds between refetches. Standings change after a race, schedules rarely. */
export const JOLPICA_REVALIDATE = 3600;

type JolpicaConstructor = { constructorId: string; name: string };

type JolpicaDriver = {
  driverId: string;
  code?: string;
  givenName: string;
  familyName: string;
};

type StandingsList = {
  season: string;
  round: string;
  DriverStandings?: {
    position?: string;
    points: string;
    Driver: JolpicaDriver;
    Constructors: JolpicaConstructor[];
  }[];
  ConstructorStandings?: {
    position?: string;
    points: string;
    Constructor: JolpicaConstructor;
  }[];
};

export type StandingsResponse = {
  MRData: {
    StandingsTable: { season: string; round?: string; StandingsLists: StandingsList[] };
  };
};

/** Jolpica field names for each session other than the race, which sits on the race itself. */
const SESSION_FIELDS = [
  ["FirstPractice", "fp1"],
  ["SecondPractice", "fp2"],
  ["ThirdPractice", "fp3"],
  ["SprintQualifying", "sprint-qualifying"],
  ["SprintShootout", "sprint-qualifying"],
  ["Sprint", "sprint"],
  ["Qualifying", "qualifying"],
] as const satisfies readonly (readonly [string, SessionKind])[];

type SessionTime = { date: string; time?: string };

export type JolpicaRace = SessionTime & {
  season: string;
  round: string;
  raceName: string;
  Circuit: {
    circuitId: string;
    circuitName: string;
    Location: { locality: string; country: string };
  };
} & Partial<Record<(typeof SESSION_FIELDS)[number][0], SessionTime>>;

type ResultsRace = { season: string; Results: { Driver: JolpicaDriver }[] };

export type RaceTableResponse<Race = JolpicaRace> = {
  MRData: { RaceTable: { season?: string; Races: Race[] } };
};

function toPoints(value: string): number {
  const points = Number(value);
  if (!Number.isFinite(points)) {
    throw new Error(`Jolpica returned non-numeric points: ${value}`);
  }
  return points;
}

/** Three-letter driver code; drivers from before codes existed get one from their surname. */
function driverCode(driver: JolpicaDriver): string {
  return driver.code ?? driver.familyName.slice(0, 3).toUpperCase();
}

/**
 * Driver rows in Jolpica's order, which already applies countback on ties.
 * A driver who changed teams mid-season is listed under every team they drove
 * for, oldest first, so the last entry is the current seat.
 */
export function parseDriverStandings(res: StandingsResponse): StandingRow[] {
  const list = res.MRData.StandingsTable.StandingsLists[0];
  return (list?.DriverStandings ?? []).map(({ Driver, Constructors, points }) => {
    const current = Constructors.at(-1);
    return {
      id: Driver.driverId,
      code: driverCode(Driver),
      name: `${Driver.givenName} ${Driver.familyName}`,
      color: current ? teamInfo(current.constructorId, current.name).color : FALLBACK_TEAM_COLOR,
      points: toPoints(points),
    };
  });
}

/** Constructor rows in Jolpica's order. */
export function parseConstructorStandings(res: StandingsResponse): StandingRow[] {
  const list = res.MRData.StandingsTable.StandingsLists[0];
  return (list?.ConstructorStandings ?? []).map(({ Constructor, points }) => {
    const team = teamInfo(Constructor.constructorId, Constructor.name);
    return {
      id: Constructor.constructorId,
      code: team.code,
      name: team.name,
      color: team.color,
      points: toPoints(points),
    };
  });
}

/** Season and last completed round; round is null before the first race. */
export function parseRound(res: StandingsResponse): Pick<Standings, "season" | "round"> {
  const table = res.MRData.StandingsTable;
  const list = table.StandingsLists[0];
  return { season: list?.season ?? table.season, round: list ? Number(list.round) : null };
}

/**
 * Race weekends in round order. Sessions without a published start time are
 * left out, since a countdown to an unknown time would mislead.
 */
export function parseCalendar(res: RaceTableResponse): RaceWeekend[] {
  return res.MRData.RaceTable.Races.map((race) => {
    const round = Number(race.round);
    const session = (kind: SessionKind, t: SessionTime | undefined): Session[] =>
      t?.time
        ? [{ kind, name: SESSION_NAMES[kind], round, event: race.raceName, startsAt: `${t.date}T${t.time}` }]
        : [];
    const sessions = [...SESSION_FIELDS.flatMap(([field, kind]) => session(kind, race[field])), ...session("race", race)];
    return {
      season: race.season,
      round,
      event: race.raceName,
      circuitId: race.Circuit.circuitId,
      circuitName: race.Circuit.circuitName,
      locality: race.Circuit.Location.locality,
      country: race.Circuit.Location.country,
      sessions: sessions.sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt)),
    };
  });
}

/** The most recent race winner in a circuit's results, or null for a new venue. */
export function parseLastWinner(res: RaceTableResponse<ResultsRace>): { code: string; season: string } | null {
  const race = res.MRData.RaceTable.Races.at(-1);
  const winner = race?.Results[0]?.Driver;
  return race && winner ? { code: driverCode(winner), season: race.season } : null;
}

async function getJolpica<T>(path: string): Promise<T> {
  const res = await fetch(`${JOLPICA_BASE}${path}`, {
    next: { revalidate: JOLPICA_REVALIDATE, tags: ["jolpica"] },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`Jolpica ${path} responded ${res.status}`);
  }
  return res.json();
}

/**
 * Current-season driver and constructor standings.
 *
 * @throws if Jolpica is unreachable or returns an unexpected payload.
 */
export async function fetchStandings(): Promise<Standings> {
  const [driversRes, constructorsRes] = await Promise.all([
    getJolpica<StandingsResponse>("/current/driverstandings/?limit=100"),
    getJolpica<StandingsResponse>("/current/constructorstandings/?limit=100"),
  ]);
  return {
    ...parseRound(driversRes),
    drivers: parseDriverStandings(driversRes),
    constructors: parseConstructorStandings(constructorsRes),
  };
}

/**
 * The current season's race weekends and session times.
 *
 * @throws if Jolpica is unreachable.
 */
export async function fetchCalendar(): Promise<RaceWeekend[]> {
  return parseCalendar(await getJolpica<RaceTableResponse>("/current/?limit=100"));
}

/**
 * Who won the last race held at a circuit.
 *
 * @throws if Jolpica is unreachable.
 */
export async function fetchLastWinner(circuitId: string) {
  return parseLastWinner(
    await getJolpica<RaceTableResponse<ResultsRace>>(`/circuits/${encodeURIComponent(circuitId)}/results/1/?limit=100`),
  );
}
