/**
 * Circuit layouts and lengths from bacinger/f1-circuits (MIT, see
 * data/circuits.LICENSE.md), keyed by Jolpica-F1 circuitId. Regenerate the
 * data with `npm run data:circuits`.
 */
import data from "@/data/circuits.json";

type CircuitSource = { sourceId: string; name: string; lengthM: number; coordinates: number[][] };

const CIRCUITS: Record<string, CircuitSource> = data;

/** Length of an outline's longer side, in SVG user units. */
export const OUTLINE_SIZE = 1000;
const OUTLINE_PADDING = 40;

export type Outline = {
  d: string;
  viewBox: string;
  /**
   * Start/finish line position for a chequered marker. Omitted for real
   * layouts: the source data doesn't say where the line is.
   */
  start?: { x: number; y: number };
};

export type CircuitInfo = { name: string; lengthKm: number; laps: number; outline: Outline };

const round1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Projects [lon, lat] points to a north-up SVG path. An equirectangular
 * projection around the mean latitude is accurate to well under 1% across a
 * few kilometres of track.
 */
export function projectOutline(coordinates: number[][]): Outline {
  const meanLat = coordinates.reduce((sum, [, lat]) => sum + lat, 0) / coordinates.length;
  const lonScale = Math.cos((meanLat * Math.PI) / 180);
  const points = coordinates.map(([lon, lat]) => [lon * lonScale, -lat]);
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const [minX, minY] = [Math.min(...xs), Math.min(...ys)];
  const [width, height] = [Math.max(...xs) - minX, Math.max(...ys) - minY];
  const scale = OUTLINE_SIZE / Math.max(width, height);
  const scaled = points.map(([x, y]) => [round1((x - minX) * scale), round1((y - minY) * scale)]);

  return {
    d: `M${scaled.map(([x, y]) => `${x} ${y}`).join(" L")} Z`,
    viewBox: [
      -OUTLINE_PADDING,
      -OUTLINE_PADDING,
      round1(width * scale) + 2 * OUTLINE_PADDING,
      round1(height * scale) + 2 * OUTLINE_PADDING,
    ].join(" "),
  };
}

/** Scheduled race laps: the fewest laps covering more than 305 km (260 km at Monaco). */
export function scheduledLaps(circuitId: string, lengthM: number): number {
  const distanceM = circuitId === "monaco" ? 260_000 : 305_000;
  return Math.floor(distanceM / lengthM) + 1;
}

/** Layout, length and scheduled laps for a circuit, or null if we have no data for it. */
export function circuitInfo(circuitId: string): CircuitInfo | null {
  const circuit = CIRCUITS[circuitId];
  if (!circuit) {
    return null;
  }
  return {
    name: circuit.name,
    lengthKm: circuit.lengthM / 1000,
    laps: scheduledLaps(circuitId, circuit.lengthM),
    outline: projectOutline(circuit.coordinates),
  };
}
