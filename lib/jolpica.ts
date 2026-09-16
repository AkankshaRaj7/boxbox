/**
 * Championship standings and the race calendar from the free Jolpica-F1 API
 * (the Ergast successor).
 *
 * Jolpica allows roughly 500 unauthenticated requests an hour, so responses are
 * cached by Next.js and refetched at most once per `JOLPICA_REVALIDATE`.
 */
import { SESSION_NAMES, type RaceWeekend, type Session, type SessionKind } from "@/lib/schedule";
import type { Classification, DriverBio, RoundInfo, SeasonResults } from "@/lib/season";
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
  MRData: { total?: string; RaceTable: { season?: string; Races: Race[] } };
};

type ProfileDriver = JolpicaDriver & { permanentNumber?: string; nationality?: string; dateOfBirth?: string };

type ClassificationRow = {
  number?: string;
  position: string;
  positionText: string;
  points: string;
  grid?: string;
  status: string;
  Driver: ProfileDriver;
  Constructor: JolpicaConstructor;
};

type QualifyingResultRow = { number?: string; position: string; Driver: ProfileDriver; Constructor: JolpicaConstructor };

/** A race from the season-wide `/results/`, `/sprint/` or `/qualifying/` endpoints. */
export type ClassifiedRace = {
  season: string;
  round: string;
  raceName: string;
  date: string;
  Circuit: { circuitId: string };
  Results?: ClassificationRow[];
  SprintResults?: ClassificationRow[];
  QualifyingResults?: QualifyingResultRow[];
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

function toClassification(round: number, row: ClassificationRow): Classification {
  return {
    round,
    driverId: row.Driver.driverId,
    constructorId: row.Constructor.constructorId,
    position: Number(row.position),
    positionText: row.positionText,
    status: row.status,
    grid: row.grid === undefined ? null : Number(row.grid),
    points: toPoints(row.points),
  };
}

/**
 * A season's classifications from the paged `/results/`, `/sprint/` and
 * `/qualifying/` responses. Pages split a round's rows wherever the limit
 * falls, so rows are merged by round. Driver details come from each driver's
 * latest row.
 */
export function parseSeasonResults(pages: {
  results: ClassifiedRace[];
  sprints: ClassifiedRace[];
  qualifying: ClassifiedRace[];
}): SeasonResults {
  const rounds = new Map<number, RoundInfo>();
  const drivers = new Map<string, { round: number; bio: DriverBio }>();
  const noteDriver = (round: number, row: { number?: string; Driver: ProfileDriver }) => {
    const seen = drivers.get(row.Driver.driverId);
    if (seen && seen.round > round) return;
    const d = row.Driver;
    drivers.set(d.driverId, {
      round,
      bio: {
        id: d.driverId,
        code: driverCode(d),
        givenName: d.givenName,
        familyName: d.familyName,
        number: row.number ?? d.permanentNumber ?? null,
        nationality: d.nationality ?? null,
        dateOfBirth: d.dateOfBirth ?? null,
      },
    });
  };

  const teams = new Map<string, string>();
  const races: Classification[] = [];
  for (const race of pages.results) {
    const round = Number(race.round);
    rounds.set(round, { round, event: race.raceName, date: race.date, circuitId: race.Circuit.circuitId });
    for (const row of race.Results ?? []) {
      races.push(toClassification(round, row));
      noteDriver(round, row);
      teams.set(row.Constructor.constructorId, row.Constructor.name);
    }
  }
  const sprints = pages.sprints.flatMap((race) =>
    (race.SprintResults ?? []).map((row) => toClassification(Number(race.round), row)),
  );
  const qualifying = pages.qualifying.flatMap((race) =>
    (race.QualifyingResults ?? []).map((row) => ({
      round: Number(race.round),
      driverId: row.Driver.driverId,
      constructorId: row.Constructor.constructorId,
      position: Number(row.position),
    })),
  );

  return {
    season: pages.results[0]?.season ?? pages.qualifying[0]?.season ?? "",
    rounds: [...rounds.values()].sort((a, b) => a.round - b.round),
    drivers: [...drivers.values()].map((d) => d.bio),
    teams: [...teams].map(([id, name]) => ({ id, name })),
    races,
    sprints,
    qualifying,
  };
}

/** Retries after a 429: Jolpica also limits bursts to a few requests a second. */
const RATE_LIMIT_RETRIES = 2;

async function getJolpica<T>(path: string): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${JOLPICA_BASE}${path}`, {
      next: { revalidate: JOLPICA_REVALIDATE, tags: ["jolpica"] },
      signal: AbortSignal.timeout(10_000),
    });
    if (res.status === 429 && attempt < RATE_LIMIT_RETRIES) {
      const seconds = Math.min(Number(res.headers.get("retry-after")) || 1, 5);
      await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
      continue;
    }
    if (!res.ok) {
      throw new Error(`Jolpica ${path} responded ${res.status}`);
    }
    return res.json();
  }
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

/** Jolpica's largest page size. */
const PAGE_LIMIT = 100;

/**
 * Every race row from a paged race-table endpoint. Pages load one after
 * another, so a cold cache doesn't trip Jolpica's burst limit.
 */
async function getAllRaces<Race>(path: string): Promise<Race[]> {
  const races: Race[] = [];
  let total = Infinity;
  for (let offset = 0; offset < total; offset += PAGE_LIMIT) {
    const res = await getJolpica<RaceTableResponse<Race>>(`${path}?limit=${PAGE_LIMIT}&offset=${offset}`);
    total = Number(res.MRData.total ?? 0);
    races.push(...res.MRData.RaceTable.Races);
  }
  return races;
}

/**
 * The current season's race, sprint and qualifying classifications: about ten
 * requests, made in sequence, each cached for `JOLPICA_REVALIDATE` and shared
 * by every driver and team page.
 *
 * @throws if Jolpica is unreachable.
 */
export async function fetchSeasonResults(): Promise<SeasonResults> {
  const results = await getAllRaces<ClassifiedRace>("/current/results/");
  const sprints = await getAllRaces<ClassifiedRace>("/current/sprint/");
  const qualifying = await getAllRaces<ClassifiedRace>("/current/qualifying/");
  return parseSeasonResults({ results, sprints, qualifying });
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
