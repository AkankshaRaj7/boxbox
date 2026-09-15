import type { Metadata } from "next";
import { NewsWire } from "@/components/f1/NewsWire";
import { NEWS_SOURCES, WIRE_HOURS, loadWire } from "@/lib/news";

/** Refetch feeds every 15 minutes. Matches NEWS_REVALIDATE. */
export const revalidate = 900;

const SOURCE_NAMES = NEWS_SOURCES.map((s) => s.name);

export const metadata: Metadata = {
  title: "News wire — BOXBOX",
  description: `F1 headlines from ${SOURCE_NAMES.join(", ")}, grouped by story.`,
};

/** The full news wire: every story from the last few days, filterable by topic. */
export default async function NewsPage() {
  const { stories, failed } = await loadWire();

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="headline text-display-sm">News wire</h1>
          <div className="kerb-stripe mt-1.5 h-1.5 w-16" aria-hidden="true" />
        </div>
        <span className="font-mono text-xs uppercase text-fg-dim">
          {stories.length} stories · last {WIRE_HOURS}h
        </span>
      </div>
      <p className="mb-4 max-w-3xl text-sm text-fg-dim">
        Headlines and short descriptions from {SOURCE_NAMES.slice(0, -1).join(", ")} and {SOURCE_NAMES.at(-1)}, grouped
        when several outlets report the same story. Every story links to the publisher&apos;s original article.
      </p>
      {failed.length > 0 && (
        <p className="mb-4 border-l-2 border-flag-yellow bg-carbon px-3 py-2 text-sm text-fg-dim">
          Couldn&apos;t reach {failed.join(", ")} just now. Their stories return on the next refresh.
        </p>
      )}
      {stories.length > 0 ? (
        <NewsWire stories={stories} />
      ) : (
        <p className="text-sm text-fg-dim">The wire is quiet: no stories could be loaded. Check back shortly.</p>
      )}
    </main>
  );
}
