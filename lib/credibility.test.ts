import { describe, expect, it } from "vitest";
import { RUMOR_LEDS, SHIFT_LIGHT_COUNT, shiftLightColor } from "./credibility";

describe("RUMOR_LEDS", () => {
  it("rises with each status and fills the meter only when signed", () => {
    expect(RUMOR_LEDS.whisper).toBeLessThan(RUMOR_LEDS.linked);
    expect(RUMOR_LEDS.linked).toBeLessThan(RUMOR_LEDS.strong);
    expect(RUMOR_LEDS.strong).toBeLessThan(RUMOR_LEDS.signed);
    expect(RUMOR_LEDS.signed).toBe(SHIFT_LIGHT_COUNT);
  });
});

describe("shiftLightColor", () => {
  it("lays out four green, four red, two blue", () => {
    const strip = Array.from({ length: SHIFT_LIGHT_COUNT }, (_, i) => shiftLightColor(i));
    expect(strip.filter((c) => c === "green")).toHaveLength(4);
    expect(strip.filter((c) => c === "red")).toHaveLength(4);
    expect(strip.filter((c) => c === "blue")).toHaveLength(2);
    expect(strip[0]).toBe("green");
    expect(strip[SHIFT_LIGHT_COUNT - 1]).toBe("blue");
  });

  it("rejects indexes outside the strip", () => {
    expect(() => shiftLightColor(-1)).toThrow(RangeError);
    expect(() => shiftLightColor(SHIFT_LIGHT_COUNT)).toThrow(RangeError);
    expect(() => shiftLightColor(1.5)).toThrow(RangeError);
  });
});
