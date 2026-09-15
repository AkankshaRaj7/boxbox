import { describe, expect, it } from "vitest";
import { readableOn } from "./color";
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
});

describe("teamInfo", () => {
  it("returns known teams by constructorId", () => {
    expect(teamInfo("mclaren", "McLaren")).toBe(TEAMS_2026.mclaren);
  });

  it("builds a fallback from the API name", () => {
    expect(teamInfo("x", "St. Ives Racing")).toEqual({ code: "STI", name: "St. Ives Racing", color: FALLBACK_TEAM_COLOR });
  });
});
