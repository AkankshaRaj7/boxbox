/**
 * One race, reduced to what decided it.
 *
 * The rules these functions serve are in docs/plan.md §9.4, and they are not
 * decoration: we publish observations and arithmetic, never inferred blame. No
 * function here returns the words "mistake", "error" or "failed", and anything
 * a steward said is carried through verbatim for the page to quote.
 *
 * Built by `npm run data:race` into data/races/<season>-<round>.json.
 */
import type { TyreCompound } from "@/lib/pace";
import { capitalise, count, plural, position } from "@/lib/words";

/** A safety car or virtual safety car period, in laps. */
export type Neutralisation = {
  kind: "vsc" | "safety-car";
  fromLap: number;
  /** Null when it never ended: the race finished behind it, or was stopped. */
  toLap: number | null;
};

/** One race-control message worth showing, in the FIA's own words. */
export type ControlNote = {
  lap: number;
  /** The driver it names, when it names one. */
  driverCode: string | null;
  flag: string | null;
  /** Verbatim. Never paraphrase a steward. */
  message: string;
};

export type PitStop = {
  driverCode: string;
  /** The lap the driver came in on. */
  lap: number;
  /**
   * Seconds spent in the pit lane, entry to exit — OpenF1's `pit_duration`.
   * This is NOT the stationary time fans quote: `stop_duration` is null
   * throughout the 2026 data, so the ~2s figure simply isn't available. Label
   * it as pit-lane time wherever it is shown.
   */
  pitLaneSeconds: number | null;
  /**
   * Seconds lost against the cars running at that moment, or null when the
   * lap times needed to measure it are missing. See `pitLoss`.
   */
  lossSeconds: number | null;
  /** True when the in-lap or the out-lap ran under a safety car or VSC. */
  underNeutralisation: boolean;
};

export type Stint = { driverCode: string; compound: TyreCompound | null; fromLap: number; toLap: number };

/** A driver's race, as classified by the FIA. */
export type RaceResult = {
  position: number;
  positionText: string;
  driverCode: string;
  driverName: string;
  constructorId: string;
  /** Starting position; 0 for a pit-lane start. */
  grid: number | null;
  status: string;
  points: number;
};

/** Everything data/races/<season>-<round>.json holds. */
export type RaceRecord = {
  season: string;
  round: number;
  event: string;
  circuitId: string;
  date: string;
  generatedAt: string;
  neutralisations: Neutralisation[];
  /** Times the race was stopped — a red flag reads as SESSION ABORTED. */
  redFlags: number;
  control: ControlNote[];
  pit: PitStop[];
  stints: Stint[];
  results: RaceResult[];
  /**
   * Constructor ids in championship order after this round. Used to order
   * drivers on the page: championship position is objective, updates itself,
   * and puts the teams most people follow near the top without anyone hand-
   * ranking popularity.
   */
  constructorOrder: string[];
  /**
   * Median seconds lost by a green-flag stop in this race, the reference the
   * verdict compares against. Null when too few green stops to measure.
   */
  greenPitLoss: number | null;
};

/** A lap time, as the pipeline reads them. */
export type LapTime = { driverNumber: number; lapNumber: number; seconds: number | null };

/** Raw race-control rows, in the shape OpenF1 returns. */
export type ControlMessage = { category: string; message: string; lapNumber: number | null };

/**
 * Safety car and virtual safety car periods, in lap numbers.
 *
 * OpenF1 announces a start ("VSC DEPLOYED", "SAFETY CAR DEPLOYED") and usually
 * an end ("VSC ENDING", "SAFETY CAR IN THIS LAP"), but not always: across the
 * 2026 season so far there were 9 safety cars and only 7 endings, because a
 * race can finish behind one or be red-flagged. An unclosed period gets a null
 * `toLap` rather than being dropped or guessed at.
 */
export function neutralisations(messages: ControlMessage[]): Neutralisation[] {
  const out: Neutralisation[] = [];
  let open: Neutralisation | null = null;
  for (const message of messages) {
    if (message.category !== "SafetyCar" || message.lapNumber === null) {
      continue;
    }
    const text = message.message.toUpperCase();
    if (text.includes("DEPLOYED")) {
      if (open) {
        out.push(open);
      }
      open = { kind: text.includes("VSC") ? "vsc" : "safety-car", fromLap: message.lapNumber, toLap: null };
    } else if (open) {
      open.toLap = message.lapNumber;
      out.push(open);
      open = null;
    }
  }
  if (open) {
    out.push(open);
  }
  return out;
}

/** Whether a lap ran under a safety car or VSC. */
export function isNeutralised(periods: Neutralisation[], lap: number): boolean {
  return periods.some((period) => lap >= period.fromLap && lap <= (period.toLap ?? Infinity));
}

/** Lap times keyed by driver and lap, for the measurements below. */
export type LapIndex = Map<string, number>;

const key = (driverNumber: number, lap: number) => `${driverNumber}:${lap}`;

export function indexLaps(laps: LapTime[]): LapIndex {
  const index: LapIndex = new Map();
  for (const lap of laps) {
    if (lap.seconds !== null) {
      index.set(key(lap.driverNumber, lap.lapNumber), lap.seconds);
    }
  }
  return index;
}

/** Middle value of a list; the caller guarantees it is non-empty. */
function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Fewer cars than this on a lap and the field reference means nothing. */
export const MIN_FIELD_SAMPLE = 5;

/**
 * What a pit stop cost, in seconds, measured **against the cars running at that
 * moment** rather than against the driver's own pace.
 *
 * This distinction is the whole measurement. Under a safety car every lap time
 * is slower, so charging a stop against the driver's green-flag pace blames the
 * neutralisation on the pit stop and reports that stopping under a VSC is
 * *more* expensive — the opposite of the truth. Comparing with the field on the
 * same laps cancels the conditions out.
 *
 * The reference excludes cars on their own in- or out-lap, so stops don't
 * measure each other.
 *
 * @returns seconds lost, or null when the lap times needed are missing.
 */
export function pitLoss(index: LapIndex, laps: LapTime[], stops: { driverNumber: number; lap: number }[]) {
  const touched = new Set<string>();
  for (const stop of stops) {
    touched.add(key(stop.driverNumber, stop.lap));
    touched.add(key(stop.driverNumber, stop.lap + 1));
  }

  const onLap = new Map<number, number[]>();
  for (const lap of laps) {
    if (lap.seconds === null || touched.has(key(lap.driverNumber, lap.lapNumber))) {
      continue;
    }
    const seen = onLap.get(lap.lapNumber);
    if (seen) {
      seen.push(lap.seconds);
    } else {
      onLap.set(lap.lapNumber, [lap.seconds]);
    }
  }
  const reference = (lap: number) => {
    const times = onLap.get(lap);
    return times && times.length >= MIN_FIELD_SAMPLE ? median(times) : null;
  };

  return (driverNumber: number, lap: number): number | null => {
    const inLap = index.get(key(driverNumber, lap));
    const outLap = index.get(key(driverNumber, lap + 1));
    const inRef = reference(lap);
    const outRef = reference(lap + 1);
    if (inLap === undefined || outLap === undefined || inRef === null || outRef === null) {
      return null;
    }
    return inLap - inRef + (outLap - outRef);
  };
}

/**
 * The least a green-flag stop can plausibly cost. A pit lane takes far longer
 * to drive through than the same stretch of track, so anything under this means
 * the measurement is picking up changing conditions rather than the stop — as
 * happened in Australia, where stops whose out-lap fell under a safety car were
 * being counted as green and dragged the reference down to 0.1s.
 */
export const MIN_PLAUSIBLE_LOSS = 10;

/**
 * Median seconds lost by a green-flag stop — the reference the verdict quotes.
 *
 * Null when there are too few clean stops, or when the answer is implausible:
 * a number nobody can defend is worse than admitting we could not measure it.
 */
export function greenPitLoss(stops: PitStop[]): number | null {
  const green = stops.filter((stop) => !stop.underNeutralisation && stop.lossSeconds !== null);
  if (green.length < 3) {
    return null;
  }
  const loss = median(green.map((stop) => stop.lossSeconds!));
  return loss < MIN_PLAUSIBLE_LOSS ? null : loss;
}

/** How many lines the verdict block shows at most. */
export const VERDICT_LINES = 4;

/** A stop is "in the cluster" when this many cars took it on the same lap. */
const CLUSTER = 3;

const one = (n: number) => Math.round(n);

/**
 * A line, and the driver it is about. Naming the subject lets the verdict skip
 * a second line about the same driver: saying "NOR lost 51 seconds, started 1st
 * and finished 3rd" and then "NOR started on pole and finished 3rd" wastes one
 * of four lines on a repeat.
 */
type Line = { text: string; subject?: string };
type Verdict = (race: RaceRecord) => Line | null;

/**
 * The lap a neutralisation sent the field into the pits, and what that was
 * worth. The flagship line: a free stop is the single largest swing in a race
 * that has one.
 */
const neutralisedStops: Verdict = (race) => {
  const taken = race.pit.filter((stop) => stop.underNeutralisation);
  if (taken.length < CLUSTER) {
    return null;
  }
  const byLap = new Map<number, PitStop[]>();
  for (const stop of taken) {
    byLap.set(stop.lap, [...(byLap.get(stop.lap) ?? []), stop]);
  }
  const [lap, cluster] = [...byLap].sort((a, b) => b[1].length - a[1].length)[0];
  if (cluster.length < CLUSTER) {
    return null;
  }
  const measured = cluster.filter((stop) => stop.lossSeconds !== null).map((stop) => stop.lossSeconds!);
  const period = race.neutralisations.find((n) => lap >= n.fromLap && lap <= (n.toLap ?? Infinity));
  const what = period?.kind === "vsc" ? "the virtual safety car" : "the safety car";
  // The cars pitting is an observation; what it was worth needs a reference we
  // sometimes don't have. Report the first without the second rather than
  // losing both.
  if (measured.length === 0 || race.greenPitLoss === null) {
    return { text: `${capitalise(count(cluster.length))} cars pitted on lap ${lap} under ${what}.` };
  }
  const saved = race.greenPitLoss - median(measured);
  return {
    text:
      saved < 3
        ? `${capitalise(count(cluster.length))} cars pitted on lap ${lap} under ${what}.`
        : `${capitalise(count(cluster.length))} cars pitted on lap ${lap} under ${what}, costing them roughly ${one(saved)} seconds less than a green-flag stop.`,
  };
};

/**
 * Someone who stopped around a neutralisation and paid full price for it.
 * States what it cost and where they finished; it does not say why.
 */
const missedTheWindow: Verdict = (race) => {
  if (race.greenPitLoss === null) {
    return null;
  }
  const cluster = race.pit.filter((stop) => stop.underNeutralisation && stop.lossSeconds !== null);
  if (cluster.length < CLUSTER) {
    return null;
  }
  const cheapest = median(cluster.map((stop) => stop.lossSeconds!));
  const worst = [...cluster].sort((a, b) => b.lossSeconds! - a.lossSeconds!)[0];
  const cost = worst.lossSeconds! - cheapest;
  const result = race.results.find((row) => row.driverCode === worst.driverCode);
  // Only worth saying when the race agrees with the measurement. A driver who
  // "lost 42 seconds" and won it anyway makes the line read as a claim about
  // cause that the result plainly contradicts — and lap times either side of a
  // red flag are not comparable at all.
  if (cost < 10 || race.redFlags > 0 || !result || result.grid === null || result.position <= result.grid) {
    return null;
  }
  const from = result.grid === 0 ? "from the pit lane" : position(result.grid);
  return {
    subject: worst.driverCode,
    text: `${worst.driverCode} pitted on lap ${worst.lap} and lost ${one(worst.lossSeconds!)} seconds, ${one(cost)} more than the cars that came in earlier. ${worst.driverCode} started ${from} and finished ${position(result.position)}.`,
  };
};

/** Pole did not win. */
const poleLost: Verdict = (race) => {
  const pole = race.results.find((row) => row.grid === 1);
  if (!pole || pole.position === 1) {
    return null;
  }
  const winner = race.results.find((row) => row.position === 1);
  const finish = pole.positionText.match(/^\d+$/) ? `finished ${position(pole.position)}` : "did not finish";
  return {
    subject: pole.driverCode,
    text: `${pole.driverCode} started on pole and ${finish}${winner ? `; ${winner.driverCode} won` : ""}.`,
  };
};

/** The biggest climb through the field. */
const biggestMover: Verdict = (race) => {
  const climbs = race.results
    .filter((row) => row.grid !== null && row.grid > 0 && row.positionText.match(/^\d+$/))
    .map((row) => ({ row, gained: row.grid! - row.position }))
    .sort((a, b) => b.gained - a.gained);
  const best = climbs[0];
  if (!best || best.gained < 4) {
    return null;
  }
  return {
    subject: best.row.driverCode,
    text: `${best.row.driverCode} gained ${plural(best.gained, "place")}, from ${position(best.row.grid!)} to ${position(best.row.position)}.`,
  };
};

/** Laps deleted for track limits — the stewards' own finding, counted. */
const trackLimits: Verdict = (race) => {
  const deleted = race.control.filter((note) => /TRACK LIMITS/i.test(note.message) && /DELETED/i.test(note.message));
  const drivers = new Set(deleted.map((note) => note.driverCode).filter(Boolean));
  if (deleted.length < 3) {
    return null;
  }
  return { text: `The stewards deleted ${count(deleted.length)} lap times for track limits, across ${plural(drivers.size, "driver")}.` };
};

/** The race was stopped. */
const redFlag: Verdict = (race) =>
  race.redFlags > 0
    ? { text: `The race was stopped ${race.redFlags === 1 ? "once" : `${count(race.redFlags)} times`}.` }
    : null;

/**
 * The quickest trip through the pit lane. Not the stationary time — see
 * `PitStop.pitLaneSeconds` — so the sentence says pit lane, not "stop".
 */
const quickestPitLane: Verdict = (race) => {
  const timed = race.pit.filter((stop) => stop.pitLaneSeconds !== null);
  if (timed.length < 5) {
    return null;
  }
  const best = [...timed].sort((a, b) => a.pitLaneSeconds! - b.pitLaneSeconds!)[0];
  return {
    subject: best.driverCode,
    text: `${best.driverCode} made the quickest trip through the pit lane, ${best.pitLaneSeconds!.toFixed(1)} seconds from entry to exit.`,
  };
};

/** Highest interest first; the page takes the first `VERDICT_LINES` that fire. */
const VERDICTS: Verdict[] = [
  redFlag,
  neutralisedStops,
  missedTheWindow,
  poleLost,
  biggestMover,
  trackLimits,
  quickestPitLane,
];

/**
 * What decided this race: at most `VERDICT_LINES` lines, fewer when there is
 * less to say.
 *
 * Every line is an observation and its arithmetic. None of them says why
 * anything happened, and none uses the words "mistake", "error" or "failed" —
 * see docs/plan.md §9.4. A dull race gets a short verdict rather than a
 * manufactured one.
 */
export function raceVerdict(race: RaceRecord, limit = VERDICT_LINES): string[] {
  const lines: string[] = [];
  const named = new Set<string>();
  for (const verdict of VERDICTS) {
    const line = verdict(race);
    if (line === null || (line.subject !== undefined && named.has(line.subject))) {
      continue;
    }
    if (line.subject !== undefined) {
      named.add(line.subject);
    }
    lines.push(line.text);
    if (lines.length === limit) {
      break;
    }
  }
  return lines;
}

/**
 * Drivers grouped by team, teams in championship order, teammates adjacent.
 *
 * For the pit lane and the strategy chart, where the question is "how did this
 * team do" — a results table stays in finishing order, which is its own point.
 */
export function byTeam(race: RaceRecord): RaceResult[] {
  const rank = new Map(race.constructorOrder.map((id, index) => [id, index]));
  const place = (id: string) => rank.get(id) ?? Number.MAX_SAFE_INTEGER;
  return [...race.results].sort(
    (a, b) =>
      place(a.constructorId) - place(b.constructorId) ||
      a.constructorId.localeCompare(b.constructorId) ||
      a.position - b.position,
  );
}
