/**
 * RSS 2.0 parsing and cleanup for the news wire. Keeps only what BOXBOX may
 * show: the headline, a short plain-text publisher description, the link,
 * the date and the feed's categories. Article bodies and images are dropped.
 */
import { XMLParser } from "fast-xml-parser";

export type FeedItem = {
  title: string;
  /** http(s) link to the original article, tracking parameters removed. */
  link: string;
  /** Plain-text publisher description, at most SUMMARY_MAX characters. */
  summary: string;
  /** ISO 8601, or null when the feed gives no usable date. */
  publishedAt: string | null;
  categories: string[];
};

export const SUMMARY_MAX = 220;

const parser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: false,
  trimValues: true,
  isArray: (name) => name === "item" || name === "category",
});

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  ndash: "–",
  mdash: "—",
};

/** Timezone abbreviations seen in feeds that `Date.parse` does not understand. */
const ZONE_OFFSETS: Record<string, string> = { BST: "+0100", CET: "+0100", CEST: "+0200", UTC: "+0000" };

const ELLIPSIS = /\s*(\[…\]|\[\.\.\.\]|…|\.\.\.)$/;

function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object" && "#text" in value) {
    return text((value as Record<string, unknown>)["#text"]);
  }
  return "";
}

const collapse = (s: string) => s.replace(/\s+/g, " ").trim();
const stripTags = (html: string) => html.replace(/<[^>]*>/g, " ");

/** Decodes named and numeric HTML entities left in CDATA sections. */
export function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code: string) => {
    if (code[0] === "#") {
      const n = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
      return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : match;
    }
    return NAMED_ENTITIES[code.toLowerCase()] ?? match;
  });
}

/** Headline as plain text, without a trailing " | Section" label. */
export function cleanTitle(raw: string): string {
  return collapse(decodeEntities(stripTags(raw))).replace(/\s+\|\s+[^|]{1,30}$/, "");
}

/**
 * Publisher description as short plain text, without read-more links or
 * "The post … appeared first on …" boilerplate. Empty when it only repeats
 * the headline.
 */
export function cleanSummary(raw: string, title: string): string {
  const plain = collapse(decodeEntities(stripTags(raw)))
    .replace(/\s*(keep reading|read more|continue reading)$/i, "")
    .replace(/\s*The post .+ appeared first on .+$/i, "");
  const truncated = ELLIPSIS.test(plain);
  const summary = plain.replace(ELLIPSIS, "");

  if (!summary || summary.toLowerCase() === title.toLowerCase()) {
    return "";
  }
  if (summary.length <= SUMMARY_MAX) {
    return truncated ? `${summary}…` : summary;
  }
  const cut = summary.slice(0, SUMMARY_MAX);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.–—-]+$/, "")}…`;
}

/** RFC 822 feed date as ISO 8601, or null if it can't be read. */
export function parseFeedDate(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  let ms = Date.parse(value);
  if (Number.isNaN(ms)) {
    ms = Date.parse(value.replace(/\b([A-Z]{3,4})$/, (zone) => ZONE_OFFSETS[zone] ?? zone));
  }
  return Number.isNaN(ms) ? null : new Date(ms).toISOString();
}

/** The link without utm_* / at_* tracking parameters, or "" if it isn't http(s). */
export function cleanLink(raw: string): string {
  try {
    const url = new URL(raw.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return "";
    }
    for (const key of [...url.searchParams.keys()]) {
      if (/^(utm_|at_)/.test(key)) url.searchParams.delete(key);
    }
    return url.toString();
  } catch {
    return "";
  }
}

/**
 * Items from an RSS 2.0 document. Items without a headline or a safe link are
 * dropped.
 *
 * @throws if the document is not RSS 2.0.
 */
export function parseFeed(xml: string): FeedItem[] {
  const channel = parser.parse(xml)?.rss?.channel;
  if (!channel || typeof channel !== "object") {
    throw new Error("Not an RSS 2.0 feed");
  }
  const items = ((channel as Record<string, unknown>).item ?? []) as Record<string, unknown>[];
  return items.flatMap((item) => {
    const title = cleanTitle(text(item.title));
    const link = cleanLink(text(item.link));
    if (!title || !link) return [];
    return [
      {
        title,
        link,
        summary: cleanSummary(text(item.description), title),
        publishedAt: parseFeedDate(text(item.pubDate)),
        categories: ((item.category ?? []) as unknown[]).map((c) => collapse(decodeEntities(text(c)))).filter(Boolean),
      },
    ];
  });
}
