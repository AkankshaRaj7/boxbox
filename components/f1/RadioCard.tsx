import { ExternalLink, Radio } from "lucide-react";
import { Panel } from "@/components/f1/Panel";
import { SlantTag, type SlantTone } from "@/components/f1/SlantTag";
import type { Flag, SourceTier } from "@/lib/sample-data";

const TIERS: Record<SourceTier, { label: string; className: string }> = {
  official: { label: "Official", className: "border-flag-green" },
  tier1: { label: "Tier-1", className: "border-flag-blue" },
  rumor: { label: "Rumor mill", className: "border-flag-yellow" },
};

const FLAG_TONE: Record<Flag, SlantTone> = { green: "green", yellow: "yellow", red: "red", blue: "blue" };

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
  flag,
  tag,
  minutesAgo,
  href,
}: {
  headline: string;
  summary: string;
  source: string;
  tier: SourceTier;
  outlets: number;
  flag: Flag;
  tag: string;
  minutesAgo: number;
  href?: string;
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
        <SlantTag tone={FLAG_TONE[flag]}>{tag}</SlantTag>
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
      <p className="mt-1 text-sm text-fg-dim">{summary}</p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-dim">
        <span className={`border-l-2 pl-2 font-semibold text-fg ${tierInfo.className}`}>{tierInfo.label}</span>
        <span>{source}</span>
        <span>Reported by {outlets} outlets</span>
        <span className="font-mono">{minutesAgo}m ago</span>
      </div>
    </Panel>
  );
}
