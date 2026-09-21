/**
 * Race control, reduced to incidents.
 *
 * The FIA posts one message per step: an incident is NOTED, then it goes UNDER
 * INVESTIGATION, then it is REVIEWED or a PENALTY is issued, then the penalty is
 * SERVED. Four lines for one event, and a reader scanning a log has to hold all
 * four in their head to learn what happened. Every message carries the
 * incident's own timestamp in brackets, so they can be joined back into one
 * entry with an outcome.
 *
 * Nothing here judges anyone: the outcome is whatever the stewards decided, and
 * the wording they used is carried through.
 */
import type { ControlNote } from "@/lib/race";

/** What the stewards settled on, worst first. */
export type Outcome = "penalty" | "investigating" | "no-action" | "noted";

export type Incident = {
  /** The lap it was first reported. */
  lap: number;
  /** Driver codes involved, in the order race control listed them. */
  drivers: string[];
  /** "Turn 5", when the message says where. */
  turn: string | null;
  /** The stewards' own description, e.g. "causing a collision". */
  reason: string | null;
  outcome: Outcome;
  /** The penalty in the stewards' words, e.g. "5 second time penalty". */
  penalty: string | null;
  /** Whether the penalty was served during the race. */
  served: boolean;
};

/** A driver warned for repeatedly exceeding track limits. */
export type Warning = { lap: number; driverCode: string; reason: string };

/** Lap times the stewards deleted, per driver. */
export type TrackLimits = { driverCode: string; deleted: number };

const TIMESTAMP = /\((\d{1,2}::?\d{2}::?\d{2})\)/;
const CODES = /\(([A-Z]{3})\)/g;
const TURN = /\bTURN (\d+)\b/i;
const PENALTY =
  /((?:\d+\s+)?(?:SECOND\s+)?(?:TIME\s+PENALTY|DRIVE\s+THROUGH(?:\s+PENALTY)?|STOP\s+AND\s+GO(?:\s+PENALTY)?|GRID\s+PENALTY|PENALTY\s+POINTS?))/i;

const has = (text: string, pattern: RegExp) => pattern.test(text);

/** Sentence case for the stewards' shouting: "CAUSING A COLLISION". */
function readable(value: string): string {
  const trimmed = value.trim().toLowerCase();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

/**
 * The reason clause: race control puts it after a dash, before the timestamp.
 * Returns null when the message carries no explanation.
 */
function reasonOf(message: string): string | null {
  const withoutTime = message.replace(TIMESTAMP, "").trim();
  const dash = withoutTime.split(/\s+-\s+/);
  if (dash.length < 2) {
    return null;
  }
  const tail = dash[dash.length - 1].trim();
  return tail.length > 2 && !/^\d/.test(tail) ? readable(tail) : null;
}

/**
 * Incidents, oldest first, each with everything the stewards said about it.
 *
 * Messages are joined on the timestamp race control stamps every step of one
 * incident with; anything without a timestamp stands alone.
 */
export function incidents(notes: ControlNote[]): Incident[] {
  const groups = new Map<string, ControlNote[]>();
  notes
    .filter((note) => /INCIDENT|PENALTY|UNDER INVESTIGATION/i.test(note.message))
    .forEach((note, index) => {
      // The timestamp is the reliable join, but race control omits it on some
      // messages — a driver's track-limits penalty arrives as three separate
      // stamp-less lines. Fall back to the driver and the offence, which merges
      // those three and still keeps "track limits" apart from "(5th offence)".
      const stamp = note.message.match(TIMESTAMP)?.[1];
      const codes = [...new Set([...note.message.matchAll(CODES)].map((match) => match[1]))].join("+");
      const key = stamp ?? (codes ? `${codes}|${reasonOf(note.message) ?? `solo-${index}`}` : `solo-${index}`);
      groups.set(key, [...(groups.get(key) ?? []), note]);
    });

  return [...groups.values()]
    .map((group) => {
      const all = group.map((note) => note.message).join(" \n ");
      const first = group[0];
      const penaltyText = all.match(PENALTY)?.[1];
      const penalised = has(all, /PENALTY/i) && !!penaltyText;
      const outcome: Outcome = penalised
        ? "penalty"
        : has(all, /NO FURTHER (INVESTIGATION|ACTION)/i)
          ? "no-action"
          : has(all, /UNDER INVESTIGATION/i)
            ? "investigating"
            : "noted";
      const drivers = [...new Set([...first.message.matchAll(CODES)].map((match) => match[1]))];
      return {
        lap: first.lap,
        drivers: drivers.length > 0 ? drivers : first.driverCode ? [first.driverCode] : [],
        turn: first.message.match(TURN) ? `Turn ${first.message.match(TURN)![1]}` : null,
        reason: reasonOf(first.message) ?? reasonOf(all.split(" \n ")[0]),
        outcome,
        penalty: penaltyText ? readable(penaltyText) : null,
        served: has(all, /PENALTY SERVED/i),
      };
    })
    .filter((incident) => incident.drivers.length > 0)
    .sort((a, b) => a.lap - b.lap);
}

/** Black-and-white flags: a warning, not a penalty. */
export function warnings(notes: ControlNote[]): Warning[] {
  return notes.flatMap((note) =>
    /BLACK AND WHITE/i.test(note.message) && note.driverCode
      ? [{ lap: note.lap, driverCode: note.driverCode, reason: reasonOf(note.message) ?? "Track limits" }]
      : [],
  );
}

/**
 * Track limits, counted per driver rather than listed.
 *
 * A quarter of all race-control messages are single deleted lap times. As a
 * list they push everything that matters off the screen; as a count they say
 * the same thing in one line.
 */
export function trackLimits(notes: ControlNote[]): TrackLimits[] {
  const counted = new Map<string, number>();
  for (const note of notes) {
    if (/TRACK LIMITS/i.test(note.message) && /DELETED/i.test(note.message) && note.driverCode) {
      counted.set(note.driverCode, (counted.get(note.driverCode) ?? 0) + 1);
    }
  }
  return [...counted]
    .map(([driverCode, deleted]) => ({ driverCode, deleted }))
    .sort((a, b) => b.deleted - a.deleted || a.driverCode.localeCompare(b.driverCode));
}
