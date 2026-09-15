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
