import Link from "next/link";
import { StoryCard } from "@/components/f1/StoryCard";
import type { Story } from "@/lib/news-model";
import { WIRE_HOURS } from "@/lib/news";

/** Wire stories tagged with a driver or team, or a quiet-radio message. */
export function NewsMentions({ stories, subject }: { stories: Story[]; subject: string }) {
  return stories.length > 0 ? (
    <div className="space-y-3">
      {stories.map((story) => (
        <StoryCard key={story.id} story={story} />
      ))}
    </div>
  ) : (
    <p className="text-sm text-fg-dim">
      No stories naming {subject} in the last {WIRE_HOURS} hours.{" "}
      <Link href="/news" className="underline hover:text-fg">
        See the full wire
      </Link>
      .
    </p>
  );
}
