/**
 * The news wire: RSS ingest, driver/team tagging, topic rules and duplicate
 * grouping, all done in code with no paid AI. Stories link out to the
 * publisher; only headlines and short publisher descriptions are shown.
 */
import { fetchStandings } from "@/lib/jolpica";
import type { Entity, SourceTier, Story, Topic } from "@/lib/news-model";
import { parseFeed, type FeedItem } from "@/lib/rss";
import { driverHref, teamHref } from "@/lib/season";
import type { StandingRow } from "@/lib/standings";
import { TEAMS_2026 } from "@/lib/teams";

export type NewsSource = {
  id: string;
  name: string;
  url: string;
  tier: SourceTier;
  /** For feeds that mix series: keep only items with a category matching this. */
  categories?: RegExp;
};

export const NEWS_SOURCES: NewsSource[] = [
  { id: "bbc", name: "BBC Sport", url: "https://feeds.bbci.co.uk/sport/formula1/rss.xml", tier: "tier1" },
  { id: "autosport", name: "Autosport", url: "https://www.autosport.com/rss/f1/news/", tier: "tier1" },
  { id: "motorsport", name: "Motorsport.com", url: "https://www.motorsport.com/rss/f1/news/", tier: "tier1" },
  { id: "the-race", name: "The Race", url: "https://www.the-race.com/rss/", tier: "tier1", categories: /formula 1/i },
  { id: "racefans", name: "RaceFans", url: "https://www.racefans.net/feed/", tier: "tier1", categories: /formula 1|\bF1\b/i },
  { id: "sky", name: "Sky Sports", url: "https://www.skysports.com/rss/12433", tier: "tier1" },
];

/** Seconds between feed refetches. */
export const NEWS_REVALIDATE = 900;
/** Articles older than this drop off the wire. */
export const WIRE_HOURS = 72;
/** Articles published further apart than this are never grouped. */
export const GROUP_WINDOW_HOURS = 24;
/**
 * Similarity that groups two reports on its own. Tuned on a real snapshot of
 * 116 articles (Sept 2026): untagged pairs below this were different stories.
 */
export const SIMILARITY = 0.38;
/**
 * Lower similarity that groups reports naming the same driver or team. Below
 * this, pairs were usually different stories about the same race winner.
 */
export const SIMILARITY_WITH_SHARED_TAG = 0.3;
/** A story is breaking once this many outlets report it within BREAKING_HOURS. */
export const BREAKING_OUTLETS = 3;
export const BREAKING_HOURS = 6;

const HOUR = 3_600_000;
const USER_AGENT = "BOXBOX/0.1 (+https://github.com/AkankshaRaj7/boxbox)";

/** Driver-market words that mark a transfer story on their own. */
const TRANSFER_WORDS = /\b(contracts?|seats?|line-?up|silly season|driver market|reserve driver)\b/i;

/**
 * Personnel words that only mean a transfer story when a driver is named, so
 * "Honda replaces its engine chief" is not filed under Transfers.
 */
const TRANSFER_WORDS_WITH_DRIVER =
  /\b(sign(s|ed|ing)?|joins?|joining|moves? to|deal|extension|extend(s|ed)?|replace(s|d|ment)?|rumou?rs?|linked|talks|swap|exit|departure)\b/i;

/** Keyword rules over headlines and feed categories, checked in this order after the transfer rules. */
const TOPIC_RULES: [Topic, RegExp][] = [
  [
    "technical",
    /\b(upgrades?|floor|wings?|aero(dynamics?)?|power units?|engines?|regulations?|technical|directive|sidepods?|diffuser|chassis|straight mode|overtake mode|energy|batter(y|ies)|fuel|wind tunnel|cfd|cost cap|tyres?|pirelli|development)\b/i,
  ],
  [
    "race-reports",
    // "wins" but not bare "win", which also appears in "lost win" and "can win" stories.
    /\b(wins|won|victory|podium|pole|qualifying|results?|race reports?|sprint|practice|fp[123]|fastest lap|rate the race|driver of the weekend|winners and losers|takeaways|talking points)\b/i,
  ],
];

/** Hand-written name patterns for teams, keyed by Jolpica constructorId. */
const TEAM_PATTERNS: Record<string, string> = {
  alpine: "Alpine",
  aston_martin: "Aston Martin",
  audi: "Audi|Sauber",
  cadillac: "Cadillac",
  ferrari: "Ferrari",
  haas: "Haas",
  mclaren: "McLaren",
  mercedes: "Mercedes",
  rb: "Racing Bulls|VCARB",
  red_bull: "Red Bull(?! Ring)",
  williams: "Williams",
};

const STOPWORDS = new Set(
  (
    "a an and are as at be been but by can could did do for from had has have he her his how in into is it its " +
    "may more most new next not of off on one or out over says she should so than that the their them they this " +
    "to up was we what when where which who why will with would after about amid just also still ahead " +
    "f1 formula grand prix gp race racing driver team season week weekend year first last"
  ).split(" "),
);

type Matcher = Entity & { pattern: RegExp };

export type Article = FeedItem & {
  id: string;
  sourceId: string;
  publishedAt: string;
  /** Entity ids named in the headline or description. */
  entities: string[];
};

/** Text without accents, so "Hülkenberg" matches "Hulkenberg". Case is kept. */
export function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wordPattern = (source: string) => new RegExp(`(?<!\\p{L})(?:${source})(?!\\p{L})`, "u");

/**
 * Name matchers for the current drivers (by surname) and teams. Drivers come
 * from the standings so tags follow the real grid and carry team colours.
 */
export function buildMatchers(drivers: StandingRow[]): Matcher[] {
  const driverMatchers = drivers.map((d) => ({
    id: `driver:${d.id}`,
    label: d.code,
    kind: "driver" as const,
    color: d.color,
    href: driverHref(d.code),
    pattern: wordPattern(escapeRegExp(stripAccents(d.name.split(" ").at(-1) ?? d.name))),
  }));
  const teamMatchers = Object.entries(TEAM_PATTERNS).map(([id, source]) => ({
    id: `team:${id}`,
    label: TEAMS_2026[id]?.name ?? id,
    kind: "team" as const,
    color: TEAMS_2026[id]?.color ?? "#9b9ba7",
    href: teamHref(id),
    pattern: wordPattern(source),
  }));
  return [...driverMatchers, ...teamMatchers];
}

/** Ids of the drivers and teams named in `text`. */
export function tagEntities(text: string, matchers: Matcher[]): string[] {
  const plain = stripAccents(text);
  return matchers.filter((m) => m.pattern.test(plain)).map((m) => m.id);
}

/**
 * The topic for a story's headlines and categories: transfers first, then the
 * first matching rule, else "news".
 *
 * @param namesDriver whether the story names a current driver.
 */
export function classify(texts: string[], namesDriver: boolean): Topic {
  const joined = texts.join(" \n ");
  if (TRANSFER_WORDS.test(joined) || (namesDriver && TRANSFER_WORDS_WITH_DRIVER.test(joined))) {
    return "transfers";
  }
  return TOPIC_RULES.find(([, rule]) => rule.test(joined))?.[0] ?? "news";
}

/** Normalised words for similarity: lower-case, no stopwords, crude plural stripping. */
export function tokens(value: string): string[] {
  return stripAccents(value)
    .toLowerCase()
    .replace(/['’]s\b/g, "")
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t))
    .map((t) => (t.length > 4 && /[^ius]s$/.test(t) ? t.slice(0, -1) : t));
}

type Vector = Map<string, number>;

/** TF-IDF vectors; words common across the whole wire weigh little. */
function tfidf(docs: string[][]): Vector[] {
  const df = new Map<string, number>();
  for (const doc of docs) {
    for (const t of new Set(doc)) df.set(t, (df.get(t) ?? 0) + 1);
  }
  return docs.map((doc) => {
    const v: Vector = new Map();
    for (const t of doc) v.set(t, (v.get(t) ?? 0) + 1);
    for (const [t, tf] of v) v.set(t, tf * Math.log(1 + docs.length / df.get(t)!));
    return v;
  });
}

export function cosine(a: Vector, b: Vector): number {
  let dot = 0;
  for (const [t, w] of a) dot += w * (b.get(t) ?? 0);
  const norm = (v: Vector) => Math.sqrt([...v.values()].reduce((s, w) => s + w * w, 0));
  const denominator = norm(a) * norm(b);
  return denominator === 0 ? 0 : dot / denominator;
}

/** Headline words count twice; the description adds context. */
const articleTokens = (a: Article) => [...tokens(a.title), ...tokens(a.title), ...tokens(a.summary)];

/**
 * Groups reports of the same story from different outlets. Articles are taken
 * oldest first and join the most similar group (by its combined vector) that
 * has no article from the same outlet and started within GROUP_WINDOW_HOURS.
 */
export function groupArticles(articles: Article[]): Article[][] {
  const sorted = [...articles].sort((a, b) => Date.parse(a.publishedAt) - Date.parse(b.publishedAt));
  const vectors = tfidf(sorted.map(articleTokens));
  const groups: { articles: Article[]; centroid: Vector; tags: Set<string>; sources: Set<string>; startedAt: number }[] = [];

  sorted.forEach((article, i) => {
    const at = Date.parse(article.publishedAt);
    let best: (typeof groups)[number] | undefined;
    let bestScore = 0;
    for (const group of groups) {
      if (group.sources.has(article.sourceId) || at - group.startedAt > GROUP_WINDOW_HOURS * HOUR) continue;
      const score = cosine(vectors[i], group.centroid);
      const sharesTag = article.entities.some((e) => group.tags.has(e));
      const similar = score >= SIMILARITY || (sharesTag && score >= SIMILARITY_WITH_SHARED_TAG);
      if (similar && score > bestScore) {
        best = group;
        bestScore = score;
      }
    }
    if (!best) {
      groups.push({ articles: [article], centroid: new Map(vectors[i]), tags: new Set(article.entities), sources: new Set([article.sourceId]), startedAt: at });
      return;
    }
    best.articles.push(article);
    best.sources.add(article.sourceId);
    for (const e of article.entities) best.tags.add(e);
    for (const [t, w] of vectors[i]) best.centroid.set(t, (best.centroid.get(t) ?? 0) + w);
  });

  return groups.map((g) => g.articles);
}

/** Dated articles from one feed, inside the wire window and the source's category filter. */
export function toArticles(source: NewsSource, items: FeedItem[], now: number, matchers: Matcher[]): Article[] {
  return items.flatMap((item) => {
    if (!item.publishedAt) return [];
    const age = now - Date.parse(item.publishedAt);
    if (age > WIRE_HOURS * HOUR || age < -HOUR) return [];
    if (source.categories && !item.categories.some((c) => source.categories!.test(c))) return [];
    return [
      {
        ...item,
        publishedAt: item.publishedAt,
        id: `${source.id}:${item.link}`,
        sourceId: source.id,
        entities: tagEntities(`${item.title} ${item.summary}`, matchers),
      },
    ];
  });
}

/** Up to this many driver/team tags per story, most mentioned first. */
const MAX_TAGS = 4;

/** Stories from grouped articles, newest activity first. */
export function buildStories(
  articles: Article[],
  matchers: Matcher[],
  now: number,
  sources: NewsSource[] = NEWS_SOURCES,
): Story[] {
  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const entityById = new Map<string, Entity>(
    matchers.map((m) => [m.id, { id: m.id, label: m.label, kind: m.kind, color: m.color, href: m.href }]),
  );

  return groupArticles(articles)
    .map((group) => {
      const [lead, ...rest] = group;
      const leadSource = sourceById.get(lead.sourceId)!;
      const counts = new Map<string, number>();
      for (const a of group) for (const e of a.entities) counts.set(e, (counts.get(e) ?? 0) + 1);
      const recentOutlets = new Set(
        group.filter((a) => now - Date.parse(a.publishedAt) <= BREAKING_HOURS * HOUR).map((a) => a.sourceId),
      );
      return {
        id: lead.id,
        headline: lead.title,
        summary: lead.summary,
        link: lead.link,
        source: leadSource.name,
        tier: leadSource.tier,
        publishedAt: lead.publishedAt,
        latestAt: group.at(-1)!.publishedAt,
        outlets: new Set(group.map((a) => a.sourceId)).size,
        alsoOn: rest.map((a) => ({ source: sourceById.get(a.sourceId)!.name, link: a.link })),
        topic: classify(
          group.flatMap((a) => [a.title, ...a.categories]),
          group.some((a) => a.entities.some((e) => e.startsWith("driver:"))),
        ),
        breaking: recentOutlets.size >= BREAKING_OUTLETS,
        tags: [...counts.entries()]
          .sort(([, a], [, b]) => b - a)
          .slice(0, MAX_TAGS)
          .flatMap(([id]) => entityById.get(id) ?? []),
      };
    })
    .sort((a, b) => Date.parse(b.latestAt) - Date.parse(a.latestAt));
}

/** Home-page picks: breaking first, then the most widely reported of the last day, then the newest. */
export function topStories(stories: Story[], now: number, count = 3): Story[] {
  const recent = (s: Story) => now - Date.parse(s.latestAt) <= GROUP_WINDOW_HOURS * HOUR;
  return [...stories]
    .sort(
      (a, b) =>
        Number(b.breaking) - Number(a.breaking) ||
        Number(recent(b)) - Number(recent(a)) ||
        b.outlets - a.outlets ||
        Date.parse(b.latestAt) - Date.parse(a.latestAt),
    )
    .slice(0, count);
}

async function fetchFeed(source: NewsSource): Promise<FeedItem[]> {
  const res = await fetch(source.url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.5" },
    next: { revalidate: NEWS_REVALIDATE, tags: ["news"] },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`${source.name} feed responded ${res.status}`);
  }
  return parseFeed(await res.text());
}

/**
 * The current wire from every source. A feed that fails is skipped and named
 * in `failed`, so one outage never empties the wire.
 */
export async function fetchNews(drivers: StandingRow[], now: number): Promise<{ stories: Story[]; failed: string[] }> {
  const matchers = buildMatchers(drivers);
  const results = await Promise.allSettled(NEWS_SOURCES.map(fetchFeed));
  const articles: Article[] = [];
  const failed: string[] = [];
  results.forEach((result, i) => {
    const source = NEWS_SOURCES[i];
    if (result.status === "fulfilled") {
      articles.push(...toArticles(source, result.value, now, matchers));
    } else {
      failed.push(source.name);
      console.error(`News feed unavailable: ${source.name}`, result.reason);
    }
  });
  return { stories: buildStories(articles, matchers, now), failed };
}

/**
 * The wire for a page render. Driver tags use the current standings; if
 * Jolpica is down, stories still load with team tags only.
 */
export async function loadWire(): Promise<{ stories: Story[]; failed: string[]; now: number }> {
  const now = Date.now();
  const drivers = await fetchStandings()
    .then((s) => s.drivers)
    .catch(() => []);
  return { ...(await fetchNews(drivers, now)), now };
}
