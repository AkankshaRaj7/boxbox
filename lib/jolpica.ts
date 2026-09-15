/**
 * Championship standings from the free Jolpica-F1 API (the Ergast successor).
 *
 * Jolpica allows roughly 500 unauthenticated requests an hour, so responses are
 * cached by Next.js and refetched at most once per `STANDINGS_REVALIDATE`.
 */
import type { StandingRow, Standings } from "@/lib/standings";
import { FALLBACK_TEAM_COLOR, teamInfo } from "@/lib/teams";

export const JOLPICA_BASE = "https://api.jolpi.ca/ergast/f1";

/** Seconds between refetches. Standings only change after a race. */
export const STANDINGS_REVALIDATE = 3600;

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

function toPoints(value: string): number {
  const points = Number(value);
  if (!Number.isFinite(points)) {
    throw new Error(`Jolpica returned non-numeric points: ${value}`);
  }
  return points;
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
      code: Driver.code ?? Driver.familyName.slice(0, 3).toUpperCase(),
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

async function getStandingsJson(kind: "driverstandings" | "constructorstandings"): Promise<StandingsResponse> {
  const res = await fetch(`${JOLPICA_BASE}/current/${kind}/?limit=100`, {
    next: { revalidate: STANDINGS_REVALIDATE, tags: ["standings"] },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`Jolpica ${kind} responded ${res.status}`);
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
    getStandingsJson("driverstandings"),
    getStandingsJson("constructorstandings"),
  ]);
  return {
    ...parseRound(driversRes),
    drivers: parseDriverStandings(driversRes),
    constructors: parseConstructorStandings(constructorsRes),
  };
}
