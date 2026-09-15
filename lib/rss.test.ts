import { describe, expect, it } from "vitest";
import { SUMMARY_MAX, cleanLink, cleanSummary, cleanTitle, decodeEntities, parseFeed, parseFeedDate } from "./rss";

/** Shaped like the real Autosport, Sky Sports and RaceFans feeds. */
const FEED = `<?xml version="1.0" encoding="utf-8" ?>
<?xml-stylesheet title="XSL_formatting" type="text/xsl" href="/rss.xsl"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Feed</title>
    <item>
      <title>Norris completes first full test in McLaren&#8217;s Le Mans Hypercar</title>
      <link>https://www.autosport.com/wec/news/norris-test/10855957/?utm_source=RSS&amp;utm_medium=referral&amp;page=2</link>
      <description><![CDATA[Reigning champion Lando Norris completed his first test.<br>The Briton completed 38 laps of ...<a class='more' href='https://www.autosport.com/x'>Keep reading</a>]]></description>
      <category>WEC</category>
      <category>Formula 1</category>
      <guid isPermaLink="false">10855957</guid>
      <pubDate>Mon, 14 Sep 2026 18:29:19 +0000</pubDate>
      <enclosure url="https://cdn.example.com/photo.jpg" type="image/jpeg" />
    </item>
    <item>
      <title>Brundle: Debating the rule that cost Norris | Brief</title>
      <link>https://www.skysports.com/f1/news/12433/13585846/brundle</link>
      <description>Brundle: Debating the rule that cost Norris</description>
      <pubDate>Mon, 14 Sep 2026 14:57:00 BST</pubDate>
    </item>
    <item>
      <title>No link here</title>
    </item>
    <item>
      <title>Unsafe link</title>
      <link>javascript:alert(1)</link>
    </item>
  </channel>
</rss>`;

describe("parseFeed", () => {
  const items = parseFeed(FEED);

  it("keeps items with a headline and a safe link", () => {
    expect(items.map((i) => i.title)).toEqual([
      "Norris completes first full test in McLaren’s Le Mans Hypercar",
      "Brundle: Debating the rule that cost Norris",
    ]);
  });

  it("reads links, summaries, dates and categories", () => {
    expect(items[0]).toEqual({
      title: "Norris completes first full test in McLaren’s Le Mans Hypercar",
      link: "https://www.autosport.com/wec/news/norris-test/10855957/?page=2",
      summary: "Reigning champion Lando Norris completed his first test. The Briton completed 38 laps of…",
      publishedAt: "2026-09-14T18:29:19.000Z",
      categories: ["WEC", "Formula 1"],
    });
  });

  it("drops a description that only repeats the headline", () => {
    expect(items[1].summary).toBe("");
    expect(items[1].publishedAt).toBe("2026-09-14T13:57:00.000Z");
    expect(items[1].categories).toEqual([]);
  });

  it("rejects documents that are not RSS", () => {
    expect(() => parseFeed("<html><body>Moved</body></html>")).toThrow(/Not an RSS/);
  });
});

describe("cleanSummary", () => {
  it("strips WordPress boilerplate", () => {
    expect(cleanSummary("<p>Zanardi crash anniversary.</p><p>The post On This Day appeared first on RaceFans.</p>", "x")).toBe(
      "Zanardi crash anniversary.",
    );
  });

  it("cuts long descriptions at a word boundary", () => {
    const summary = cleanSummary("word ".repeat(100), "x");
    expect(summary.length).toBeLessThanOrEqual(SUMMARY_MAX + 1);
    expect(summary.endsWith("word…")).toBe(true);
  });
});

describe("helpers", () => {
  it("decodes named and numeric entities", () => {
    expect(decodeEntities("Rock &amp; roll &#8217;s &#x2013; &hellip; &bogus;")).toBe("Rock & roll ’s – … &bogus;");
  });

  it("removes only a short trailing section label from titles", () => {
    expect(cleanTitle("Title here | Brief")).toBe("Title here");
    expect(cleanTitle("<b>A</b> | B | C")).toBe("A | B");
  });

  it("returns null for unreadable dates", () => {
    expect(parseFeedDate("")).toBeNull();
    expect(parseFeedDate("next Tuesday")).toBeNull();
    expect(parseFeedDate("Tue, 15 Sep 2026 04:10:17 GMT")).toBe("2026-09-15T04:10:17.000Z");
  });

  it("only allows http(s) links", () => {
    expect(cleanLink("ftp://example.com/x")).toBe("");
    expect(cleanLink("not a url")).toBe("");
    expect(cleanLink("https://www.bbc.co.uk/sport/formula1/articles/abc?at_medium=RSS&at_campaign=rss")).toBe(
      "https://www.bbc.co.uk/sport/formula1/articles/abc",
    );
  });
});
