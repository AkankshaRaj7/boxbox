"use client";

import { motion, useReducedMotion } from "framer-motion";
import { TeamColorBar } from "@/components/f1/TeamColorBar";

export type TowerRow = {
  id: string;
  code: string;
  name: string;
  color: string;
  /** Primary right-hand figure, e.g. points or a lap time. */
  value: string;
  /** Secondary figure shown from the sm breakpoint, e.g. the gap to the leader. */
  detail?: string;
};

/**
 * Broadcast-style timing tower. Rows animate into their new order when the
 * ranking changes; on mobile only position, livery, code and value are shown.
 */
export function TimingTower({ rows, label }: { rows: TowerRow[]; label: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <ol aria-label={label} className="divide-y divide-line">
      {rows.map((row, i) => (
        <motion.li
          key={row.id}
          layout={!reduceMotion}
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
          className="group flex min-h-11 items-center gap-3 px-3 py-2 transition-colors hover:bg-kerb"
        >
          <span className="w-5 text-right font-mono text-sm tabular-nums text-fg-dim">{i + 1}</span>
          <TeamColorBar color={row.color} className="h-6 self-center group-hover:brightness-125" />
          <span className="w-12 font-mono font-bold">{row.code}</span>
          <span className="hidden flex-1 truncate text-sm text-fg-dim sm:block">{row.name}</span>
          <span className="ml-auto flex items-baseline gap-3 sm:ml-0">
            {row.detail && (
              <span className="hidden w-12 text-right font-mono text-xs tabular-nums text-fg-dim sm:inline">
                {row.detail}
              </span>
            )}
            <span className="font-mono text-sm tabular-nums">{row.value}</span>
          </span>
        </motion.li>
      ))}
    </ol>
  );
}
