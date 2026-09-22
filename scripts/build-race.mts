/**
 * Builds data/races/<season>-<round>.json: one reduced record per race, holding
 * what decided it.
 *
 * Run `npm run data:race` after a race weekend. One file per race, so a page
 * loads only the race being viewed; a finished race never changes, so an
 * existing file costs no requests. Pass --all to rebuild every round.
 *
 * Rounds come from Jolpica's calendar, not OpenF1's, for the reason in
 * docs/plan.md and lib/pace.ts: the two disagree about the 2026 season.
 */
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import {
  greenPitLoss,
  indexLaps,
  isNeutralised,
  neutralisations,
  pitLoss,
  type ControlNote,
  type LapTime,
  type PitStop,
  type RaceRecord,
  type RaceResult,
  type Stint,
} from "../lib/race";
import type { TyreCompound } from "../lib/pace";
import { JOLPICA, OPENF1, allRaces, driverCodes, get, hasSettled, raceSessions } from "./sources.mjs";

const OUT_DIR = new URL("../data/races/", import.meta.url);
const rebuildAll = process.argv.includes("--all");

type JolpicaRace = { round: string; raceName: string; date: string; Circuit: { circuitId: string } };
type JolpicaResults = JolpicaRace & {
  Results: {
    position: string;
    positionText: string;
    points: string;
    grid?: string;
    status: string;
    Driver: { code: string; givenName: string; familyName: string };
    Constructor: { constructorId: string };
  }[];
};

type OpenF1Lap = { driver_number: number; lap_number: number; lap_duration: number | null };
type OpenF1Pit = { driver_number: number; lap_number: number; pit_duration: number | null };
type OpenF1Stint = {
  driver_number: number;
  compound: string | null;
  lap_start: number | null;
  lap_end: number | null;
};
type OpenF1Control = {
  category: string;
  message: string;
  flag: string | null;
  lap_number: number | null;
  driver_number: number | null;
  date: string;
};

/** OpenF1's compound names in the site's own spelling. */
const COMPOUNDS: Record<string, TyreCompound> = {
  SOFT: "soft",
  MEDIUM: "medium",
  HARD: "hard",
  INTERMEDIATE: "inter",
  WET: "wet",
};

/**
 * Race-control noise. Blue flags alone are 79 of 185 messages in a typical
 * race, and none of them tells the reader anything about what decided it.
 */
const NOISE =
  /BLUE FLAG|PIT LANE|PIT EXIT|ALL PASS HOLDERS|RISK OF RAIN|OVERTAKE (EN|DIS)ABLED|CLEAR IN TRACK SECTOR|TRACK CLEAR|GREEN LIGHT|DRS|MARSHAL/i;

const round1 = (n: number) => Math.round(n * 10) / 10;

/** The code in "CAR 1 (NOR)", when race control named a car but not a number. */
function codeFrom(message: string): string | null {
  return message.match(/\(([A-Z]{3})\)/)?.[1] ?? null;
}

type StandingsResponse = {
  MRData: {
    StandingsTable: { StandingsLists: { ConstructorStandings: { Constructor: { constructorId: string } }[] }[] };
  };
};

/** Constructor ids in championship order as they stood after `round`. */
async function constructorOrder(season: string, round: string): Promise<string[]> {
  const body = await get<StandingsResponse>(`${JOLPICA}/${season}/${round}/constructorstandings/?limit=50`);
  const list = body?.MRData.StandingsTable.StandingsLists[0]?.ConstructorStandings ?? [];
  return list.map((row) => row.Constructor.constructorId);
}

/**
 * Points per round per driver and per team, aggregated from every race record.
 *
 * /championship revalidates on live standings, so it cannot read the race files
 * at request time the way the prerendered race pages do. This one small
 * committed file is imported like data/pace.json instead.
 */
async function writeScoring(season: string) {
  const files = (await readdir(OUT_DIR)).filter((file) => file.startsWith(`${season}-`)).sort();
  const rounds = await Promise.all(
    files.map(async (file) => JSON.parse(await readFile(new URL(file, OUT_DIR), "utf8")) as RaceRecord),
  );
  const scoring = {
    season,
    drivers: rounds
      .map((race) => ({ round: race.round, entries: race.results.map((r) => ({ key: r.driverCode, points: r.points })) }))
      .sort((a, b) => a.round - b.round),
    teams: rounds
      .map((race) => ({
        round: race.round,
        entries: race.results.map((r) => ({ key: r.constructorId, points: r.points })),
      }))
      .sort((a, b) => a.round - b.round),
  };
  await writeFile(new URL("../scoring.json", OUT_DIR), `${JSON.stringify(scoring, null, 1)}\n`);
  console.log(`wrote scoring.json for ${rounds.length} rounds`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const existing = new Set(rebuildAll ? [] : await readdir(OUT_DIR).catch(() => []));

  const calendar = await allRaces<JolpicaRace>("/current/races/");
  const season = calendar[0]?.date.slice(0, 4) ?? String(new Date().getFullYear());
  const byDate = new Map(calendar.map((race) => [race.date, race]));

  // Jolpica pages by row, not by race, so one round's results are split
  // wherever the page limit falls. Merge the fragments; keeping only the last
  // one leaves a round with a handful of drivers in no meaningful order.
  const results = new Map<string, JolpicaResults>();
  for (const race of await allRaces<JolpicaResults>("/current/results/")) {
    const seen = results.get(race.round);
    if (seen) {
      seen.Results.push(...race.Results);
    } else {
      results.set(race.round, { ...race, Results: [...race.Results] });
    }
  }

  let built = 0;
  for (const session of await raceSessions(season)) {
    const day = session.date_start.slice(0, 10);
    const race = byDate.get(day);
    if (!race) {
      console.log(`skip   ${day} ${session.circuit_short_name}: not a round of the Jolpica calendar`);
      continue;
    }
    const round = Number(race.round);
    const file = `${season}-${round}.json`;
    if (existing.has(file)) {
      console.log(`have   R${round} ${race.raceName}`);
      continue;
    }
    if (!hasSettled(session)) {
      console.log(`skip   R${round} ${race.raceName}: not run yet, or still running`);
      continue;
    }
    const classified = results.get(race.round);
    if (!classified) {
      console.log(`skip   R${round} ${race.raceName}: Jolpica has no results yet`);
      continue;
    }

    const laps = await get<OpenF1Lap[]>(`${OPENF1}/laps?session_key=${session.session_key}`);
    if (laps === null || laps.length === 0) {
      console.log(`skip   R${round} ${race.raceName}: OpenF1 has no laps yet`);
      continue;
    }
    const control = (await get<OpenF1Control[]>(`${OPENF1}/race_control?session_key=${session.session_key}`)) ?? [];
    const stops = (await get<OpenF1Pit[]>(`${OPENF1}/pit?session_key=${session.session_key}`)) ?? [];
    const stints = (await get<OpenF1Stint[]>(`${OPENF1}/stints?session_key=${session.session_key}`)) ?? [];
    const code = await driverCodes(session.session_key);

    const ordered = [...control].sort((a, b) => a.date.localeCompare(b.date));
    const periods = neutralisations(
      ordered.map((row) => ({ category: row.category, message: row.message, lapNumber: row.lap_number })),
    );
    const lapTimes: LapTime[] = laps.map((lap) => ({
      driverNumber: lap.driver_number,
      lapNumber: lap.lap_number,
      seconds: lap.lap_duration,
    }));
    const loss = pitLoss(
      indexLaps(lapTimes),
      lapTimes,
      stops.map((stop) => ({ driverNumber: stop.driver_number, lap: stop.lap_number })),
    );

    const pit: PitStop[] = stops.flatMap((stop) => {
      const driverCode = code.get(stop.driver_number);
      if (!driverCode) {
        return [];
      }
      const seconds = loss(stop.driver_number, stop.lap_number);
      return [
        {
          driverCode,
          lap: stop.lap_number,
          pitLaneSeconds: stop.pit_duration === null ? null : round1(stop.pit_duration),
          lossSeconds: seconds === null ? null : round1(seconds),
          underNeutralisation:
            isNeutralised(periods, stop.lap_number) || isNeutralised(periods, stop.lap_number + 1),
        },
      ];
    });

    const notes: ControlNote[] = ordered.flatMap((row) =>
      NOISE.test(row.message) || row.lap_number === null
        ? []
        : [
            {
              lap: row.lap_number,
              driverCode: (row.driver_number === null ? null : (code.get(row.driver_number) ?? null)) ?? codeFrom(row.message),
              flag: row.flag,
              message: row.message,
            },
          ],
    );

    const record: RaceRecord = {
      season,
      round,
      event: race.raceName,
      circuitId: race.Circuit.circuitId,
      date: race.date,
      generatedAt: new Date().toISOString(),
      neutralisations: periods,
      redFlags: ordered.filter((row) => /SESSION ABORTED/i.test(row.message)).length,
      control: notes,
      pit,
      stints: stints.flatMap<Stint>((stint) => {
        const driverCode = code.get(stint.driver_number);
        const compound = stint.compound === null ? null : (COMPOUNDS[stint.compound] ?? null);
        return driverCode && stint.lap_start !== null && stint.lap_end !== null
          ? [{ driverCode, compound, fromLap: stint.lap_start, toLap: stint.lap_end }]
          : [];
      }),
      results: classified.Results.map<RaceResult>((row) => ({
        position: Number(row.position),
        positionText: row.positionText,
        driverCode: row.Driver.code,
        driverName: `${row.Driver.givenName} ${row.Driver.familyName}`,
        constructorId: row.Constructor.constructorId,
        grid: row.grid === undefined ? null : Number(row.grid),
        status: row.status,
        points: Number(row.points),
      })),
      greenPitLoss: null,
      constructorOrder: await constructorOrder(season, race.round),
    };
    const green = greenPitLoss(record.pit);
    record.greenPitLoss = green === null ? null : round1(green);

    await writeFile(new URL(file, OUT_DIR), `${JSON.stringify(record, null, 1)}\n`);
    built++;
    console.log(
      `built  R${round} ${race.raceName}: ${periods.length} neutralisations, ${pit.length} stops, ${notes.length} notes`,
    );
  }
  await writeScoring(season);
  console.log(`\n${built === 0 ? "nothing new" : `wrote ${built} race${built === 1 ? "" : "s"}`}`);
}

await main();
