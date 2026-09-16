/**
 * News wire shapes shared by server code (lib/news.ts) and client components.
 * Kept free of runtime imports so the feed parser never ships to the browser.
 */
export type SourceTier = "official" | "tier1" | "rumor";

export type Topic = "transfers" | "technical" | "race-reports" | "news";

export const TOPICS: Record<Topic, { label: string; tone: "yellow" | "blue" | "green" | "neutral" }> = {
  transfers: { label: "Transfers", tone: "yellow" },
  technical: { label: "Technical", tone: "blue" },
  "race-reports": { label: "Race reports", tone: "green" },
  news: { label: "News", tone: "neutral" },
};

/** A driver or team named in a story. */
export type Entity = { id: string; label: string; kind: "driver" | "team"; color: string; href?: string };

export type Story = {
  id: string;
  headline: string;
  summary: string;
  link: string;
  source: string;
  tier: SourceTier;
  /** When the first outlet published. */
  publishedAt: string;
  /** When the most recent outlet published. */
  latestAt: string;
  /** Distinct outlets reporting the story. */
  outlets: number;
  alsoOn: { source: string; link: string }[];
  topic: Topic;
  breaking: boolean;
  tags: Entity[];
};
