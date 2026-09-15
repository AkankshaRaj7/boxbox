import { describe, expect, it } from "vitest";
import {
  CAR_MAX_MS,
  CAR_MIN_MS,
  HOLD_MAX_MS,
  HOLD_MIN_MS,
  LIGHT_COUNT,
  REAR_AXLE,
  carPassDuration,
  carPassKeyframes,
  pickCar,
  planLights,
} from "./lights";

describe("carPassDuration", () => {
  it("keeps a steady speed, so a longer car on a wider screen takes longer", () => {
    // 1280 × 800: car 1024 wide, 2765 long; 3565 px of travel at 2600 px/s.
    expect(carPassDuration(1280, 800)).toBe(1371);
  });

  it("stays within the minimum and maximum pass time", () => {
    expect(carPassDuration(375, 812)).toBe(CAR_MIN_MS);
    expect(carPassDuration(2560, 1440)).toBe(CAR_MAX_MS);
  });
});

describe("pickCar", () => {
  const teams = { ferrari: { color: "#ed1131" }, haas: { color: "#c3c7cb" }, mercedes: { color: "#00d7b6" } };

  it("picks a team and a direction from the random source", () => {
    const rolls = [0.99, 0.2];
    expect(pickCar(teams, () => rolls.shift()!)).toEqual({ teamId: "mercedes", color: "#00d7b6", direction: "up" });
    const more = [0, 0.7];
    expect(pickCar(teams, () => more.shift()!)).toEqual({ teamId: "ferrari", color: "#ed1131", direction: "down" });
  });
});

describe("carPassKeyframes", () => {
  const height = 800;
  const car = 300;
  const travel = height + car;

  it("moves the car from just below the screen to just above it when going up", () => {
    expect(carPassKeyframes(height, car, "up").car).toEqual([
      { offset: 0, transform: "translateY(800px)" },
      { offset: 1, transform: "translateY(-300px)" },
    ]);
  });

  it("uncovers the page behind the car's middle", () => {
    const { cover } = carPassKeyframes(height, car, "up");
    expect(cover.map((k) => k.offset)).toEqual([0, 150 / travel, 950 / travel, 1]);
    expect(cover.at(-1)!.clipPath).toBe("inset(0 0 100% 0)");
    expect(carPassKeyframes(height, car, "down").cover.at(-1)!.clipPath).toBe("inset(100% 0 0 0)");
  });

  it("grows tyre marks behind the rear axle", () => {
    const { marks } = carPassKeyframes(height, car, "down");
    expect(marks[1]).toEqual({ offset: (car * REAR_AXLE) / travel, clipPath: "inset(0 0 100% 0)" });
    expect(marks[2]).toEqual({ offset: (height + car * REAR_AXLE) / travel, clipPath: "inset(0 0 0 0)" });
  });
});

describe("planLights", () => {
  it("turns one light on per second", () => {
    const { lightsOnAt } = planLights(() => 0);
    expect(lightsOnAt).toHaveLength(LIGHT_COUNT);
    expect(lightsOnAt.slice(1).map((t, i) => t - lightsOnAt[i])).toEqual([1000, 1000, 1000, 1000]);
  });

  it("holds for a random time within the range before lights out", () => {
    const last = planLights(() => 0).lightsOnAt[LIGHT_COUNT - 1];
    expect(planLights(() => 0).lightsOutAt - last).toBe(HOLD_MIN_MS);
    expect(planLights(() => 0.999999).lightsOutAt - last).toBe(HOLD_MAX_MS);
    expect(planLights(() => 0.5).lightsOutAt - last).toBe((HOLD_MIN_MS + HOLD_MAX_MS) / 2);
  });

  it("keeps the whole sequence around six seconds", () => {
    expect(planLights(() => 0).lightsOutAt).toBeGreaterThanOrEqual(5000);
    expect(planLights(() => 0.999999).lightsOutAt).toBeLessThanOrEqual(6500);
  });
});
