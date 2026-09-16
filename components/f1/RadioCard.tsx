import { ExternalLink, Radio } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";
import { Panel } from "@/components/f1/Panel";
import { SlantTag, type SlantTone } from "@/components/f1/SlantTag";
import { TimeAgo } from "@/components/f1/TimeAgo";
import { teamStyle } from "@/lib/color";
import type { SourceTier } from "@/lib/news-model";

const TIERS: Record<SourceTier, { label: string; className: string }> = {
  official: { label: "Official", className: "border-flag-green" },
  tier1: { label: "Tier-1", className: "border-flag-blue" },
  rumor: { label: "Rumor mill", className: "border-flag-yellow" },
};

/** Fixed bar heights for the decorative radio waveform. */
const WAVE = [3, 7, 12, 6, 14, 9, 4, 11, 16, 8, 5, 13, 7, 10, 4, 8, 12, 6, 3, 9];

function Waveform() {
  return (
    <svg viewBox="0 0 80 16" className="h-4 w-20 fill-box-red/60" aria-hidden="true" focusable="false">
      {WAVE.map((h, i) => (
        <rect key={i} x={i * 4} y={(16 - h) / 2} width="2" height={h} />
      ))}
    </svg>
  );
}

/**
 * A news story presented as a team-radio message. Links out to the original
 * article when `href` is set — BOXBOX never republishes article bodies.
 */
export function RadioCard({
  headline,
  summary,
  source,
  tier,
  outlets,
  tone,
  tag,
  publishedAt,
  href,
  tags = [],
  alsoOn = [],
}: {
  headline: string;
  summary: string;
  source: string;
  tier: SourceTier;
  outlets: number;
  tone: SlantTone;
  tag: string;
  /** ISO 8601 time of the first report. */
  publishedAt: string;
  href?: string;
  /** Drivers and teams named in the story, shown with their team colour. */
  tags?: { id: string; label: string; color: string; href?: string }[];
  /** The same story at other outlets. */
  alsoOn?: { source: string; link: string }[];
}) {
  const tierInfo = TIERS[tier];
  return (
    <Panel as="article" className="p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="headline flex items-center gap-2 text-sm text-box-red">
          <Radio size={16} aria-hidden="true" />
          Box box
          <Waveform />
        </span>
        <SlantTag tone={tone}>{tag}</SlantTag>
      </div>
      <h3 className="text-lg font-bold leading-snug">
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {headline}
            <ExternalLink size={14} className="ml-1 inline align-baseline" aria-label="opens the original article" />
          </a>
        ) : (
          headline
        )}
      </h3>
      {summary && <p className="mt-1 text-sm text-fg-dim">{summary}</p>}
      {tags.length > 0 && (
        <ul aria-label="Drivers and teams" className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {tags.map((t) => (
            <li
              key={t.id}
              style={teamStyle(t.color)}
              className="border-l-2 border-(--team) pl-1.5 font-mono text-xs font-bold text-(--team-text)"
            >
              {t.href ? (
                <Link href={t.href} className="hover:underline">
                  {t.label}
                </Link>
              ) : (
                t.label
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-dim">
        <span className={`border-l-2 pl-2 font-semibold text-fg ${tierInfo.className}`}>{tierInfo.label}</span>
        <span>{source}</span>
        {outlets > 1 && <span>Reported by {outlets} outlets</span>}
        <TimeAgo iso={publishedAt} className="font-mono" />
      </div>
      {alsoOn.length > 0 && (
        <p className="mt-2 text-xs text-fg-dim">
          Also on:{" "}
          {alsoOn.map((a, i) => (
            <Fragment key={a.link}>
              {i > 0 && " · "}
              <a href={a.link} target="_blank" rel="noopener noreferrer" className="underline hover:text-fg">
                {a.source}
              </a>
            </Fragment>
          ))}
        </p>
      )}
    </Panel>
  );
}
