import type { FormEntry, FormKind } from "@/lib/season";

const KINDS: Record<FormKind, string> = {
  win: "bg-fg text-asphalt",
  podium: "bg-fg text-asphalt",
  points: "border border-line bg-kerb text-fg",
  finish: "border border-line bg-carbon text-fg-dim",
  out: "border border-flag-red bg-carbon text-flag-red",
};

/**
 * Recent Grand Prix results as slanted chips, oldest first. Every chip carries
 * its round and result as text; wins add a chequered edge, podiums fill in and
 * retirements take a red outline.
 */
export function FormChips({ form, label = "Recent Grand Prix results" }: { form: FormEntry[]; label?: string }) {
  return (
    <ol aria-label={label} className="flex flex-wrap gap-2">
      {form.map((entry) => (
        <li
          key={entry.round}
          aria-label={`Round ${entry.round}: ${entry.label}`}
          className={`slant flex items-stretch overflow-hidden font-mono ${KINDS[entry.kind]}`}
        >
          {entry.kind === "win" && <span aria-hidden="true" className="chequered w-2 shrink-0" />}
          <span className="unslant flex items-baseline gap-1.5 px-2.5 py-1.5">
            <span className="text-xs">R{entry.round}</span>
            <span className="text-base font-bold">{entry.label}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}
