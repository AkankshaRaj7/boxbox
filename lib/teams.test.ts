import { describe, expect, it } from "vitest";
import { contrastRatio, readableOn } from "./color";
import { FALLBACK_TEAM_COLOR, TEAMS_2026, teamInfo } from "./teams";

describe("TEAMS_2026", () => {
  it("has a valid colour and a unique three-letter code for every team", () => {
    const teams = Object.values(TEAMS_2026);
    for (const team of teams) {
      expect(team.color).toMatch(/^#[0-9a-f]{6}$/);
      expect(team.code).toMatch(/^[A-Z]{3}$/);
      expect(() => readableOn(team.color)).not.toThrow();
    }
    expect(new Set(teams.map((t) => t.code)).size).toBe(teams.length);
  });

  it.each([
    ["ferrari", "audi"],
    ["cadillac", "haas"],
  ])("keeps %s and %s far enough apart in lightness to tell apart", (a, b) => {
    expect(contrastRatio(TEAMS_2026[a].color, TEAMS_2026[b].color)).toBeGreaterThanOrEqual(1.3);
  });

  it("keeps every livery bar at least 3:1 against the page", () => {
    for (const team of Object.values(TEAMS_2026)) {
      expect(contrastRatio(team.color, "#0a0a0d")).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("teamInfo", () => {
  it("returns known teams by constructorId", () => {
    expect(teamInfo("mclaren", "McLaren")).toBe(TEAMS_2026.mclaren);
  });

  it("builds a fallback from the API name", () => {
    expect(teamInfo("x", "St. Ives Racing")).toEqual({ code: "STI", name: "St. Ives Racing", color: FALLBACK_TEAM_COLOR });
  });
});
