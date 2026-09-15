import { describe, expect, it } from "vitest";
import { formatCountdown, nextSaturdayAt } from "./time";

describe("formatCountdown", () => {
  it("formats under a day as HH:MM:SS", () => {
    expect(formatCountdown(2 * 3600_000 + 14 * 60_000 + 37_000)).toBe("02:14:37");
  });

  it("prefixes whole days", () => {
    expect(formatCountdown(3 * 86_400_000 + 5_000)).toBe("3D 00:00:05");
  });

  it("drops partial seconds and clamps negatives to zero", () => {
    expect(formatCountdown(1_999)).toBe("00:00:01");
    expect(formatCountdown(-10_000)).toBe("00:00:00");
  });
});

describe("nextSaturdayAt", () => {
  it("returns the coming Saturday at the given hour", () => {
    const wednesday = new Date(2026, 8, 16, 10, 0);
    const result = nextSaturdayAt(wednesday, 15);
    expect(result.getDay()).toBe(6);
    expect(result.getDate()).toBe(19);
    expect(result.getHours()).toBe(15);
  });

  it("rolls to next week once Saturday's slot has passed", () => {
    const saturdayEvening = new Date(2026, 8, 19, 18, 0);
    expect(nextSaturdayAt(saturdayEvening, 15).getDate()).toBe(26);
  });
});
