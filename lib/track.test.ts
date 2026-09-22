import { describe, expect, it } from "vitest";
import circuits from "@/data/circuits.json";
import { characterLabel, degreesPerKm, trackCharacter } from "./track";

const CIRCUITS: Record<string, { lengthM: number; coordinates: number[][] }> = circuits;

/** A closed square: four right angles, so 360° of turning however finely sampled. */
function square(side: number, pointsPerSide: number): number[][] {
  const kLon = 111_320 * Math.cos((45 * Math.PI) / 180);
  const corners = [
    [0, 0],
    [side, 0],
    [side, side],
    [0, side],
  ];
  const metres: [number, number][] = [];
  for (let c = 0; c < corners.length; c++) {
    const [x1, y1] = corners[c];
    const [x2, y2] = corners[(c + 1) % corners.length];
    for (let i = 0; i < pointsPerSide; i++) {
      const t = i / pointsPerSide;
      metres.push([x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]);
    }
  }
  return metres.map(([x, y]) => [x / kLon, y / 110_540]);
}

describe("degreesPerKm", () => {
  it("does not depend on how finely the lap was sampled", () => {
    // The whole reason this measure was chosen over counting corners.
    const coarse = degreesPerKm(square(1000, 4), 4000);
    const fine = degreesPerKm(square(1000, 40), 4000);
    expect(coarse).not.toBeNull();
    expect(fine).toBeCloseTo(coarse!, 6);
  });

  it("declines on an outline too short to mean anything", () => {
    expect(degreesPerKm([[0, 0], [1, 1]], 4000)).toBeNull();
    expect(degreesPerKm(square(1000, 10), 0)).toBeNull();
  });
});

describe("the real circuits", () => {
  const value = (id: string) => degreesPerKm(CIRCUITS[id].coordinates, CIRCUITS[id].lengthM)!;

  it("puts Monaco far ahead of Monza, as any fan would", () => {
    expect(value("monaco")).toBeGreaterThan(value("monza") * 2.5);
  });

  it("sorts the tracks people think of as fast below the twisty ones", () => {
    expect(value("hungaroring")).toBeGreaterThan(value("silverstone"));
    expect(value("monza")).toBeLessThan(value("catalunya"));
  });

  it("measures every circuit the site holds", () => {
    const unmeasurable = Object.keys(CIRCUITS).filter(
      (id) => degreesPerKm(CIRCUITS[id].coordinates, CIRCUITS[id].lengthM) === null,
    );
    expect(unmeasurable).toEqual([]);
  });
});

describe("trackCharacter", () => {
  const calendar = ["monaco", "monza", "silverstone", "hungaroring", "catalunya"];

  it("ranks within the calendar it is given, twistiest first", () => {
    expect(trackCharacter("monaco", calendar)).toMatchObject({ rank: 1, of: 5, share: 1 });
    expect(trackCharacter("monza", calendar)).toMatchObject({ rank: 5, of: 5, share: 0 });
  });

  it("spaces the bands by rank, so one outlier cannot squash the rest", () => {
    // Monaco is 693°/km against 432 for the next track. Scaling by value put
    // nine of 23 circuits in one band and left "Twisty" unused.
    const evenly = calendar.map((id) => trackCharacter(id, calendar)!.share);
    expect(evenly).toEqual([1, 0, 0.25, 0.75, 0.5]);
  });

  it("knows nothing about a circuit off the calendar", () => {
    expect(trackCharacter("monaco", ["monza"])).toBeNull();
    expect(trackCharacter("nowhere", calendar)).toBeNull();
  });

  it("copes with a calendar of one", () => {
    expect(trackCharacter("monza", ["monza"])).toMatchObject({ rank: 1, of: 1, share: 0.5 });
  });
});

describe("characterLabel", () => {
  it("reads from very fast up to very twisty", () => {
    expect([0, 0.2, 0.4, 0.6, 0.9].map(characterLabel)).toEqual([
      "Very fast",
      "Flowing",
      "Mixed",
      "Twisty",
      "Very twisty",
    ]);
  });
});

describe("angle wrapping", () => {
  it("matches an independent implementation on a real circuit", () => {
    // JavaScript's % keeps the sign of its left operand, so the usual
    // (a + PI) % (2 * PI) - PI overstates any turn where a + PI is negative.
    // A Python prototype over the same coordinates gives 693°/km for Monaco;
    // the buggy version gave 797.
    const monaco = degreesPerKm(CIRCUITS.monaco.coordinates, CIRCUITS.monaco.lengthM)!;
    expect(monaco).toBeGreaterThan(690);
    expect(monaco).toBeLessThan(696);
  });

  it("never reports more turning than a lap can contain", () => {
    // A lap of a closed circuit that turned more than ~4 full revolutions per
    // kilometre would be physically absurd; the bug produced exactly this kind
    // of overstatement.
    const worst = Math.max(
      ...Object.values(CIRCUITS).map((c) => degreesPerKm(c.coordinates, c.lengthM) ?? 0),
    );
    expect(worst).toBeLessThan(1440);
  });
});
