/**
 * Builds data/pace.json: one representative lap time per team per race, plus
 * the quickest lap of the most recent race with its sector splits.
 *
 * Run `npm run data:pace` after a race weekend; the output is committed, so the
 * site never asks OpenF1 for the ~1,100 lap rows a race produces.
 *
 * Races come from Jolpica's calendar, not OpenF1's: the two disagree about the
 * 2026 season (OpenF1 lists Bahrain and Saudi Arabia, Jolpica does not), and
 * standings, driver pages and the countdown are all Jolpica's, so the pecking
 * order has to be built on the same set of rounds as the rest of the site.
 *
 * Existing rounds are reused from data/pace.json, so a normal run fetches only
 * the new race and OpenF1 is asked for as little as possible. Pass --all to
 * rebuild every round from scratch.
 */
import { readFile, writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { teamPace, type FastestLap, type Lap, type PaceData, type RacePace } from "../lib/pace";

const OPENF1 = "https://api.openf1.org/v1";
const JOLPICA = "https://api.jolpi.ca/ergast/f1";
const OUT = new URL("../data/pace.json", import.meta.url);
/** Jolpica caps a page at 100 rows whatever limit you ask for. */
const PAGE = 100;
/** Politeness gap between requests; OpenF1 answers 429 if you rush it. */
const THROTTLE_MS = 700;
const RETRIES = 5;
/**
 * How long after a race starts before its laps are read. A race plus a margin:
 * ingesting a session still running would record a half-finished race.
 */
const SETTLE_MS = 6 * 60 * 60 * 1000;

const rebuildAll = process.argv.includes("--all");

/**
 * Fetches JSON, waiting longer after each 429. Returns null for 404, which is
 * how OpenF1 answers for a session that hasn't run yet.
 */
async function get<T>(url: string): Promise<T | null> {
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

async function getOrThrow<T>(url: string): Promise<T> {
  const body = await get<T>(url);
  if (body === null) {
    throw new Error(`${url} responded 404`);
  }
  return body;
}

type JolpicaRace = { round: string; raceName: string; date: string; Circuit: { circuitId: string } };
type JolpicaResults = JolpicaRace & {
  Results: { Driver: { code: string }; Constructor: { constructorId: string } }[];
};
type Paged<T> = { MRData: { total: string; RaceTable: { Races: T[] } } };

/** Every page of a Jolpica race list. */
async function allRaces<T>(path: string): Promise<T[]> {
  const races: T[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const { MRData } = await getOrThrow<Paged<T>>(`${JOLPICA}${path}?limit=${PAGE}&offset=${offset}`);
    races.push(...MRData.RaceTable.Races);
    if (offset + PAGE >= Number(MRData.total)) {
      return races;
    }
  }
}

type Session = { session_key: number; session_name: string; date_start: string; circuit_short_name: string };
type OpenF1Lap = {
  driver_number: number;
  lap_number: number;
  lap_duration: number | null;
  duration_sector_1: number | null;
  duration_sector_2: number | null;
  duration_sector_3: number | null;
  is_pit_out_lap: boolean;
};
type OpenF1Driver = { driver_number: number; name_acronym: string };
type OpenF1Pit = { driver_number: number; lap_number: number };

const toLap = (lap: OpenF1Lap): Lap => ({
  driverNumber: lap.driver_number,
  lapNumber: lap.lap_number,
  seconds: lap.lap_duration,
  pitOut: lap.is_pit_out_lap,
});

/**
 * The quickest lap of a session, with each sector marked against the rest of
 * the session: the fastest anyone managed, else that driver's own best, else
 * simply slower.
 */
function fastestLap(
  laps: OpenF1Lap[],
  round: number,
  event: string,
  codeOf: (driverNumber: number) => string | undefined,
  seatOf: (driverNumber: number) => string | undefined,
): FastestLap | null {
  const timed = laps.filter((lap) => lap.lap_duration !== null && !lap.is_pit_out_lap);
  const best = timed.reduce<OpenF1Lap | null>(
    (quickest, lap) => (quickest === null || lap.lap_duration! < quickest.lap_duration! ? lap : quickest),
    null,
  );
  const driverCode = best && codeOf(best.driver_number);
  const constructorId = best && seatOf(best.driver_number);
  if (!best || !driverCode || !constructorId) {
    return null;
  }

  const sectorsOf = (lap: OpenF1Lap) => [lap.duration_sector_1, lap.duration_sector_2, lap.duration_sector_3];
  const quickestSector = sectorsOf(best).map((_, index) =>
    Math.min(...timed.map((lap) => sectorsOf(lap)[index] ?? Infinity)),
  );
  const ownBest = sectorsOf(best).map((_, index) =>
    Math.min(...timed.filter((l) => l.driver_number === best.driver_number).map((l) => sectorsOf(l)[index] ?? Infinity)),
  );

  const sectors = sectorsOf(best).flatMap((seconds, index) => {
    if (seconds === null) {
      return [];
    }
    const kind = seconds <= quickestSector[index] ? "fastest" : seconds <= ownBest[index] ? "pb" : "slower";
    return [{ seconds, kind } as const];
  });
  return sectors.length === 3
    ? { round, event, driverCode, constructorId, lapNumber: best.lap_number, seconds: best.lap_duration!, sectors }
    : null;
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/** Driver number to three-letter code for one session. */
async function driverCodes(session: Session): Promise<Map<number, string>> {
  const drivers = await getOrThrow<OpenF1Driver[]>(`${OPENF1}/drivers?session_key=${session.session_key}`);
  return new Map(drivers.map((d) => [d.driver_number, d.name_acronym]));
}

/** Driver number to the constructor they raced for in `round`. */
function seatOf(code: Map<number, string>, round: string, seats: Map<string, string>) {
  return (driverNumber: number) => {
    const tla = code.get(driverNumber);
    return tla === undefined ? undefined : seats.get(`${round}:${tla}`);
  };
}

async function main() {
  const existing: PaceData | null = rebuildAll
    ? null
    : await readFile(OUT, "utf8")
        .then((text) => JSON.parse(text) as PaceData)
        .catch(() => null);

  const calendar = await allRaces<JolpicaRace>("/current/races/");
  const season = calendar[0]?.date.slice(0, 4) ?? String(new Date().getFullYear());
  const byDate = new Map(calendar.map((race) => [race.date, race]));

  // Which constructor each driver raced for, per round: OpenF1 knows driver
  // numbers, the site knows Jolpica constructor ids, and a driver can change
  // seats mid-season.
  const seats = new Map<string, string>();
  for (const race of await allRaces<JolpicaResults>("/current/results/")) {
    for (const row of race.Results) {
      seats.set(`${race.round}:${row.Driver.code}`, row.Constructor.constructorId);
    }
  }

  const sessions = (await getOrThrow<Session[]>(`${OPENF1}/sessions?year=${season}`))
    .filter((s) => s.session_name === "Race")
    .sort((a, b) => a.date_start.localeCompare(b.date_start));

  const kept = new Map(existing?.races.map((race) => [race.round, race]) ?? []);
  const races: RacePace[] = [];
  /** The newest race with data, whose fastest lap the Paddock page shows. */
  let newest: { session: Session; race: JolpicaRace; round: number } | null = null;

  for (const session of sessions) {
    const day = session.date_start.slice(0, 10);
    const race = byDate.get(day);
    if (!race) {
      console.log(`skip   ${day} ${session.circuit_short_name}: not a round of the Jolpica calendar`);
      continue;
    }
    const round = Number(race.round);
    if (Date.parse(session.date_start) > Date.now() - SETTLE_MS) {
      console.log(`skip   R${round} ${race.raceName}: not run yet, or still running`);
      continue;
    }

    // A round already in data/pace.json never changes, so it costs no requests.
    const cached = kept.get(round);
    if (cached) {
      races.push(cached);
      newest = { session, race, round };
      console.log(`cached R${round} ${race.raceName}`);
      continue;
    }

    const laps = await get<OpenF1Lap[]>(`${OPENF1}/laps?session_key=${session.session_key}`);
    if (laps === null || laps.length === 0) {
      console.log(`skip   R${round} ${race.raceName}: OpenF1 has no laps yet`);
      continue;
    }
    const code = await driverCodes(session);
    const pit = (await get<OpenF1Pit[]>(`${OPENF1}/pit?session_key=${session.session_key}`)) ?? [];
    const pitLaps = new Set(pit.map((stop) => `${stop.driver_number}:${stop.lap_number}`));
    const teams = teamPace(laps.map(toLap), pitLaps, seatOf(code, race.round, seats));
    if (Object.keys(teams).length === 0) {
      console.warn(`skip   R${round} ${race.raceName}: no usable laps`);
      continue;
    }
    races.push({
      round,
      event: race.raceName,
      circuitId: race.Circuit.circuitId,
      date: race.date,
      teams: Object.fromEntries(Object.entries(teams).map(([id, pace]) => [id, round3(pace)])),
    });
    newest = { session, race, round };
    console.log(`built  R${round} ${race.raceName}: ${Object.keys(teams).length} teams`);
  }

  races.sort((a, b) => a.round - b.round);

  // The Paddock page shows the newest race's quickest lap. Re-reading it needs
  // that session's laps, so keep the stored one when it is already current.
  let latestFastest = existing?.fastestLap ?? null;
  if (newest && latestFastest?.round !== newest.round) {
    const laps = (await get<OpenF1Lap[]>(`${OPENF1}/laps?session_key=${newest.session.session_key}`)) ?? [];
    const code = await driverCodes(newest.session);
    latestFastest = fastestLap(
      laps,
      newest.round,
      newest.race.raceName,
      (n) => code.get(n),
      seatOf(code, newest.race.round, seats),
    );
  } else if (!newest) {
    latestFastest = null;
  }

  // Keep the old timestamp when nothing changed, so a scheduled run that finds
  // no new race leaves the file untouched and commits nothing.
  const unchanged =
    existing !== null &&
    JSON.stringify({ ...existing, generatedAt: "" }) ===
      JSON.stringify({ season, generatedAt: "", races, fastestLap: latestFastest });
  if (unchanged) {
    console.log(`\nno change: ${races.length} races already up to date`);
    return;
  }

  const data: PaceData = {
    season,
    generatedAt: new Date().toISOString(),
    races,
    fastestLap: latestFastest,
  };
  await writeFile(OUT, `${JSON.stringify(data, null, 1)}\n`);
  console.log(`\nwrote ${races.length} races${latestFastest ? ` and ${latestFastest.driverCode}'s fastest lap` : ""}`);
}

await main();
