import { Flame, Trophy } from "lucide-react";

/** Current prediction streak as a red slanted pin. */
export function StreakFlame({ streak }: { streak: number }) {
  return (
    <span className="slant inline-flex bg-box-red px-3 py-1.5 text-asphalt">
      <span className="unslant flex items-center gap-1.5 text-sm font-bold uppercase">
        <Flame size={16} aria-hidden="true" />
        {streak}-race streak
      </span>
    </span>
  );
}

/** An earned badge as a slanted enamel pin. */
export function EnamelPin({ label }: { label: string }) {
  return (
    <span className="slant inline-flex border border-line bg-kerb px-3 py-1.5 shadow-[2px_2px_0_var(--color-box-red)]">
      <span className="unslant flex items-center gap-1.5 text-sm font-semibold">
        <Trophy size={14} className="text-flag-yellow" aria-hidden="true" />
        {label}
      </span>
    </span>
  );
}
