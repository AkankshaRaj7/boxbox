/**
 * Car pace from race laps.
 *
 * A race tells you more about a car than a qualifying lap does, but raw race
 * laps are full of noise: pit stops, safety cars, traffic and the laps a driver
 * spends nursing a broken car. These functions reduce a race to one
 * representative lap time per team, then rank teams over a rolling window of
 * races.
 *
 * The numbers are an approximation and the pecking order page says so: nothing
 * here corrects for fuel load, tyre compound, track position or a wet track.
 *
 * Lap data comes from OpenF1 through `npm run data:pace`, which writes
 * `data/pace.json`.
 */
import paceData from "@/data/pace.json";

/** A lap as the pipeline needs it; `seconds` is null when timing missed it. */
export type Lap = {
  driverNumber: number;
  lapNumber: number;
  seconds: number | null;
  /** First lap out of the pits, which carries cold tyres and a pit-lane exit. */
  pitOut: boolean;
};

/** Laps slower than this multiple of a driver's own median are thrown away. */
export const OUTLIER_FACTOR = 1.07;
/** A driver must complete this share of the busiest driver's laps to count. */
export const MIN_LAP_SHARE = 0.25;
/** Fewer clean laps than this is not a pace reading. */
export const MIN_CLEAN_LAPS = 5;
/** How many recent races the published ranking averages over. */
export const FORM_RACES = 5;

/** Middle value, averaging the two middle values of an even-length list. */
export function median(values: number[]): number {
  if (values.length === 0) {
    throw new Error("median of an empty list");
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * One driver's representative lap: the median of their laps once laps more
 * than OUTLIER_FACTOR off that median are dropped. Two passes, so a long
 * safety-car spell drags the first median up but not the second.
 *
 * Null when there are too few clean laps to mean anything.
 */
export function representativePace(lapSeconds: number[]): number | null {
  if (lapSeconds.length < MIN_CLEAN_LAPS) {
    return null;
  }
  const rough = median(lapSeconds);
  const clean = lapSeconds.filter((seconds) => seconds <= rough * OUTLIER_FACTOR);
  return clean.length < MIN_CLEAN_LAPS ? null : median(clean);
}

/**
 * Each driver's clean laps: timed, not out of the pits, and not an in-lap.
 * `pitLaps` holds "driverNumber:lapNumber" for every lap a driver pitted on.
 */
export function cleanLapsByDriver(laps: Lap[], pitLaps: ReadonlySet<string>): Map<number, number[]> {
  const byDriver = new Map<number, number[]>();
  for (const lap of laps) {
    if (lap.seconds === null || lap.pitOut || pitLaps.has(`${lap.driverNumber}:${lap.lapNumber}`)) {
      continue;
    }
    const seen = byDriver.get(lap.driverNumber);
    if (seen) {
      seen.push(lap.seconds);
    } else {
      byDriver.set(lap.driverNumber, [lap.seconds]);
    }
  }
  return byDriver;
}

/**
 * The best representative pace each team managed, in seconds, keyed by Jolpica
 * constructorId. A team is judged on its quicker car, so one driver's crash,
 * early retirement or afternoon stuck in traffic doesn't become the team's pace.
 *
 * `seatOf` maps a driver number to the constructor they raced for that round;
 * drivers it doesn't know are left out.
 */
export function teamPace(
  laps: Lap[],
  pitLaps: ReadonlySet<string>,
  seatOf: (driverNumber: number) => string | undefined,
): Record<string, number> {
  const byDriver = cleanLapsByDriver(laps, pitLaps);
  if (byDriver.size === 0) {
    return {};
  }
  const busiest = Math.max(...[...byDriver.values()].map((lapSeconds) => lapSeconds.length));
  const teams: Record<string, number> = {};
  for (const [driverNumber, lapSeconds] of byDriver) {
    if (lapSeconds.length < MIN_LAP_SHARE * busiest) {
      continue;
    }
    const pace = representativePace(lapSeconds);
    const constructorId = seatOf(driverNumber);
    if (pace === null || constructorId === undefined) {
      continue;
    }
    const best = teams[constructorId];
    if (best === undefined || pace < best) {
      teams[constructorId] = pace;
    }
  }
  return teams;
}

/** One race reduced to a pace per team. */
export type RacePace = {
  round: number;
  event: string;
  circuitId: string;
  date: string;
  /** Representative lap in seconds, keyed by Jolpica constructorId. */
  teams: Record<string, number>;
};

/** Everything `npm run data:pace` writes to data/pace.json. */
export type PaceData = {
  season: string;
  generatedAt: string;
  races: RacePace[];
  fastestLap: FastestLap | null;
};

/** The quickest single lap of the most recent race, with its sector splits. */
export type FastestLap = {
  round: number;
  event: string;
  driverCode: string;
  constructorId: string;
  lapNumber: number;
  seconds: number;
  /** Sector times in order, with how each compares to the rest of the session. */
  sectors: { seconds: number; kind: "fastest" | "pb" | "slower" }[];
};

/** Each team's gap to the quickest car of that race, in percent. */
export function gapsToFastest(teams: Record<string, number>): Record<string, number> {
  const paces = Object.values(teams);
  if (paces.length === 0) {
    return {};
  }
  const quickest = Math.min(...paces);
  return Object.fromEntries(Object.entries(teams).map(([id, pace]) => [id, (pace / quickest - 1) * 100]));
}

/** A team's place in the pecking order. */
export type RankedTeam = {
  constructorId: string;
  rank: number;
  /** Mean gap to the quickest car across the window, in percent. */
  gap: number;
  /** Places gained (+) or lost (−) since the round before. */
  movement: number;
  /** Gap per race across the window, oldest first, for the sparkline. */
  trend: number[];
};

/** Mean gap per team over the last `window` races, quickest first. */
function averageGaps(races: RacePace[], window: number): Map<string, number[]> {
  const gapsPerRace = races.slice(-window).map((race) => gapsToFastest(race.teams));
  const collected = new Map<string, number[]>();
  for (const gaps of gapsPerRace) {
    for (const [id, gap] of Object.entries(gaps)) {
      const seen = collected.get(id);
      if (seen) {
        seen.push(gap);
      } else {
        collected.set(id, [gap]);
      }
    }
  }
  return collected;
}

const mean = (values: number[]) => values.reduce((total, value) => total + value, 0) / values.length;

/** Constructor ids in pecking order, quickest first. */
function order(races: RacePace[], window: number): string[] {
  return [...averageGaps(races, window)]
    .map(([constructorId, gaps]) => ({ constructorId, gap: mean(gaps) }))
    .sort((a, b) => a.gap - b.gap)
    .map((team) => team.constructorId);
}

/**
 * The pecking order over the last `window` races, quickest car first.
 *
 * A single race is too noisy to rank cars on — strategy, traffic and safety
 * cars move a team a percent either way — so gaps are averaged across the
 * window, and a team missing from a race simply doesn't count for that race.
 * Movement compares the same window ending one race earlier.
 */
export function rankTeams(races: RacePace[], window = FORM_RACES): RankedTeam[] {
  if (races.length === 0) {
    return [];
  }
  const previous = races.length > 1 ? order(races.slice(0, -1), window) : [];
  return [...averageGaps(races, window)]
    .map(([constructorId, gaps]) => ({ constructorId, gap: mean(gaps), trend: gaps }))
    .sort((a, b) => a.gap - b.gap)
    .map((team, index) => {
      const before = previous.indexOf(team.constructorId);
      return {
        ...team,
        rank: index + 1,
        movement: before === -1 ? 0 : before - index,
      };
    });
}

/**
 * The committed pace data. The cast is safe because `npm run data:pace` writes
 * this file from the types above; JSON widens the sector `kind` union to string.
 */
export const PACE = paceData as PaceData;

/** The current pecking order, quickest car first. Empty before the first race. */
export function peckingOrder(data: PaceData = PACE): RankedTeam[] {
  return rankTeams(data.races);
}
