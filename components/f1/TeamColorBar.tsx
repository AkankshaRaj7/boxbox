import { teamStyle } from "@/lib/color";

/** The 4px livery bar that marks anything belonging to a driver or team. */
export function TeamColorBar({ color, className = "" }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      style={teamStyle(color)}
      className={`block w-1 shrink-0 self-stretch bg-(--team) ${className}`}
    />
  );
}
