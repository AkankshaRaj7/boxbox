/**
 * The Briefing: a few lines of what matters today, written from data the site
 * already holds.
 *
 * Rules that keep it worth reading:
 *
 * - Every line is a fact, computed here. Nothing is written by a model, and
 *   nothing is invented.
 * - A line is only offered when its facts are solid, so a quiet day or a
 *   missing feed shortens the briefing instead of padding it with filler.
 * - Lines are ranked by interest, and the panel takes the first few. Synthesis
 *   the rest of the page can't show — the championship arithmetic, pace read
 *   against points — outranks anything already visible on another card.
 */
import { pointsRemaining } from "@/lib/championship";
import type { RankedTeam } from "@/lib/pace";
import type { Story } from "@/lib/news-model";
import type { RaceWeekend } from "@/lib/schedule";
import type { Standings } from "@/lib/standings";
import { teamInfo } from "@/lib/teams";
import { capitalise, count, ordinal, surname } from "@/lib/words";

/** How many lines the panel shows at most. */
export const BRIEFING_LINES = 4;

export type BriefingFacts = {
  standings: Standings | null;
  /** The season's full calendar, for the rounds and sprints still to come. */
  calendar: RaceWeekend[];
  pecking: RankedTeam[];
  stories: Story[];
};


const teamName = (constructorId: string, fallback = constructorId) => teamInfo(constructorId, fallback).name;

type Line = (facts: BriefingFacts) => string | null;

/** The championship is mathematically over. */
const titleDecided: Line = ({ standings, calendar }) => {
  const [leader, second] = standings?.drivers ?? [];
  if (!standings?.round || !leader || !second) {
    return null;
  }
  const { points, rounds } = pointsRemaining(calendar, standings.round);
  const lead = leader.points - second.points;
  if (rounds === 0 || lead <= points) {
    return null;
  }
  return `${surname(leader.name)} has the drivers' title: a lead of ${lead} points with only ${points} left to race for.`;
};

/** How the title race stands, against what is still available. */
const titleRace: Line = ({ standings, calendar }) => {
  const [leader, second] = standings?.drivers ?? [];
  if (!standings?.round || !leader || !second) {
    return null;
  }
  const { points, rounds } = pointsRemaining(calendar, standings.round);
  if (rounds === 0) {
    return null;
  }
  const lead = leader.points - second.points;
  if (lead === 0) {
    return `${surname(leader.name)} and ${surname(second.name)} are level on ${leader.points} points at the top, with ${points} still on the table.`;
  }
  return `${surname(leader.name)} leads ${surname(second.name)} by ${lead} points, with ${points} still on the table over ${count(rounds)} rounds.`;
};

/**
 * The quickest car is not the one leading the constructors'. The most
 * interesting thing the page can say, because no single card shows it.
 */
const paceAgainstPoints: Line = ({ standings, pecking }) => {
  const quickest = pecking[0];
  const leader = standings?.constructors?.[0];
  if (!quickest || !leader || quickest.constructorId === leader.id) {
    return null;
  }
  const theirPoints = standings.constructors.find((row) => row.id === quickest.constructorId);
  if (!theirPoints) {
    return null;
  }
  return `${teamName(quickest.constructorId)} have the quickest car of recent races but trail ${teamName(leader.id, leader.name)} by ${leader.points - theirPoints.points} points in the constructors'.`;
};

/** The constructors' championship at the top. */
const constructors: Line = ({ standings }) => {
  const [leader, second] = standings?.constructors ?? [];
  if (!standings?.round || !leader || !second) {
    return null;
  }
  const lead = leader.points - second.points;
  const first = teamName(leader.id, leader.name);
  const chaser = teamName(second.id, second.name);
  return lead === 0
    ? `${first} and ${chaser} are level on ${leader.points} points in the constructors'.`
    : `${first} lead the constructors' by ${lead} from ${chaser}.`;
};

/** Who has the quickest car, and by how much. */
const paceLeader: Line = ({ pecking }) => {
  const [quickest, second] = pecking;
  if (!quickest || !second) {
    return null;
  }
  return `${teamName(quickest.constructorId)} have the quickest car of the last five races, ${(second.gap - quickest.gap).toFixed(2)}% clear of ${teamName(second.constructorId)}.`;
};

/** The biggest climber in the pecking order. */
const climber: Line = ({ pecking }) => {
  const best = [...pecking].sort((a, b) => b.movement - a.movement)[0];
  if (!best || best.movement <= 0) {
    return null;
  }
  const places = best.movement === 1 ? "a place" : `${count(best.movement)} places`;
  return `${teamName(best.constructorId)} are the biggest climbers in the pecking order, up ${places} to ${ordinal(best.rank)}.`;
};

/** Stories several outlets broke in the last few hours. */
const breakingNews: Line = ({ stories }) => {
  const breaking = stories.filter((story) => story.breaking).length;
  if (breaking === 0) {
    return null;
  }
  return breaking === 1
    ? "One story is breaking across the wire right now."
    : `${capitalise(count(breaking))} stories are breaking across the wire right now.`;
};

/** Highest interest first; the panel takes the first `BRIEFING_LINES` that fire. */
const LINES: Line[] = [titleDecided, titleRace, paceAgainstPoints, constructors, paceLeader, climber, breakingNews];

/**
 * The briefing for right now: at most `BRIEFING_LINES` lines, fewer when there
 * is less to say. Empty before the season's first race.
 */
export function briefing(facts: BriefingFacts, limit = BRIEFING_LINES): string[] {
  const lines: string[] = [];
  for (const line of LINES) {
    const text = line(facts);
    if (text !== null) {
      lines.push(text);
    }
    if (lines.length === limit) {
      break;
    }
  }
  return lines;
}
