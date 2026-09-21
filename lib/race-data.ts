/**
 * Reads the committed race records in data/races/.
 *
 * Server-only, and only ever at build time: every race page is statically
 * generated from `generateStaticParams`, because a finished race never
 * changes. That also keeps the filesystem out of the request path.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import type { RaceRecord } from "@/lib/race";

const DIR = path.join(process.cwd(), "data", "races");

/** Every race we hold, newest round first. */
export async function listRaces(): Promise<{ season: string; round: number }[]> {
  const files = await readdir(DIR).catch(() => []);
  return files
    .flatMap((file) => {
      const match = file.match(/^(\d{4})-(\d+)\.json$/);
      return match ? [{ season: match[1], round: Number(match[2]) }] : [];
    })
    .sort((a, b) => b.season.localeCompare(a.season) || b.round - a.round);
}

/** One race, or null when we hold no record for it. */
export async function loadRace(season: string, round: number): Promise<RaceRecord | null> {
  return readFile(path.join(DIR, `${season}-${round}.json`), "utf8")
    .then((text) => JSON.parse(text) as RaceRecord)
    .catch(() => null);
}

/** The most recent race we hold a record for. */
export async function latestRace(): Promise<{ season: string; round: number } | null> {
  return (await listRaces())[0] ?? null;
}
