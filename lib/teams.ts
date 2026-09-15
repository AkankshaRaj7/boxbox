/**
 * Team presentation data keyed by Jolpica-F1 `constructorId`.
 *
 * Jolpica has no team colours, so these come from OpenF1's `team_colour` for
 * the current season. Colours and short names only — never logos. Moves to
 * the `teams` table once Supabase lands.
 */
export type TeamInfo = {
  /** Three-letter code for the timing tower. */
  code: string;
  /** Display name, shorter than Jolpica's registered entry name. */
  name: string;
  color: string;
};

export const TEAMS_2026: Record<string, TeamInfo> = {
  alpine: { code: "ALP", name: "Alpine", color: "#00a1e8" },
  aston_martin: { code: "AMR", name: "Aston Martin", color: "#229971" },
  audi: { code: "AUD", name: "Audi", color: "#f50537" },
  cadillac: { code: "CAD", name: "Cadillac", color: "#909090" },
  ferrari: { code: "FER", name: "Ferrari", color: "#ed1131" },
  haas: { code: "HAA", name: "Haas", color: "#9c9fa2" },
  mclaren: { code: "MCL", name: "McLaren", color: "#f47600" },
  mercedes: { code: "MER", name: "Mercedes", color: "#00d7b6" },
  rb: { code: "RCB", name: "Racing Bulls", color: "#6c98ff" },
  red_bull: { code: "RBR", name: "Red Bull Racing", color: "#4781d7" },
  williams: { code: "WIL", name: "Williams", color: "#1868db" },
};

/** Neutral livery for a constructor we have no colour for yet. */
export const FALLBACK_TEAM_COLOR = "#9b9ba7";

/**
 * Presentation data for a constructor, falling back to its Jolpica name and a
 * neutral colour so a new or renamed team still renders.
 */
export function teamInfo(constructorId: string, apiName: string): TeamInfo {
  return (
    TEAMS_2026[constructorId] ?? {
      code: apiName.replace(/[^a-z]/gi, "").slice(0, 3).toUpperCase(),
      name: apiName,
      color: FALLBACK_TEAM_COLOR,
    }
  );
}
