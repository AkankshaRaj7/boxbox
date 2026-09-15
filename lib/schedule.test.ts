import { describe, expect, it } from "vitest";
import {
  SESSION_NAMES,
  currentWeekend,
  nextSession,
  sessionEndsAt,
  upcomingSessions,
  type RaceWeekend,
  type SessionKind,
} from "./schedule";

function weekend(round: number, sessions: [SessionKind, string][]): RaceWeekend {
  const event = `Round ${round} GP`;
  return {
    season: "2026",
    round,
    event,
    circuitId: `c${round}`,
    circuitName: `Circuit ${round}`,
    locality: "Town",
    country: "Land",
    sessions: sessions.map(([kind, startsAt]) => ({ kind, name: SESSION_NAMES[kind], round, event, startsAt })),
  };
}

const baku = weekend(15, [
  ["fp1", "2026-09-24T08:30:00Z"],
  ["qualifying", "2026-09-25T12:00:00Z"],
  ["race", "2026-09-26T11:00:00Z"],
]);
const singapore = weekend(17, [
  ["sprint-qualifying", "2026-10-09T12:30:00Z"],
  ["race", "2026-10-11T12:00:00Z"],
]);
const calendar = [baku, singapore];
const at = (iso: string) => Date.parse(iso);

describe("sessionEndsAt", () => {
  it("adds the typical session length", () => {
    expect(sessionEndsAt(baku.sessions[2])).toBe(at("2026-09-26T13:00:00Z"));
    expect(sessionEndsAt(singapore.sessions[0])).toBe(at("2026-10-09T13:15:00Z"));
  });
});

describe("upcomingSessions", () => {
  it("drops finished sessions and flattens weekends in time order", () => {
    const names = upcomingSessions([singapore, baku], at("2026-09-25T00:00:00Z")).map((s) => `${s.round} ${s.kind}`);
    expect(names).toEqual(["15 qualifying", "15 race", "17 sprint-qualifying", "17 race"]);
  });

  it("is empty once the season is over", () => {
    expect(upcomingSessions(calendar, at("2026-12-31T00:00:00Z"))).toEqual([]);
  });
});

describe("nextSession", () => {
  const sessions = upcomingSessions(calendar, 0);

  it("keeps a session that is still running", () => {
    expect(nextSession(sessions, at("2026-09-26T12:30:00Z"))?.kind).toBe("race");
  });

  it("moves on once the session's typical length has passed", () => {
    expect(nextSession(sessions, at("2026-09-26T13:00:00Z"))).toMatchObject({ round: 17, kind: "sprint-qualifying" });
  });
});

describe("currentWeekend", () => {
  it("stays on a weekend until its race is over", () => {
    expect(currentWeekend(calendar, at("2026-09-26T12:59:00Z"))?.round).toBe(15);
    expect(currentWeekend(calendar, at("2026-09-26T13:00:00Z"))?.round).toBe(17);
  });

  it("is undefined after the final race", () => {
    expect(currentWeekend(calendar, at("2026-10-12T00:00:00Z"))).toBeUndefined();
  });
});
