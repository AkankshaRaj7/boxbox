/** A row in a standings table, already ordered. */
export type StandingRow = {
  id: string;
  code: string;
  name: string;
  color: string;
  points: number;
};

/** Both championship tables as they stood after `round` of `season`. */
export type Standings = {
  season: string;
  /** Last round included in the points; null before the season's first race. */
  round: number | null;
  drivers: StandingRow[];
  constructors: StandingRow[];
};
