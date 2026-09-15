/**
 * Fictional sample data for the Phase 0 design mockups.
 *
 * Every team, driver, headline and number here is invented so the mockups can
 * never be mistaken for real standings or real transfer news. Phase 1 replaces
 * this module with data ingested from Jolpica-F1, OpenF1 and RSS feeds.
 */
import type { RumorStatus } from "@/lib/credibility";
import { nextSaturdayAt } from "@/lib/time";

export type SampleTeam = { id: string; name: string; color: string };

export const TEAMS = {
  aurora: { id: "aurora", name: "Aurora Racing", color: "#ff8000" },
  vortex: { id: "vortex", name: "Vortex GP", color: "#27f4d2" },
  rosso: { id: "rosso", name: "Rosso Corse", color: "#e8002d" },
  azure: { id: "azure", name: "Azure Motorsport", color: "#1e3a8a" },
  verde: { id: "verde", name: "Verde Racing", color: "#229971" },
  nimbus: { id: "nimbus", name: "Nimbus Racing", color: "#64c4ff" },
} satisfies Record<string, SampleTeam>;

export type SampleTeamId = keyof typeof TEAMS;

export type SampleDriver = {
  code: string;
  name: string;
  team: SampleTeamId;
  points: number;
};

export const DRIVERS: SampleDriver[] = [
  { code: "ALV", name: "Rafa Alves", team: "aurora", points: 287 },
  { code: "BRK", name: "Tom Brook", team: "vortex", points: 275 },
  { code: "COS", name: "Luca Costa", team: "rosso", points: 256 },
  { code: "DAN", name: "Mika Danner", team: "aurora", points: 241 },
  { code: "EKO", name: "Sam Ekow", team: "azure", points: 198 },
  { code: "FIN", name: "Noah Finch", team: "vortex", points: 176 },
  { code: "GAR", name: "Diego Garza", team: "rosso", points: 163 },
  { code: "HOL", name: "Ben Holm", team: "verde", points: 97 },
  { code: "IVE", name: "Ari Iversen", team: "azure", points: 88 },
  { code: "ORT", name: "Kai Ortega", team: "nimbus", points: 54 },
];

/** A row in a standings table, already ordered. */
export type StandingRow = {
  id: string;
  code: string;
  name: string;
  color: string;
  points: number;
};

/** Driver standings, highest points first. */
export function driverStandings(drivers: SampleDriver[] = DRIVERS): StandingRow[] {
  return [...drivers]
    .sort((a, b) => b.points - a.points)
    .map((d) => ({
      id: d.code,
      code: d.code,
      name: d.name,
      color: TEAMS[d.team].color,
      points: d.points,
    }));
}

/** Constructor standings: each team's drivers' points summed, highest first. */
export function constructorStandings(drivers: SampleDriver[] = DRIVERS): StandingRow[] {
  const totals = new Map<SampleTeamId, number>();
  for (const d of drivers) {
    totals.set(d.team, (totals.get(d.team) ?? 0) + d.points);
  }
  return [...totals.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([id, points]) => ({
      id,
      code: TEAMS[id].name.slice(0, 3).toUpperCase(),
      name: TEAMS[id].name,
      color: TEAMS[id].color,
      points,
    }));
}

export const NEXT_SESSION = {
  session: "Qualifying",
  event: "Sample Grand Prix",
  round: 14,
  startsAt: nextSaturdayAt(new Date(), 15).toISOString(),
};

export const CIRCUIT = {
  name: "Sample Street Circuit",
  lengthKm: 5.1,
  laps: 58,
  drsZones: 2,
  lastWinner: "ALV",
};

export const BRIEFING = [
  "Copy. ALV leads BRK by 12 points heading into Round 14.",
  "Box this lap: 3 new driver-market rumors, 1 upgraded to Strong.",
  "Rosso Corse brings a new floor — long-run pace up 0.2% in FP2.",
  "Rain risk 40% for qualifying. Inters on standby.",
];

export type SourceTier = "official" | "tier1" | "rumor";
export type Flag = "green" | "yellow" | "red" | "blue";

export type SampleStory = {
  id: string;
  headline: string;
  summary: string;
  source: string;
  tier: SourceTier;
  outlets: number;
  flag: Flag;
  tag: string;
  minutesAgo: number;
};

export const STORIES: SampleStory[] = [
  {
    id: "s1",
    headline: "Aurora confirm heavy upgrade package for the Sample GP",
    summary: "New sidepods and a revised beam wing aimed at high-speed corners.",
    source: "Sample Wire",
    tier: "official",
    outlets: 6,
    flag: "red",
    tag: "Breaking",
    minutesAgo: 12,
  },
  {
    id: "s2",
    headline: "Why Vortex's straight-line speed has disappeared since the summer",
    summary: "A deep dive into drag levels and the team's new cooling layout.",
    source: "Paddock Journal",
    tier: "tier1",
    outlets: 3,
    flag: "blue",
    tag: "Technical",
    minutesAgo: 47,
  },
  {
    id: "s3",
    headline: "Ortega linked with Rosso Corse seat for next season",
    summary: "Talks reported to have started after the summer break.",
    source: "Grid Gossip",
    tier: "rumor",
    outlets: 4,
    flag: "yellow",
    tag: "Transfers",
    minutesAgo: 95,
  },
];

export type SampleRumor = {
  driver: string;
  fromTeam: SampleTeamId;
  toTeam: SampleTeamId;
  status: RumorStatus;
  outlets: number;
};

export const HOT_RUMOR: SampleRumor = {
  driver: "Kai Ortega",
  fromTeam: "nimbus",
  toTeam: "rosso",
  status: "linked",
  outlets: 4,
};

export type SampleRumorCard = SampleRumor & { id: string };

export const RUMORS: SampleRumorCard[] = [
  { id: "r1", ...HOT_RUMOR },
  { id: "r2", driver: "Ben Holm", fromTeam: "verde", toTeam: "azure", status: "whisper", outlets: 1 },
  { id: "r3", driver: "Noah Finch", fromTeam: "vortex", toTeam: "vortex", status: "strong", outlets: 7 },
  { id: "r4", driver: "Ari Iversen", fromTeam: "azure", toTeam: "nimbus", status: "signed", outlets: 9 },
];

export type SamplePowerRank = {
  team: SampleTeamId;
  rank: number;
  /** Places gained (+) or lost (−) since last week. */
  movement: number;
  /** Gap to the fastest car, % — one value per round, oldest first. */
  trend: number[];
};

export const POWER_RANKING: SamplePowerRank[] = [
  { team: "aurora", rank: 1, movement: 0, trend: [0.4, 0.3, 0.1, 0.0, 0.0, 0.1, 0.0, 0.0] },
  { team: "rosso", rank: 2, movement: 2, trend: [0.9, 0.8, 0.7, 0.5, 0.4, 0.3, 0.2, 0.1] },
  { team: "vortex", rank: 3, movement: -1, trend: [0.0, 0.1, 0.2, 0.2, 0.3, 0.3, 0.4, 0.3] },
  { team: "azure", rank: 4, movement: -1, trend: [0.3, 0.2, 0.4, 0.5, 0.6, 0.5, 0.6, 0.7] },
  { team: "verde", rank: 5, movement: 0, trend: [1.2, 1.1, 1.1, 1.0, 1.0, 0.9, 1.0, 0.9] },
];

export type SeatStatus = "confirmed" | "likely" | "open";

export type SampleSeat = { driver: string | null; status: SeatStatus; contractEnds?: number };

export const SEATS: { team: SampleTeamId; seats: [SampleSeat, SampleSeat] }[] = [
  {
    team: "aurora",
    seats: [
      { driver: "ALV", status: "confirmed", contractEnds: 2029 },
      { driver: "DAN", status: "confirmed", contractEnds: 2028 },
    ],
  },
  {
    team: "rosso",
    seats: [
      { driver: "COS", status: "confirmed", contractEnds: 2028 },
      { driver: "ORT", status: "likely" },
    ],
  },
  {
    team: "vortex",
    seats: [
      { driver: "BRK", status: "confirmed", contractEnds: 2027 },
      { driver: "FIN", status: "likely" },
    ],
  },
  {
    team: "nimbus",
    seats: [
      { driver: "IVE", status: "confirmed", contractEnds: 2029 },
      { driver: null, status: "open" },
    ],
  },
];

export type SampleSector = { label: string; time: string; kind: "fastest" | "pb" | "slower" };

export const SAMPLE_LAP: { driver: string; lap: string; sectors: SampleSector[] } = {
  driver: "ALV",
  lap: "1:18.214",
  sectors: [
    { label: "S1", time: "24.881", kind: "fastest" },
    { label: "S2", time: "28.402", kind: "pb" },
    { label: "S3", time: "24.931", kind: "slower" },
  ],
};

export const PREDICTION_SLIP = {
  event: "Sample Grand Prix",
  locksAt: "Qualifying start",
  picks: [
    { label: "Pole", pick: "COS" },
    { label: "P1", pick: "ALV" },
    { label: "P2", pick: "BRK" },
    { label: "P3", pick: "COS" },
    { label: "Driver of the Day", pick: "ORT" },
  ],
  boldCall: "Safety car in the first 5 laps",
};

export const PLAYER = {
  streak: 5,
  points: 412,
  leagueRank: 3,
  leagueName: "Office Pit Crew",
  badges: ["Nostradamus", "Perfect Podium", "Rain Master"],
};
