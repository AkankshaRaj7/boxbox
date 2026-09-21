/**
 * Fetching shared by the data build scripts.
 *
 * The rate-limit handling lives here so it can't drift between scripts: OpenF1
 * answers 429 when rushed and 404 for a session that hasn't run, and Jolpica
 * caps a page at 100 rows whatever limit you ask for.
 */
import { setTimeout as sleep } from "node:timers/promises";

export const OPENF1 = "https://api.openf1.org/v1";
export const JOLPICA = "https://api.jolpi.ca/ergast/f1";
/** Jolpica caps a page at 100 rows whatever limit you ask for. */
const PAGE = 100;
/** Politeness gap between requests; OpenF1 answers 429 if you rush it. */
const THROTTLE_MS = 700;
const RETRIES = 5;

/**
 * Fetches JSON, waiting longer after each 429. Returns null for 404, which is
 * how OpenF1 answers for a session that hasn't run yet.
 */
export async function get<T>(url: string): Promise<T | null> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url);
    if (res.status === 404) {
      return null;
    }
    if (res.status === 429 && attempt < RETRIES) {
      const wait = 10_000 * (attempt + 1);
      console.warn(`  rate limited, waiting ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      throw new Error(`${url} responded ${res.status}`);
    }
    await sleep(THROTTLE_MS);
    return (await res.json()) as T;
  }
}

export async function getOrThrow<T>(url: string): Promise<T> {
  const body = await get<T>(url);
  if (body === null) {
    throw new Error(`${url} responded 404`);
  }
  return body;
}

type Paged<T> = { MRData: { total: string; RaceTable: { Races: T[] } } };

/** Every page of a Jolpica race list. */
export async function allRaces<T>(path: string): Promise<T[]> {
  const races: T[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { MRData } = await getOrThrow<Paged<T>>(`${JOLPICA}${path}?limit=${PAGE}&offset=${offset}`);
    races.push(...MRData.RaceTable.Races);
    if (offset + PAGE >= Number(MRData.total)) {
      return races;
    }
  }
}

export type Session = {
  session_key: number;
  session_name: string;
  date_start: string;
  circuit_short_name: string;
};

/** The season's races, oldest first, as OpenF1 lists them. */
export async function raceSessions(season: string): Promise<Session[]> {
  return (await getOrThrow<Session[]>(`${OPENF1}/sessions?year=${season}`))
    .filter((session) => session.session_name === "Race")
    .sort((a, b) => a.date_start.localeCompare(b.date_start));
}

/** Driver number to three-letter code for one session. */
export async function driverCodes(sessionKey: number): Promise<Map<number, string>> {
  const drivers = await getOrThrow<{ driver_number: number; name_acronym: string }[]>(
    `${OPENF1}/drivers?session_key=${sessionKey}`,
  );
  return new Map(drivers.map((d) => [d.driver_number, d.name_acronym]));
}

/**
 * How long after a race starts before its data is read. A race plus a margin:
 * ingesting a session still running would record a half-finished race.
 */
export const SETTLE_MS = 6 * 60 * 60 * 1000;

/** Whether a session has finished long enough ago to be safe to read. */
export const hasSettled = (session: Session) => Date.parse(session.date_start) <= Date.now() - SETTLE_MS;
