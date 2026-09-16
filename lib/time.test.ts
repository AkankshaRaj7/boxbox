import { describe, expect, it } from "vitest";
import { formatAgo, formatCountdown, formatLapTime, formatUtcStamp, nextSaturdayAt } from "./time";

describe("formatAgo", () => {
  it("rounds down to the largest whole unit", () => {
    expect(formatAgo(59_000)).toBe("just now");
    expect(formatAgo(12 * 60_000 + 59_000)).toBe("12m ago");
    expect(formatAgo(3 * 3600_000 + 1)).toBe("3h ago");
    expect(formatAgo(2 * 86_400_000)).toBe("2d ago");
  });

  it("reads future times as just now", () => {
    expect(formatAgo(-5_000)).toBe("just now");
  });
});

describe("formatUtcStamp", () => {
  it("formats in UTC regardless of the machine's timezone", () => {
    expect(formatUtcStamp("2026-09-14T18:29:19.000Z")).toBe("14 Sep 18:29 UTC");
    expect(formatUtcStamp("2026-01-02T03:04:00+05:30")).toBe("1 Jan 21:34 UTC");
  });
});

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

describe("formatLapTime", () => {
  it("shows minutes, seconds and thousandths", () => {
    expect(formatLapTime(95.587)).toBe("1:35.587");
  });

  it("pads the seconds past a whole minute", () => {
    expect(formatLapTime(61.5)).toBe("1:01.500");
  });

  it("drops the minute when a lap is under one", () => {
    expect(formatLapTime(58.214)).toBe("58.214");
  });
});
