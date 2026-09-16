const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const pad = (n: number) => n.toString().padStart(2, "0");

/**
 * Formats a remaining duration for the pit-board countdown.
 *
 * @param ms milliseconds remaining; negative values clamp to zero.
 * @returns "HH:MM:SS", prefixed with "ND " when a day or more remains.
 */
export function formatCountdown(ms: number): string {
  const remaining = Math.max(0, Math.floor(ms / SECOND) * SECOND);
  const days = Math.floor(remaining / DAY);
  const hours = Math.floor((remaining % DAY) / HOUR);
  const minutes = Math.floor((remaining % HOUR) / MINUTE);
  const seconds = Math.floor((remaining % MINUTE) / SECOND);
  const clock = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return days > 0 ? `${days}D ${clock}` : clock;
}

/**
 * Short age of a news item.
 *
 * @param ms milliseconds since publication; future times read "just now".
 * @returns "just now", "12m ago", "3h ago" or "2d ago".
 */
export function formatAgo(ms: number): string {
  if (ms < MINUTE) return "just now";
  if (ms < HOUR) return `${Math.floor(ms / MINUTE)}m ago`;
  if (ms < DAY) return `${Math.floor(ms / HOUR)}h ago`;
  return `${Math.floor(ms / DAY)}d ago`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * A fixed UTC timestamp such as "14 Sep 18:29 UTC". Built by hand rather than
 * with Intl so server and browser render identical text before hydration.
 */
export function formatUtcStamp(iso: string): string {
  const d = new Date(iso);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

/**
 * The next Saturday at `hour`:00 local time strictly after `from` — the sample
 * qualifying slot used by the design mockups until real schedules are ingested.
 */
export function nextSaturdayAt(from: Date, hour: number): Date {
  const target = new Date(from);
  target.setHours(hour, 0, 0, 0);
  const daysUntilSaturday = (6 - target.getDay() + 7) % 7;
  target.setDate(target.getDate() + daysUntilSaturday);
  if (target <= from) {
    target.setDate(target.getDate() + 7);
  }
  return target;
}

/**
 * A lap time as a timing screen shows it: "1:35.587", or "58.214" when the lap
 * is under a minute.
 */
export function formatLapTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds - minutes * 60;
  return minutes > 0 ? `${minutes}:${rest.toFixed(3).padStart(6, "0")}` : rest.toFixed(3);
}
