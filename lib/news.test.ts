import { describe, expect, it } from "vitest";
import {
  BREAKING_OUTLETS,
  NEWS_SOURCES,
  buildMatchers,
  buildStories,
  classify,
  groupArticles,
  tagEntities,
  toArticles,
  tokens,
  topStories,
  type Article,
  type NewsSource,
} from "./news";
import type { FeedItem } from "./rss";
import type { StandingRow } from "./standings";

const NOW = Date.parse("2026-09-15T12:00:00Z");
const hoursAgo = (h: number) => new Date(NOW - h * 3_600_000).toISOString();

const drivers: StandingRow[] = [
  { id: "norris", code: "NOR", name: "Lando Norris", color: "#f47600", points: 186 },
  { id: "hulkenberg", code: "HUL", name: "Nico Hülkenberg", color: "#f50537", points: 7 },
  { id: "antonelli", code: "ANT", name: "Andrea Kimi Antonelli", color: "#00d7b6", points: 292 },
];
const matchers = buildMatchers(drivers);

let nextId = 0;
function article(sourceId: string, title: string, summary = "", hours = 1): Article {
  return {
    id: `${sourceId}:${nextId++}`,
    sourceId,
    title,
    summary,
    link: `https://example.com/${nextId}`,
    publishedAt: hoursAgo(hours),
    categories: [],
    entities: tagEntities(`${title} ${summary}`, matchers),
  };
}

describe("tagEntities", () => {
  it("matches driver surnames without accents", () => {
    expect(tagEntities("Hulkenberg and Norris clash", matchers)).toEqual(["driver:norris", "driver:hulkenberg"]);
  });

  it("matches whole words only", () => {
    expect(tagEntities("Norrisville fans", matchers)).toEqual([]);
  });

  it("tells Red Bull, the Red Bull Ring and Racing Bulls apart", () => {
    expect(tagEntities("Red Bull upgrade", matchers)).toEqual(["team:red_bull"]);
    expect(tagEntities("Racing Bulls at the Red Bull Ring", matchers)).toEqual(["team:rb"]);
  });

  it("tags Sauber stories as Audi", () => {
    expect(tagEntities("Sauber legacy lives on", matchers)).toEqual(["team:audi"]);
  });
});

describe("classify", () => {
  it("applies rules in precedence order", () => {
    expect(classify(["Antonelli signs new Mercedes contract after pole"], true)).toBe("transfers");
    expect(classify(["Ferrari brings new floor upgrade to Baku"], false)).toBe("technical");
    expect(classify(["Antonelli wins Spanish GP"], true)).toBe("race-reports");
    expect(classify(["Norris' Madring misery creates Baku betting value"], true)).toBe("news");
  });

  it("treats contract and seat stories as transfers even without a named driver", () => {
    expect(classify(["Cadillac's 2027 line-up still open"], false)).toBe("transfers");
  });

  it("needs a named driver before personnel words mean a transfer", () => {
    expect(classify(["Bearman joins Ferrari for 2027"], true)).toBe("transfers");
    expect(classify(["Honda replaces its F1 engine development chief"], false)).toBe("technical");
    expect(classify(["Team principal joins rival outfit"], false)).toBe("news");
  });

  it("does not file sporting rule rows as technical", () => {
    expect(classify(["Norris calls out 'unfair' VSC rules after lost Madrid win"], true)).toBe("news");
  });

  it("uses feed categories too", () => {
    expect(classify(["Madrid review", "Race reports"], false)).toBe("race-reports");
  });
});

describe("tokens", () => {
  it("drops stopwords, punctuation and plurals", () => {
    expect(tokens("Why Norris's F1 hopes are fading: the changes")).toEqual(["norris", "hope", "fading", "change"]);
  });
});

describe("toArticles", () => {
  const source: NewsSource = { id: "mixed", name: "Mixed", url: "https://example.com", tier: "tier1", categories: /formula 1/i };
  const item = (overrides: Partial<FeedItem>): FeedItem => ({
    title: "Norris news",
    link: "https://example.com/a",
    summary: "",
    publishedAt: hoursAgo(1),
    categories: ["Formula 1"],
    ...overrides,
  });

  it("keeps dated, recent items in the source's categories and tags them", () => {
    const [a] = toArticles(source, [item({})], NOW, matchers);
    expect(a).toMatchObject({ sourceId: "mixed", entities: ["driver:norris"] });
  });

  it("drops undated, stale, future and off-category items", () => {
    const items = [
      item({ publishedAt: null }),
      item({ publishedAt: hoursAgo(73) }),
      item({ publishedAt: hoursAgo(-2) }),
      item({ categories: ["IndyCar"] }),
    ];
    expect(toArticles(source, items, NOW, matchers)).toEqual([]);
  });
});

describe("groupArticles", () => {
  it("groups the same story from different outlets", () => {
    const bbc = article(
      "bbc",
      "Madrid F1 circuit set for changes after criticism",
      "Spanish Grand Prix organisers are set to make changes to the new Madrid circuit after criticism of its inaugural race.",
      5,
    );
    const autosport = article(
      "autosport",
      "Madring organisers plan circuit changes after criticism of debut race",
      "Organisers of the Madrid circuit will make changes following criticism of its first Spanish Grand Prix.",
      3,
    );
    const other = article("sky", "Antonelli extends championship lead", "The Mercedes driver leads by 81 points.", 2);
    const groups = groupArticles([other, autosport, bbc]);
    expect(groups.map((g) => g.map((a) => a.sourceId))).toEqual([["bbc", "autosport"], ["sky"]]);
  });

  it("never groups two articles from the same outlet", () => {
    const a = article("bbc", "Madrid circuit changes confirmed", "", 3);
    const b = article("bbc", "Madrid circuit changes confirmed for 2027", "", 2);
    expect(groupArticles([a, b])).toHaveLength(2);
  });

  it("never groups reports more than a day apart", () => {
    const a = article("bbc", "Madrid circuit changes confirmed", "", 30);
    const b = article("sky", "Madrid circuit changes confirmed", "", 2);
    expect(groupArticles([a, b])).toHaveLength(2);
  });
});

describe("buildStories", () => {
  it("leads with the first report and counts outlets", () => {
    const first = article("bbc", "Madrid circuit changes confirmed after criticism", "", 4);
    const second = article("sky", "Madrid circuit changes confirmed after criticism of debut", "", 2);
    const [story] = buildStories([second, first], matchers, NOW);
    expect(story).toMatchObject({
      headline: first.title,
      source: "BBC Sport",
      outlets: 2,
      publishedAt: first.publishedAt,
      latestAt: second.publishedAt,
      alsoOn: [{ source: "Sky Sports", link: second.link }],
    });
  });

  it(`marks a story breaking once ${BREAKING_OUTLETS} outlets report it within hours`, () => {
    const ids = NEWS_SOURCES.slice(0, BREAKING_OUTLETS).map((s) => s.id);
    const reports = ids.map((id, i) => article(id, "Norris handed grid penalty for Baku", "", 3 - i));
    const [story] = buildStories(reports, matchers, NOW);
    expect(story.breaking).toBe(true);
    expect(story.tags.map((t) => t.label)).toEqual(["NOR"]);
    expect(buildStories(reports.slice(1), matchers, NOW)[0].breaking).toBe(false);
  });

  it("orders stories by latest activity", () => {
    const old = article("bbc", "Hulkenberg reflects on Audi season", "", 20);
    const fresh = article("sky", "Antonelli extends championship lead", "", 1);
    expect(buildStories([old, fresh], matchers, NOW).map((s) => s.headline)).toEqual([fresh.title, old.title]);
  });
});

describe("topStories", () => {
  it("puts breaking and widely reported stories first", () => {
    const solo = article("bbc", "Hulkenberg reflects on Audi season", "", 1);
    const shared = [
      article("sky", "Antonelli extends championship lead", "", 5),
      article("autosport", "Antonelli extends championship lead over Russell", "", 4),
    ];
    const stories = buildStories([solo, ...shared], matchers, NOW);
    expect(topStories(stories, NOW, 2).map((s) => s.outlets)).toEqual([2, 1]);
  });
});
