import { describe, expect, it } from "vitest";
import {
  ARRIVAL_MAX_MS,
  ARRIVAL_MIN_MS,
  arrivalDuration,
  arrivalKeyframes,
  revealKeyframes,
  soundPreRoll,
} from "./team-pass";

describe("arrivalDuration", () => {
  it("scales with the distance to the parked spot", () => {
    expect(arrivalDuration(500)).toBeLessThan(arrivalDuration(1000));
  });

  it("stays within the minimum and maximum", () => {
    expect(arrivalDuration(10)).toBe(ARRIVAL_MIN_MS);
    expect(arrivalDuration(10_000)).toBe(ARRIVAL_MAX_MS);
  });
});

describe("soundPreRoll", () => {
  it("starts the recording early so its peak lands during the drive-in", () => {
    // 1000 ms drive: the peak lands 350 ms in, so the recording starts 1.25 s before the car appears.
    expect(soundPreRoll(1000, 1.6)).toBeCloseTo(1.25);
  });

  it("never goes negative", () => {
    expect(soundPreRoll(10_000, 1.6)).toBe(0);
  });
});

describe("arrivalKeyframes", () => {
  const frames = arrivalKeyframes(600, 400, 0.2);

  it("drives the car from fully off the left edge into its parked box", () => {
    expect(frames.distance).toBe(1000);
    expect(frames.car).toEqual([
      { offset: 0, transform: "translateX(-1000px)" },
      { offset: 1, transform: "translateX(0px)" },
    ]);
  });

  it("lays marks from the left edge to the parked rear wheel, starting when the wheel enters", () => {
    // The rear wheel is 80px from the tail, so it parks at 680px and enters after 80px of the 1000px drive.
    expect(frames.marksWidth).toBe(680);
    expect(frames.marks).toEqual([
      { offset: 0, clipPath: "inset(0 100% 0 0)" },
      { offset: 0.08, clipPath: "inset(0 100% 0 0)" },
      { offset: 1, clipPath: "inset(0 0 0 0)" },
    ]);
  });
});

describe("revealKeyframes", () => {
  it("uncovers text beside the parked spot as the car's tail passes it", () => {
    // Car 400px long parks at 600px, so it travels 1000px; its tail passes 24px after 424px and 560px after 960px.
    expect(revealKeyframes(600, 400, 24, 560)).toEqual([
      { offset: 0, clipPath: "inset(0 100% 0 0)" },
      { offset: 0.424, clipPath: "inset(0 100% 0 0)" },
      { offset: 0.96, clipPath: "inset(0 0 0 0)" },
      { offset: 1, clipPath: "inset(0 0 0 0)" },
    ]);
  });

  it("follows the nose when the text sits above the car's path", () => {
    const [, start, end] = revealKeyframes(24, 650, 24, 680);
    expect(start.offset).toBeCloseTo(24 / 674);
    expect(end.offset).toBe(1);
  });
});
