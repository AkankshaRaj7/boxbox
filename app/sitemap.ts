import type { MetadataRoute } from "next";
import { SCORING } from "@/lib/championship";
import { fetchCalendar, fetchSeasonResults } from "@/lib/jolpica";
import type { RaceWeekend } from "@/lib/schedule";
import { SITE_URL } from "@/lib/site";

/** Rebuilt on the same daily rhythm as the data behind it. */
export const revalidate = 86400;

/**
 * Every page worth indexing: the fixed routes, one per race, circuit, driver
 * and team. `/design` is left out — it is dev-only and 404s in production.
 *
 * A failed fetch shrinks the sitemap rather than breaking the build; the fixed
 * routes are always listed.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const at = (path: string, priority: number, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  });

  const [calendar, season] = await Promise.all([
    fetchCalendar().catch(() => [] as RaceWeekend[]),
    fetchSeasonResults().catch(() => null),
  ]);

  return [
    at("/", 1, "hourly"),
    at("/races", 0.8, "weekly"),
    at("/championship", 0.8, "daily"),
    at("/pecking-order", 0.8, "weekly"),
    at("/news", 0.7, "hourly"),
    ...SCORING.races.map((race) => at(`/races/${race.round}`, 0.7, "monthly")),
    ...[...new Set(calendar.map((weekend) => weekend.circuitId))].map((id) => at(`/circuits/${id}`, 0.6, "monthly")),
    ...(season?.drivers ?? []).map((driver) => at(`/drivers/${driver.code.toLowerCase()}`, 0.6, "weekly")),
    ...(season?.teams ?? []).map((team) => at(`/teams/${team.id}`, 0.6, "weekly")),
  ];
}
