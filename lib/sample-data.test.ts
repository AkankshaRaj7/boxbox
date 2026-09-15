import { describe, expect, it } from "vitest";
import { DRIVERS, driverStandings } from "./sample-data";

describe("driverStandings", () => {
  it("orders drivers by points, highest first", () => {
    const rows = driverStandings();
    expect(rows).toHaveLength(DRIVERS.length);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].points).toBeGreaterThanOrEqual(rows[i].points);
    }
  });
});
