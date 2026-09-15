export type SectorKind = "fastest" | "pb" | "slower";

const KINDS: Record<SectorKind, { className: string; short: string; long: string }> = {
  fastest: { className: "bg-sector-fastest", short: "Best", long: "fastest overall" },
  pb: { className: "bg-sector-pb", short: "PB", long: "personal best" },
  slower: { className: "bg-sector-slower", short: "Slow", long: "slower than personal best" },
};

/** A sector time in broadcast colours, always paired with a text label. */
export function SectorChip({ label, time, kind }: { label: string; time: string; kind: SectorKind }) {
  const k = KINDS[kind];
  return (
    <span
      className="inline-flex items-stretch overflow-hidden border border-line font-mono text-sm"
      aria-label={`${label} ${time}, ${k.long}`}
    >
      <span className="bg-kerb px-2 py-0.5 text-fg-dim" aria-hidden="true">
        {label}
      </span>
      <span className={`flex items-baseline gap-1.5 px-2 py-0.5 font-bold text-asphalt ${k.className}`} aria-hidden="true">
        {time}
        <span className="text-[10px] uppercase">{k.short}</span>
      </span>
    </span>
  );
}
