export type TyreCompound = "soft" | "medium" | "hard" | "inter" | "wet";

const COMPOUNDS: Record<TyreCompound, { ring: string; letter: string; name: string }> = {
  soft: { ring: "border-tyre-soft", letter: "S", name: "Soft" },
  medium: { ring: "border-tyre-medium", letter: "M", name: "Medium" },
  hard: { ring: "border-tyre-hard", letter: "H", name: "Hard" },
  inter: { ring: "border-tyre-inter", letter: "I", name: "Intermediate" },
  wet: { ring: "border-tyre-wet", letter: "W", name: "Wet" },
};

/** A tyre compound as a coloured sidewall ring with its letter inside. */
export function TyreDot({ compound, showName = false }: { compound: TyreCompound; showName?: boolean }) {
  const c = COMPOUNDS[compound];
  return (
    <span className="inline-flex items-center gap-2">
      <span
        role="img"
        aria-label={`${c.name} tyre`}
        className={`inline-grid size-6 place-items-center rounded-full border-[3px] bg-asphalt font-mono text-[10px] font-bold ${c.ring}`}
      >
        <span aria-hidden="true">{c.letter}</span>
      </span>
      {showName && <span className="text-sm">{c.name}</span>}
    </span>
  );
}
