"use client";

import { formatAgo, formatUtcStamp } from "@/lib/time";
import { useClock } from "@/lib/use-clock";

/**
 * A relative time ("12m ago") that stays current. Until the clock starts it
 * shows a fixed UTC stamp, so server and client HTML match.
 */
export function TimeAgo({ iso, className = "" }: { iso: string; className?: string }) {
  const now = useClock();
  const stamp = formatUtcStamp(iso);
  return (
    <time dateTime={iso} title={stamp} className={className}>
      {now > 0 ? formatAgo(now - Date.parse(iso)) : stamp}
    </time>
  );
}
