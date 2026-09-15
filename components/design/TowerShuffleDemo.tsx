"use client";

import { ArrowUpDown } from "lucide-react";
import { useState } from "react";
import { TimingTower, type TowerRow } from "@/components/f1/TimingTower";

/** Style-guide demo: P3 overtakes P2 on each press so the tower's reorder animation can be checked. */
export function TowerShuffleDemo({ rows }: { rows: TowerRow[] }) {
  const [order, setOrder] = useState(rows);

  const overtake = () =>
    setOrder((current) => {
      if (current.length < 3) return current;
      const next = [...current];
      [next[1], next[2]] = [next[2], next[1]];
      return next;
    });

  return (
    <div>
      <div className="flex justify-end border-b border-line p-2">
        <button
          type="button"
          onClick={overtake}
          className="slant min-h-11 bg-kerb px-4 text-sm font-bold uppercase hover:bg-line"
        >
          <span className="unslant flex items-center gap-2">
            <ArrowUpDown size={14} aria-hidden="true" />
            Overtake
          </span>
        </button>
      </div>
      <TimingTower rows={order} label="Timing tower demo" />
    </div>
  );
}
