import { describe, expect, it } from "vitest";
import {
  greenPitLoss,
  indexLaps,
  isNeutralised,
  neutralisations,
  pitLoss,
  raceVerdict,
  type ControlMessage,
  type LapTime,
  type PitStop,
  type RaceRecord,
} from "./race";

const msg = (category: string, message: string, lapNumber: number | null): ControlMessage => ({
  category,
  message,
  lapNumber,
});

describe("neutralisations", () => {
  it("pairs a VSC with its ending", () => {
    expect(
      neutralisations([msg("SafetyCar", "VSC DEPLOYED", 14), msg("SafetyCar", "VSC ENDING", 15)]),
    ).toEqual([{ kind: "vsc", fromLap: 14, toLap: 15 }]);
  });

  it("reads a safety car and the lap it comes in", () => {
    expect(
      neutralisations([msg("SafetyCar", "SAFETY CAR DEPLOYED", 3), msg("SafetyCar", "SAFETY CAR IN THIS LAP", 7)]),
    ).toEqual([{ kind: "safety-car", fromLap: 3, toLap: 7 }]);
  });

  it("leaves one that never ended open rather than guessing", () => {
    // A race can finish behind the safety car, or be red-flagged under it.
    expect(neutralisations([msg("SafetyCar", "SAFETY CAR DEPLOYED", 50)])).toEqual([
      { kind: "safety-car", fromLap: 50, toLap: null },
    ]);
  });

  it("closes an open period when another is deployed", () => {
    expect(
      neutralisations([msg("SafetyCar", "VSC DEPLOYED", 5), msg("SafetyCar", "SAFETY CAR DEPLOYED", 6)]),
    ).toHaveLength(2);
  });

  it("ignores everything that is not a neutralisation", () => {
    expect(neutralisations([msg("Flag", "WAVED BLUE FLAG FOR CAR 14", 23)])).toEqual([]);
  });
});

describe("isNeutralised", () => {
  const periods = neutralisations([msg("SafetyCar", "VSC DEPLOYED", 14), msg("SafetyCar", "VSC ENDING", 15)]);

  it("covers the laps between deployment and ending", () => {
    expect([13, 14, 15, 16].map((lap) => isNeutralised(periods, lap))).toEqual([false, true, true, false]);
  });

  it("runs to the end when the period never closed", () => {
    const open = neutralisations([msg("SafetyCar", "SAFETY CAR DEPLOYED", 50)]);
    expect(isNeutralised(open, 70)).toBe(true);
  });
});

/**
 * A field of `count` cars lapping at `pace`, for `lapCount` laps, so a pit stop
 * has something to be measured against.
 */
function field(count: number, lapCount: number, pace: (lap: number) => number): LapTime[] {
  return Array.from({ length: count }, (_, car) =>
    Array.from({ length: lapCount }, (_, i) => ({ driverNumber: car + 1, lapNumber: i + 1, seconds: pace(i + 1) })),
  ).flat();
}

describe("pitLoss", () => {
  it("measures a stop against the cars running at that moment", () => {
    const laps = field(10, 6, () => 90);
    // Car 1 pits on lap 3: 20s on the in-lap, 5s on the out-lap.
    for (const lap of laps) {
      if (lap.driverNumber === 1 && lap.lapNumber === 3) lap.seconds = 110;
      if (lap.driverNumber === 1 && lap.lapNumber === 4) lap.seconds = 95;
    }
    const loss = pitLoss(indexLaps(laps), laps, [{ driverNumber: 1, lap: 3 }]);
    expect(loss(1, 3)).toBeCloseTo(25, 5);
  });

  it("does not charge a neutralisation to the stop that happened under it", () => {
    // The whole field runs 40s slower on laps 3 and 4; the stop itself costs
    // the same 25s. Measuring against the driver's own green pace would report
    // 105s and conclude that stopping under a safety car is expensive, which is
    // the opposite of the truth.
    const slow = (lap: number) => (lap === 3 || lap === 4 ? 130 : 90);
    const laps = field(10, 6, slow);
    for (const lap of laps) {
      if (lap.driverNumber === 1 && lap.lapNumber === 3) lap.seconds = 150;
      if (lap.driverNumber === 1 && lap.lapNumber === 4) lap.seconds = 135;
    }
    const loss = pitLoss(indexLaps(laps), laps, [{ driverNumber: 1, lap: 3 }]);
    expect(loss(1, 3)).toBeCloseTo(25, 5);
  });

  it("keeps stops from measuring each other", () => {
    // Nine of ten cars pit on lap 3. The reference must come from the one that
    // stayed out, not from the nine sitting in the pit lane.
    const laps = field(10, 6, () => 90);
    const stops = Array.from({ length: 9 }, (_, i) => ({ driverNumber: i + 1, lap: 3 }));
    for (const lap of laps) {
      if (lap.driverNumber <= 9 && lap.lapNumber === 3) lap.seconds = 110;
      if (lap.driverNumber <= 9 && lap.lapNumber === 4) lap.seconds = 95;
    }
    // Only one car is left on those laps, below MIN_FIELD_SAMPLE, so we decline
    // to answer rather than inventing a reference.
    expect(pitLoss(indexLaps(laps), laps, stops)(1, 3)).toBeNull();
  });

  it("returns null when the laps needed are missing", () => {
    const laps = field(10, 6, () => 90);
    expect(pitLoss(indexLaps(laps), laps, [{ driverNumber: 99, lap: 3 }])(99, 3)).toBeNull();
  });
});

describe("greenPitLoss", () => {
  const stop = (lossSeconds: number | null, underNeutralisation = false): PitStop => ({
    driverCode: "XXX",
    lap: 10,
    pitLaneSeconds: 31.4,
    lossSeconds,
    underNeutralisation,
  });

  it("takes the median of green-flag stops only", () => {
    expect(greenPitLoss([stop(24), stop(28), stop(26), stop(5, true)])).toBe(26);
  });

  it("declines with too few green stops to be a reference", () => {
    expect(greenPitLoss([stop(24), stop(28)])).toBeNull();
  });

  it("ignores stops it could not measure", () => {
    expect(greenPitLoss([stop(24), stop(null), stop(28)])).toBeNull();
  });
});

const race = (over: Partial<RaceRecord> = {}): RaceRecord => ({
  season: "2026",
  round: 14,
  event: "Spanish Grand Prix",
  circuitId: "madring",
  date: "2026-09-13",
  generatedAt: "2026-09-18T00:00:00.000Z",
  neutralisations: [{ kind: "vsc", fromLap: 14, toLap: 15 }],
  redFlags: 0,
  control: [],
  pit: [],
  stints: [],
  results: [],
  constructorOrder: ["mercedes", "ferrari", "mclaren"],
  greenPitLoss: 28.5,
  ...over,
});

const stopAt = (driverCode: string, lap: number, lossSeconds: number, underNeutralisation: boolean): PitStop => ({
  driverCode,
  lap,
  pitLaneSeconds: 31.4,
  lossSeconds,
  underNeutralisation,
});

const finished = (driverCode: string, position: number, grid: number) => ({
  position,
  positionText: String(position),
  driverCode,
  driverName: `A ${driverCode}`,
  constructorId: "mercedes",
  grid,
  status: "Finished",
  points: 0,
});

describe("raceVerdict", () => {
  const cluster = ["AAA", "BBB", "CCC", "DDD"].map((c) => stopAt(c, 14, 11, true));

  it("leads with the free stop and what it was worth", () => {
    expect(raceVerdict(race({ pit: cluster }))[0]).toBe(
      "Four cars pitted on lap 14 under the virtual safety car, costing them roughly 18 seconds less than a green-flag stop.",
    );
  });

  it("names a driver who paid full price and lost ground for it", () => {
    const verdict = raceVerdict(
      race({ pit: [...cluster, stopAt("NOR", 15, 51, true)], results: [finished("NOR", 3, 1)] }),
    );
    expect(verdict[1]).toContain("NOR pitted on lap 15 and lost 51 seconds");
    expect(verdict[1]).toContain("NOR started 1st and finished 3rd.");
  });

  it("stays silent about a lost window when the driver won anyway", () => {
    // Measuring a loss and then reporting a win reads as a claim about cause
    // that the result contradicts.
    const verdict = raceVerdict(
      race({ pit: [...cluster, stopAt("HAM", 41, 42, true)], results: [finished("HAM", 1, 2)] }),
    );
    expect(verdict.join(" ")).not.toContain("HAM pitted");
  });

  it("stays silent about it through a red flag, where lap times aren't comparable", () => {
    const verdict = raceVerdict(
      race({ redFlags: 1, pit: [...cluster, stopAt("ANT", 61, 45, true)], results: [finished("ANT", 1, 1)] }),
    );
    expect(verdict.join(" ")).not.toContain("ANT pitted");
  });

  it("never says the same driver twice", () => {
    const verdict = raceVerdict(
      race({ pit: [...cluster, stopAt("NOR", 15, 51, true)], results: [finished("NOR", 3, 1), finished("ANT", 1, 2)] }),
    );
    expect(verdict.filter((line) => line.startsWith("NOR"))).toHaveLength(1);
  });

  it("says nothing it cannot measure", () => {
    expect(raceVerdict(race({ greenPitLoss: null, pit: cluster }))[0]).toBe(
      "Four cars pitted on lap 14 under the virtual safety car.",
    );
  });

  it("gives a quiet race a short verdict rather than a manufactured one", () => {
    expect(raceVerdict(race())).toEqual([]);
  });

  it("never uses the words we banned", () => {
    const every = raceVerdict(
      race({
        redFlags: 1,
        pit: [...cluster, stopAt("NOR", 15, 51, true)],
        results: [finished("NOR", 3, 1), finished("ANT", 1, 2)],
      }),
      9,
    ).join(" ");
    expect(every).not.toMatch(/mistake|error|failed|blunder|blame/i);
  });
});
