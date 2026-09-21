import { describe, expect, it } from "vitest";
import { incidents, trackLimits, warnings } from "./incidents";
import type { ControlNote } from "./race";

const note = (lap: number, driverCode: string | null, message: string): ControlNote => ({
  lap,
  driverCode,
  flag: null,
  message,
});

describe("incidents", () => {
  it("joins every message about one incident into a single entry", () => {
    // Race control posts four lines for this: noted, investigated, penalised,
    // served. A reader should see one.
    const joined = incidents([
      note(16, "SAI", "TURN 5 INCIDENT INVOLVING CARS 55 (SAI) AND 14 (ALO) NOTED (15:23:42)"),
      note(18, "SAI", "FIA STEWARDS: TURN 5 INCIDENT INVOLVING CARS 55 (SAI) AND 14 (ALO) UNDER INVESTIGATION (15:23:42)"),
      note(20, "SAI", "FIA STEWARDS: 5 SECOND TIME PENALTY FOR CAR 55 (SAI) (15:23:42)"),
      note(27, "SAI", "FIA STEWARDS: PENALTY SERVED - 5 SECOND TIME PENALTY FOR CAR 55 (SAI) (15:23:42)"),
    ]);
    expect(joined).toHaveLength(1);
    expect(joined[0]).toMatchObject({
      lap: 16,
      drivers: ["SAI", "ALO"],
      turn: "Turn 5",
      outcome: "penalty",
      served: true,
    });
    expect(joined[0].penalty).toMatch(/5 second time penalty/i);
  });

  it("joins on driver and offence when race control omits the timestamp", () => {
    const joined = incidents([
      note(37, "STR", "CAR 18 (STR) TRACK LIMITS"),
      note(38, "STR", "FIA STEWARDS: CAR 18 (STR) UNDER INVESTIGATION - TRACK LIMITS"),
      note(38, "STR", "FIA STEWARDS: 5 SECOND TIME PENALTY FOR CAR 18 (STR) - TRACK LIMITS"),
    ]);
    expect(joined).toHaveLength(1);
    expect(joined[0].outcome).toBe("penalty");
  });

  it("keeps separately numbered offences apart", () => {
    const joined = incidents([
      note(37, "STR", "CAR 18 (STR) UNDER INVESTIGATION - TRACK LIMITS"),
      note(41, "STR", "CAR 18 (STR) UNDER INVESTIGATION - TRACK LIMITS (6TH OFFENCE)"),
    ]);
    expect(joined).toHaveLength(2);
  });

  it("reads a review with no further action as exactly that", () => {
    const joined = incidents([
      note(4, "VER", "TURN 1 INCIDENT INVOLVING CAR 3 (VER) NOTED - LEAVING THE TRACK AND GAINING AN ADVANTAGE (15:04:12)"),
      note(5, "VER", "FIA STEWARDS: TURN 1 INCIDENT INVOLVING CAR 3 (VER) REVIEWED NO FURTHER INVESTIGATION - LEAVING THE TRACK AND GAINING AN ADVANTAGE (15:04:12)"),
    ]);
    expect(joined[0]).toMatchObject({ outcome: "no-action", penalty: null, served: false });
    expect(joined[0].reason).toBe("Leaving the track and gaining an advantage");
  });

  it("tolerates the double colon race control sometimes types", () => {
    const joined = incidents([
      note(10, "PIA", "INCIDENT INVOLVING CAR 81 (PIA) NOTED - YELLOW FLAG INFRINGEMENT (15:12::25)"),
      note(13, "PIA", "FIA STEWARDS: INCIDENT INVOLVING CAR 81 (PIA) REVIEWED NO FURTHER INVESTIGATION - YELLOW FLAG INFRINGEMENT (15:12::25)"),
    ]);
    expect(joined).toHaveLength(1);
  });

  it("leaves out anything naming no driver", () => {
    expect(incidents([note(1, null, "INCIDENT UNDER INVESTIGATION")])).toEqual([]);
  });

  it("orders by the lap it was first reported", () => {
    const joined = incidents([
      note(45, "COL", "TURN 17 INCIDENT INVOLVING CAR 43 (COL) NOTED (16:14:53)"),
      note(4, "VER", "TURN 1 INCIDENT INVOLVING CAR 3 (VER) NOTED (15:04:12)"),
    ]);
    expect(joined.map((i) => i.lap)).toEqual([4, 45]);
  });
});

describe("trackLimits", () => {
  it("counts deletions per driver instead of listing them", () => {
    expect(
      trackLimits([
        note(5, "HAM", "CAR 44 (HAM) TIME 1:43.055 DELETED - TRACK LIMITS AT TURN 1 LAP 4"),
        note(9, "HAM", "CAR 44 (HAM) TIME 1:42.900 DELETED - TRACK LIMITS AT TURN 6 LAP 8"),
        note(7, "ANT", "CAR 12 (ANT) TIME 1:41.166 DELETED - TRACK LIMITS AT TURN 17 LAP 6"),
      ]),
    ).toEqual([
      { driverCode: "HAM", deleted: 2 },
      { driverCode: "ANT", deleted: 1 },
    ]);
  });
});

describe("warnings", () => {
  it("picks out black-and-white flags", () => {
    expect(warnings([note(6, "HAM", "BLACK AND WHITE FLAG FOR CAR 44 (HAM) - TRACK LIMITS")])).toEqual([
      { lap: 6, driverCode: "HAM", reason: "Track limits" },
    ]);
  });
});
