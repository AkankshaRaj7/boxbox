import { describe, expect, it } from "vitest";
import { OUTLINE_SIZE, circuitInfo, projectOutline, scheduledLaps } from "./circuits";

/** Jolpica circuitIds on the 2026 calendar. */
const CALENDAR_2026 = [
  "albert_park", "shanghai", "suzuka", "miami", "villeneuve", "monaco", "catalunya", "red_bull_ring",
  "silverstone", "spa", "hungaroring", "zandvoort", "monza", "madring", "baku", "sepang", "marina_bay",
  "americas", "rodriguez", "interlagos", "vegas", "losail", "yas_marina",
];

describe("circuitInfo", () => {
  it.each(CALENDAR_2026)("has a layout and length for %s", (id) => {
    const info = circuitInfo(id);
    expect(info).not.toBeNull();
    expect(info!.lengthKm).toBeGreaterThan(3);
    expect(info!.lengthKm).toBeLessThan(8);
  });

  it("reads known lengths", () => {
    expect(circuitInfo("baku")?.lengthKm).toBe(6.003);
    expect(circuitInfo("monaco")?.lengthKm).toBe(3.337);
  });

  it("is null for a circuit without data", () => {
    expect(circuitInfo("nowhere")).toBeNull();
  });
});

describe("scheduledLaps", () => {
  it("matches real race lap counts", () => {
    expect(scheduledLaps("albert_park", 5278)).toBe(58);
    expect(scheduledLaps("baku", 6003)).toBe(51);
    expect(scheduledLaps("marina_bay", 4928)).toBe(62);
  });

  it("uses 260 km at Monaco", () => {
    expect(scheduledLaps("monaco", 3337)).toBe(78);
  });

  it("needs more than 305 km, not exactly 305", () => {
    expect(scheduledLaps("x", 5000)).toBe(62);
  });
});

describe("projectOutline", () => {
  const square = [
    [0, 0],
    [0.01, 0],
    [0.01, 0.01],
    [0, 0.01],
    [0, 0],
  ];

  it("draws north up, scaled to the outline size", () => {
    const { d, viewBox, start } = projectOutline(square);
    expect(d).toBe(`M0 ${OUTLINE_SIZE} L${OUTLINE_SIZE} ${OUTLINE_SIZE} L${OUTLINE_SIZE} 0 L0 0 L0 ${OUTLINE_SIZE} Z`);
    expect(viewBox).toBe("-40 -40 1080 1080");
    expect(start).toBeUndefined();
  });

  it("shrinks longitude away from the equator so shapes keep their proportions", () => {
    const atSixty = [
      [0, 60],
      [0.02, 60],
      [0.02, 60.01],
      [0, 60.01],
    ];
    const [, , width, height] = projectOutline(atSixty).viewBox.split(" ").map(Number);
    expect(width / height).toBeCloseTo(1, 1);
  });
});
