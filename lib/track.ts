/**
 * What a circuit's shape can honestly be measured from its outline.
 *
 * The committed geometry (data/circuits.json, from f1-circuits) samples a lap
 * every 40–50 metres, which is too coarse for some things and fine for others.
 * Two measurements were tried and thrown away:
 *
 * - **Corner counts.** Detection matched Monaco exactly (19) and Suzuka within
 *   one, but gave Baku 11 against an official 20 — the castle section's tight
 *   turns fall between samples. A number that is 45% wrong on one circuit is
 *   not publishable, so this file does not count corners.
 * - **Longest straight.** Baku measured 1,068 m against a real ~2,200 m and Spa
 *   757 m against ~1,900 m, because a gentle kink ends the run.
 *
 * What survives is `degreesPerKm`: the total change of direction over a lap,
 * divided by its length. It is an integral of curvature, so it does not care
 * how finely the lap was sampled — the same answer falls out of 60 points or
 * 600. It sorts the calendar the way a fan would: Monaco far out in front,
 * Monza at the back.
 */
import data from "@/data/circuits.json";

type CircuitSource = { sourceId: string; name: string; lengthM: number; coordinates: number[][] };
const CIRCUITS: Record<string, CircuitSource> = data;

/** Metres per degree of latitude; longitude shrinks towards the poles. */
const LAT_M = 110_540;
const LON_M = 111_320;

/** Local flat projection, good enough across a few kilometres. */
function toMetres(coordinates: number[][]): [number, number][] {
  const meanLat = coordinates.reduce((sum, [, lat]) => sum + lat, 0) / coordinates.length;
  const k = Math.cos((meanLat * Math.PI) / 180);
  return coordinates.map(([lon, lat]) => [lon * LON_M * k, lat * LAT_M]);
}

/**
 * An angle wrapped into −π…π.
 *
 * JavaScript's `%` is a remainder, not a modulo: it keeps the sign of the left
 * operand, so the usual `(a + PI) % (2 * PI) - PI` returns a value outside the
 * range whenever `a + PI` is negative, and every such turn is overstated. That
 * bug put Monaco at 797°/km instead of 693.
 */
function wrap(angle: number): number {
  const shifted = (angle + Math.PI) % (2 * Math.PI);
  return (shifted < 0 ? shifted + 2 * Math.PI : shifted) - Math.PI;
}

/** Signed turn at each vertex, in radians, around a closed loop. */
function turns(points: [number, number][]): number[] {
  const heading = points.map(([x1, y1], i) => {
    const [x2, y2] = points[(i + 1) % points.length];
    return Math.atan2(y2 - y1, x2 - x1);
  });
  return heading.map((current, i) => {
    const previous = heading[(i - 1 + heading.length) % heading.length];
    return wrap(current - previous);
  });
}

/**
 * How much a lap turns, in degrees per kilometre.
 *
 * Monaco is around 690, Monza around 200. Null when the outline is too short
 * to measure.
 */
export function degreesPerKm(coordinates: number[][], lengthM: number): number | null {
  if (coordinates.length < 8 || lengthM <= 0) {
    return null;
  }
  const total = turns(toMetres(coordinates)).reduce((sum, turn) => sum + Math.abs(turn), 0);
  return (total * 180) / Math.PI / (lengthM / 1000);
}

export type TrackCharacter = {
  degreesPerKm: number;
  /** Place on this calendar, 1 being the twistiest. */
  rank: number;
  /** How many circuits it was ranked against. */
  of: number;
  /**
   * Where it places among the calendar's laps: 1 for the twistiest, 0 for the
   * most flowing. A rank, not a ratio of the raw figure — Monaco is such an
   * outlier (693°/km against 432 for the next) that scaling by value squashed
   * everything else into one band and left "Twisty" unused, with Hungaroring
   * reading "Mixed" at 417°/km. The magnitude is still on the page as the
   * degrees-per-kilometre figure itself.
   */
  share: number;
};

/**
 * Where a circuit sits among a given calendar's tracks.
 *
 * Relative, never absolute: "the fourth twistiest lap of the season" is a claim
 * the geometry supports, where "14 corners" is not.
 */
export function trackCharacter(circuitId: string, calendarIds: string[]): TrackCharacter | null {
  const measured = calendarIds
    .flatMap((id) => {
      const circuit = CIRCUITS[id];
      const value = circuit ? degreesPerKm(circuit.coordinates, circuit.lengthM) : null;
      return value === null ? [] : [{ id, value }];
    })
    .sort((a, b) => b.value - a.value);

  const index = measured.findIndex((entry) => entry.id === circuitId);
  if (index === -1) {
    return null;
  }
  return {
    degreesPerKm: measured[index].value,
    rank: index + 1,
    of: measured.length,
    share: measured.length === 1 ? 0.5 : (measured.length - 1 - index) / (measured.length - 1),
  };
}

/** A plain reading of where a lap sits between flowing and twisty. */
export function characterLabel(share: number): string {
  if (share >= 0.8) return "Very twisty";
  if (share >= 0.55) return "Twisty";
  if (share >= 0.3) return "Mixed";
  if (share >= 0.15) return "Flowing";
  return "Very fast";
}
