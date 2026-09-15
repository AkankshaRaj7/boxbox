import { describe, expect, it } from "vitest";
import { DRIVERS, constructorStandings, driverStandings } from "./sample-data";

describe("driverStandings", () => {
  it("orders drivers by points, highest first", () => {
    const rows = driverStandings();
    expect(rows).toHaveLength(DRIVERS.length);
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i - 1].points).toBeGreaterThanOrEqual(rows[i].points);
    }
  });
});

describe("constructorStandings", () => {
  it("sums each team's drivers and orders teams by total", () => {
    const rows = constructorStandings([
      { code: "AAA", name: "A", team: "aurora", points: 10 },
      { code: "BBB", name: "B", team: "vortex", points: 25 },
      { code: "CCC", name: "C", team: "aurora", points: 20 },
    ]);
    expect(rows.map((r) => [r.id, r.points])).toEqual([
      ["aurora", 30],
      ["vortex", 25],
    ]);
  });

  it("keeps every point from the driver table", () => {
    const driverTotal = DRIVERS.reduce((sum, d) => sum + d.points, 0);
    const teamTotal = constructorStandings().reduce((sum, t) => sum + t.points, 0);
    expect(teamTotal).toBe(driverTotal);
  });
});
