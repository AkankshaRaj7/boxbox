"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
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
  /** Makes the whole row a link, e.g. to the driver's page. */
  href?: string;
};

const ROW = "flex min-h-11 items-center gap-3 px-3 py-2 transition-colors hover:bg-kerb";

function Cells({ row, position }: { row: TowerRow; position: number }) {
  return (
    <>
      <span className="w-5 text-right font-mono text-sm tabular-nums text-fg-dim">{position}</span>
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
    </>
  );
}

/**
 * Broadcast-style timing tower. Rows animate into their new order when the
 * ranking changes; on mobile only position, livery, code and value are shown.
 * Rows with an `href` link to their driver or team page.
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
          className="group"
        >
          {row.href ? (
            <Link href={row.href} className={ROW}>
              <Cells row={row} position={i + 1} />
            </Link>
          ) : (
            <div className={ROW}>
              <Cells row={row} position={i + 1} />
            </div>
          )}
        </motion.li>
      ))}
    </ol>
  );
}
