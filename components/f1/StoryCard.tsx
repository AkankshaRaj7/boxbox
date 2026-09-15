import { RadioCard } from "@/components/f1/RadioCard";
import { TOPICS, type Story } from "@/lib/news-model";

/** A news wire story as a RadioCard. Breaking stories take the red flag over their topic. */
export function StoryCard({ story }: { story: Story }) {
  const topic = TOPICS[story.topic];
  return (
    <RadioCard
      headline={story.headline}
      summary={story.summary}
      href={story.link}
      source={story.source}
      tier={story.tier}
      outlets={story.outlets}
      publishedAt={story.publishedAt}
      tag={story.breaking ? "Breaking" : topic.label}
      tone={story.breaking ? "red" : topic.tone}
      tags={story.tags}
      alsoOn={story.alsoOn}
    />
  );
}
