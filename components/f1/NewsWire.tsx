"use client";

import { useState } from "react";
import { StoryCard } from "@/components/f1/StoryCard";
import type { Story, Topic } from "@/lib/news-model";

type Filter = "all" | "breaking" | Exclude<Topic, "news">;

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "breaking", label: "Breaking" },
  { id: "transfers", label: "Transfers" },
  { id: "technical", label: "Technical" },
  { id: "race-reports", label: "Race reports" },
];

const matches = (story: Story, filter: Filter) =>
  filter === "all" || (filter === "breaking" ? story.breaking : story.topic === filter);

/** The full news wire with slanted filter buttons, each showing how many stories it holds. */
export function NewsWire({ stories }: { stories: Story[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const shown = stories.filter((s) => matches(s, filter));
  const label = FILTERS.find((f) => f.id === filter)!.label;

  return (
    <div>
      <div role="group" aria-label="Filter stories" className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const selected = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setFilter(f.id)}
              className={`slant min-h-11 px-4 text-sm font-bold uppercase transition-colors ${
                selected ? "bg-box-red text-asphalt" : "border border-line text-fg-dim hover:bg-kerb hover:text-fg"
              }`}
            >
              <span className="unslant">
                {f.label} <span className="font-mono">{stories.filter((s) => matches(s, f.id)).length}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p aria-live="polite" className="sr-only">
        Showing {shown.length} {label} stories
      </p>
      {shown.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {shown.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-fg-dim">No {label.toLowerCase()} stories on the wire right now.</p>
      )}
    </div>
  );
}
