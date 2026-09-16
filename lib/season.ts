/**
 * A season's race, sprint and qualifying classifications, and the driver and
 * team figures derived from them: stats, recent form, team spells and teammate
 * head-to-heads. Pure functions over data parsed in `lib/jolpica.ts`.
 */
import { teamInfo, type TeamInfo } from "@/lib/teams";

export type DriverBio = {
  /** Jolpica `driverId`, stable across seasons. */
  id: string;
  code: string;
  givenName: string;
  familyName: string;
  /** Race number from the driver's latest classification. */
  number: string | null;
  nationality: string | null;
  /** ISO date, e.g. "1998-02-15". */
  dateOfBirth: string | null;
};

export type RoundInfo = { round: number; event: string; date: string; circuitId: string };

/** One driver's result in a race or sprint. */
export type Classification = {
  round: number;
  driverId: string;
  constructorId: string;
  /** Finishing order, including retirements; Jolpica orders everyone. */
  position: number;
  /** "1"…"22", or R retired, W did not start, D disqualified, E excluded, N not classified, F failed to qualify. */
  positionText: string;
  status: string;
  /** Starting position: 0 for a pit-lane start, null when unknown. */
  grid: number | null;
  points: number;
};

export type QualifyingRow = { round: number; driverId: string; constructorId: string; position: number };

export type SeasonResults = {
  season: string;
  /** Rounds with a race result, in order. */
  rounds: RoundInfo[];
  drivers: DriverBio[];
  /** Constructors with Jolpica's registered names, for `teamInfo` fallbacks. */
  teams: { id: string; name: string }[];
  races: Classification[];
  sprints: Classification[];
  qualifying: QualifyingRow[];
};

const OUT_LABELS: Record<string, string> = { R: "DNF", W: "DNS", D: "DSQ", E: "EX", N: "NC", F: "DNQ" };

/** Broadcast label for a result: "P3", or DNF / DNS / DSQ / EX / NC / DNQ. */
export function finishLabel(c: Pick<Classification, "positionText" | "position">): string {
  return /^\d+$/.test(c.positionText) ? `P${c.positionText}` : (OUT_LABELS[c.positionText] ?? `P${c.position}`);
}

/** Whether the driver took the start. */
export function started(c: Pick<Classification, "positionText" | "status">): boolean {
  return c.positionText !== "W" && c.status !== "Did not start";
}

/** Whether the driver was classified at the finish. */
export function classified(c: Pick<Classification, "positionText">): boolean {
  return /^\d+$/.test(c.positionText);
}

export type FormKind = "win" | "podium" | "points" | "finish" | "out";

/** Visual weight of a result; the chip always carries its text label too. */
export function formKind(c: Classification): FormKind {
  if (!classified(c)) return "out";
  if (c.position === 1) return "win";
  if (c.position <= 3) return "podium";
  return c.points > 0 ? "points" : "finish";
}

export type FormEntry = { round: number; label: string; kind: FormKind };

const byRound = <T extends { round: number }>(a: T, b: T) => a.round - b.round;

/** A driver's race results, oldest first. */
export function driverRaces(season: SeasonResults, driverId: string): Classification[] {
  return season.races.filter((r) => r.driverId === driverId).sort(byRound);
}

/** The driver's last `count` Grand Prix results, oldest first. */
export function recentForm(season: SeasonResults, driverId: string, count = 5): FormEntry[] {
  return driverRaces(season, driverId)
    .slice(-count)
    .map((r) => ({ round: r.round, label: finishLabel(r), kind: formKind(r) }));
}

export type DriverStats = {
  starts: number;
  wins: number;
  podiums: number;
  /** Grand Prix poles (qualifying P1). */
  poles: number;
  /** Starts that ended unclassified. */
  dnfs: number;
  /** Best Grand Prix finish, or null before a classified finish. */
  bestFinish: number | null;
  /** Race plus sprint points from the results; standings are authoritative for totals. */
  points: number;
};

export function driverStats(season: SeasonResults, driverId: string): DriverStats {
  const races = driverRaces(season, driverId);
  const finishes = races.filter(classified).map((r) => r.position);
  const sprintPoints = season.sprints.filter((s) => s.driverId === driverId).reduce((sum, s) => sum + s.points, 0);
  return {
    starts: races.filter(started).length,
    wins: finishes.filter((p) => p === 1).length,
    podiums: finishes.filter((p) => p <= 3).length,
    poles: season.qualifying.filter((q) => q.driverId === driverId && q.position === 1).length,
    dnfs: races.filter((r) => started(r) && !classified(r)).length,
    bestFinish: finishes.length ? Math.min(...finishes) : null,
    points: races.reduce((sum, r) => sum + r.points, 0) + sprintPoints,
  };
}

export type TeamSpell = { constructorId: string; from: number; to: number; rounds: number[] };

/** The teams a driver raced for, in order, merging consecutive rounds with the same team. */
export function teamSpells(season: SeasonResults, driverId: string): TeamSpell[] {
  const spells: TeamSpell[] = [];
  for (const race of driverRaces(season, driverId)) {
    const last = spells.at(-1);
    if (last?.constructorId === race.constructorId) {
      last.to = race.round;
      last.rounds.push(race.round);
    } else {
      spells.push({ constructorId: race.constructorId, from: race.round, to: race.round, rounds: [race.round] });
    }
  }
  return spells;
}

export type HeadToHead = {
  constructorId: string;
  /** [driver, teammate] ids; every tally below is in the same order. */
  drivers: [string, string];
  /** Rounds both raced for `constructorId`. */
  rounds: number[];
  /** Qualifying: rounds where both set a qualifying position. */
  qualifying: [number, number];
  /** Race finishing order, retirements included; rounds where either didn't start are left out. */
  race: [number, number];
  /** Race plus sprint points scored in the shared rounds. */
  points: [number, number];
};

/**
 * Head-to-head between two drivers, counting only rounds they raced for the
 * same team, so a mid-season swap never pits a driver against a former rival.
 */
export function headToHead(season: SeasonResults, driverId: string, teammateId: string, constructorId: string): HeadToHead {
  const inTeam = (id: string) =>
    new Map(season.races.filter((r) => r.driverId === id && r.constructorId === constructorId).map((r) => [r.round, r]));
  const mine = inTeam(driverId);
  const theirs = inTeam(teammateId);
  const rounds = [...mine.keys()].filter((round) => theirs.has(round)).sort((a, b) => a - b);
  const shared = new Set(rounds);

  const tally: Pick<HeadToHead, "qualifying" | "race" | "points"> = { qualifying: [0, 0], race: [0, 0], points: [0, 0] };
  const score = (key: "qualifying" | "race", a: number, b: number) => {
    if (a < b) tally[key][0]++;
    else if (b < a) tally[key][1]++;
  };

  for (const round of rounds) {
    const a = mine.get(round)!;
    const b = theirs.get(round)!;
    const qa = season.qualifying.find((q) => q.round === round && q.driverId === driverId);
    const qb = season.qualifying.find((q) => q.round === round && q.driverId === teammateId);
    if (qa && qb) score("qualifying", qa.position, qb.position);
    if (started(a) && started(b)) score("race", a.position, b.position);
    tally.points[0] += a.points;
    tally.points[1] += b.points;
  }
  for (const s of season.sprints) {
    if (!shared.has(s.round) || s.constructorId !== constructorId) continue;
    if (s.driverId === driverId) tally.points[0] += s.points;
    if (s.driverId === teammateId) tally.points[1] += s.points;
  }
  return { constructorId, drivers: [driverId, teammateId], rounds, ...tally };
}

/** Every teammate a driver shared a car with this season, in the order they were paired. */
export function teammateHeadToHeads(season: SeasonResults, driverId: string): HeadToHead[] {
  const pairs: HeadToHead[] = [];
  for (const spell of teamSpells(season, driverId)) {
    const rounds = new Set(spell.rounds);
    const mates = [
      ...new Set(
        season.races
          .filter((r) => r.constructorId === spell.constructorId && r.driverId !== driverId && rounds.has(r.round))
          .sort(byRound)
          .map((r) => r.driverId),
      ),
    ];
    for (const mate of mates) {
      const h2h = headToHead(season, driverId, mate, spell.constructorId);
      if (!pairs.some((p) => p.constructorId === h2h.constructorId && p.drivers[1] === mate)) pairs.push(h2h);
    }
  }
  return pairs;
}

export type RosterEntry = { driverId: string; rounds: number[]; points: number };

/**
 * Everyone who raced for a team this season with the points they scored for
 * it. The latest line-up comes first, then by points.
 */
export function teamRoster(season: SeasonResults, constructorId: string): RosterEntry[] {
  const entries = new Map<string, RosterEntry>();
  for (const r of season.races.filter((r) => r.constructorId === constructorId).sort(byRound)) {
    const entry = entries.get(r.driverId) ?? { driverId: r.driverId, rounds: [], points: 0 };
    entry.rounds.push(r.round);
    entry.points += r.points;
    entries.set(r.driverId, entry);
  }
  for (const s of season.sprints) {
    const entry = s.constructorId === constructorId ? entries.get(s.driverId) : undefined;
    if (entry) entry.points += s.points;
  }
  return [...entries.values()].sort((a, b) => (b.rounds.at(-1) ?? 0) - (a.rounds.at(-1) ?? 0) || b.points - a.points);
}

/** Head-to-heads for every pair of drivers who shared the team's cars, in the order they were paired. */
export function teamHeadToHeads(season: SeasonResults, constructorId: string): HeadToHead[] {
  const roster = teamRoster(season, constructorId)
    .slice()
    .sort((a, b) => a.rounds[0] - b.rounds[0] || b.points - a.points);
  const pairs: HeadToHead[] = [];
  roster.forEach((a, i) => {
    for (const b of roster.slice(i + 1)) {
      const h2h = headToHead(season, a.driverId, b.driverId, constructorId);
      if (h2h.rounds.length > 0) pairs.push(h2h);
    }
  });
  return pairs.sort((a, b) => a.rounds[0] - b.rounds[0]);
}

export type TeamStats = { wins: number; podiums: number; poles: number; bestFinish: number | null; points: number };

export function teamStats(season: SeasonResults, constructorId: string): TeamStats {
  const races = season.races.filter((r) => r.constructorId === constructorId);
  const finishes = races.filter(classified).map((r) => r.position);
  const sprintPoints = season.sprints
    .filter((s) => s.constructorId === constructorId)
    .reduce((sum, s) => sum + s.points, 0);
  return {
    wins: finishes.filter((p) => p === 1).length,
    podiums: finishes.filter((p) => p <= 3).length,
    poles: season.qualifying.filter((q) => q.constructorId === constructorId && q.position === 1).length,
    bestFinish: finishes.length ? Math.min(...finishes) : null,
    points: races.reduce((sum, r) => sum + r.points, 0) + sprintPoints,
  };
}

/** A driver's weekend: qualifying, sprint and Grand Prix, for the season table. */
export type WeekendRow = {
  round: number;
  event: string;
  constructorId: string;
  qualifying: number | null;
  sprint: Classification | null;
  race: Classification;
  /** Race plus sprint points. */
  points: number;
};

export function driverWeekends(season: SeasonResults, driverId: string): WeekendRow[] {
  return driverRaces(season, driverId).map((race) => {
    const sprint = season.sprints.find((s) => s.round === race.round && s.driverId === driverId) ?? null;
    return {
      round: race.round,
      event: season.rounds.find((r) => r.round === race.round)?.event ?? `Round ${race.round}`,
      constructorId: race.constructorId,
      qualifying: season.qualifying.find((q) => q.round === race.round && q.driverId === driverId)?.position ?? null,
      sprint,
      race,
      points: race.points + (sprint?.points ?? 0),
    };
  });
}

export type TeamWeekend = { round: number; event: string; results: Classification[]; points: number };

/** A team's Grand Prix results per round, best finish first, with race plus sprint points. */
export function teamWeekends(season: SeasonResults, constructorId: string): TeamWeekend[] {
  return season.rounds.flatMap(({ round, event }) => {
    const results = season.races
      .filter((r) => r.round === round && r.constructorId === constructorId)
      .sort((a, b) => a.position - b.position);
    if (results.length === 0) return [];
    const sprintPoints = season.sprints
      .filter((s) => s.round === round && s.constructorId === constructorId)
      .reduce((sum, s) => sum + s.points, 0);
    return [{ round, event, results, points: results.reduce((sum, r) => sum + r.points, 0) + sprintPoints }];
  });
}

/** Presentation data for a constructor in this season's results. */
export function teamOf(season: SeasonResults, constructorId: string): TeamInfo {
  return teamInfo(constructorId, season.teams.find((t) => t.id === constructorId)?.name ?? constructorId);
}

/** The driver with this code, case-insensitively; codes are unique within a season. */
export function findDriverByCode(season: SeasonResults, code: string): DriverBio | undefined {
  const wanted = code.toUpperCase();
  return season.drivers.find((d) => d.code.toUpperCase() === wanted);
}

/** Whole years between an ISO birth date and `now`, in UTC. */
export function ageOn(dateOfBirth: string, now: number): number {
  const born = new Date(`${dateOfBirth}T00:00:00Z`);
  const today = new Date(now);
  const hadBirthday =
    today.getUTCMonth() > born.getUTCMonth() ||
    (today.getUTCMonth() === born.getUTCMonth() && today.getUTCDate() >= born.getUTCDate());
  return today.getUTCFullYear() - born.getUTCFullYear() - (hadBirthday ? 0 : 1);
}

/** "R5" for one round, "R1–R11" for a run. */
export function roundSpan(rounds: number[]): string {
  if (rounds.length === 0) return "—";
  const first = rounds[0];
  const last = rounds.at(-1)!;
  return first === last ? `R${first}` : `R${first}–R${last}`;
}

/** Site paths for driver and team pages. */
export const driverHref = (code: string) => `/drivers/${code.toLowerCase()}`;
export const teamHref = (constructorId: string) => `/teams/${constructorId}`;
