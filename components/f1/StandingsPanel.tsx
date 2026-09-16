"use client";

import { useState } from "react";
import { TimingTower } from "@/components/f1/TimingTower";
import type { StandingRow } from "@/lib/standings";

type Mode = "drivers" | "constructors";

function toTowerRows(rows: StandingRow[]) {
  const leader = rows[0]?.points ?? 0;
  return rows.map((r, i) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    color: r.color,
    href: r.href,
    value: `${r.points} PTS`,
    detail: i === 0 ? "LEADER" : `−${leader - r.points}`,
  }));
}

/** Championship timing tower with slanted Drivers / Constructors tabs. */
export function StandingsPanel({
  drivers,
  constructors,
}: {
  drivers: StandingRow[];
  constructors: StandingRow[];
}) {
  const [mode, setMode] = useState<Mode>("drivers");
  const tabs: { id: Mode; label: string }[] = [
    { id: "drivers", label: "Drivers" },
    { id: "constructors", label: "Constructors" },
  ];

  return (
    <div>
      <div role="tablist" aria-label="Championship" className="flex gap-1 border-b border-line p-2">
        {tabs.map((tab) => {
          const selected = mode === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`tab-${tab.id}`}
              aria-selected={selected}
              aria-controls="standings-tower"
              onClick={() => setMode(tab.id)}
              className={`slant min-h-11 px-4 text-sm font-bold uppercase transition-colors ${
                selected ? "bg-box-red text-asphalt" : "text-fg-dim hover:bg-kerb hover:text-fg"
              }`}
            >
              <span className="unslant">{tab.label}</span>
            </button>
          );
        })}
      </div>
      <div id="standings-tower" role="tabpanel" aria-labelledby={`tab-${mode}`}>
        <TimingTower
          label={mode === "drivers" ? "Driver standings" : "Constructor standings"}
          rows={toTowerRows(mode === "drivers" ? drivers : constructors)}
        />
      </div>
    </div>
  );
}
