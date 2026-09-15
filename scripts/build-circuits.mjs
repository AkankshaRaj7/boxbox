/**
 * Builds data/circuits.json from bacinger/f1-circuits (MIT), keyed by
 * Jolpica-F1 circuitId. Run `npm run data:circuits` when the calendar gains a
 * new venue; the output is committed, so the site makes no extra requests.
 *
 * Each GeoJSON track is matched to the Jolpica circuit whose listed location is
 * nearest the track's first point, within MAX_MATCH_KM.
 */
import { mkdir, writeFile } from "node:fs/promises";

const SOURCE = "https://raw.githubusercontent.com/bacinger/f1-circuits/master";
const JOLPICA_CIRCUITS = "https://api.jolpi.ca/ergast/f1/circuits/?limit=100";
const MAX_MATCH_KM = 3;
const OUT_DIR = new URL("../data/", import.meta.url);

async function get(url, as) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`${url} responded ${res.status}`);
  }
  return as === "text" ? res.text() : res.json();
}

/** Great-circle distance in km between two [lon, lat] points. */
function distanceKm([lon1, lat1], [lon2, lat2]) {
  const rad = Math.PI / 180;
  const a =
    Math.sin(((lat2 - lat1) * rad) / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(((lon2 - lon1) * rad) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

const round5 = (n) => Math.round(n * 1e5) / 1e5;

const [geo, jolpica, license] = await Promise.all([
  get(`${SOURCE}/f1-circuits.geojson`),
  get(JOLPICA_CIRCUITS),
  get(`${SOURCE}/LICENSE.md`, "text"),
]);

const { total, CircuitTable } = jolpica.MRData;
if (Number(total) > CircuitTable.Circuits.length) {
  throw new Error(`Jolpica lists ${total} circuits; raise the limit in JOLPICA_CIRCUITS`);
}
const candidates = CircuitTable.Circuits.map((c) => ({
  id: c.circuitId,
  at: [Number(c.Location.long), Number(c.Location.lat)],
}));

const circuits = {};
for (const { properties, geometry } of geo.features) {
  const first = geometry.coordinates[0];
  const [nearest] = candidates
    .map((c) => ({ ...c, km: distanceKm(first, c.at) }))
    .sort((a, b) => a.km - b.km);
  if (!nearest || nearest.km > MAX_MATCH_KM) {
    console.warn(`unmatched  ${properties.id} ${properties.Name} (nearest ${nearest?.id} at ${nearest?.km.toFixed(1)} km)`);
    continue;
  }
  if (circuits[nearest.id]) {
    throw new Error(`${properties.id} and ${circuits[nearest.id].sourceId} both match ${nearest.id}`);
  }
  console.log(`matched    ${properties.id} -> ${nearest.id} (${nearest.km.toFixed(2)} km)`);
  circuits[nearest.id] = {
    sourceId: properties.id,
    name: properties.Name,
    lengthM: properties.length,
    coordinates: geometry.coordinates.map(([lon, lat]) => [round5(lon), round5(lat)]),
  };
}

const lines = Object.keys(circuits)
  .sort()
  .map((id) => `  ${JSON.stringify(id)}: ${JSON.stringify(circuits[id])}`);

await mkdir(OUT_DIR, { recursive: true });
await writeFile(new URL("circuits.json", OUT_DIR), `{\n${lines.join(",\n")}\n}\n`);
await writeFile(
  new URL("circuits.LICENSE.md", OUT_DIR),
  `Track layouts and lengths in circuits.json come from\nhttps://github.com/bacinger/f1-circuits, used under the MIT License:\n\n${license.trim()}\n`,
);
console.log(`wrote ${lines.length} circuits`);
