"use client";

import { RotateCcw } from "lucide-react";
import { useState } from "react";
import { LightsOut } from "@/components/f1/LightsOut";

/** Style-guide demo that replays the lights-out sequence inline. */
export function LightsReplay() {
  const [run, setRun] = useState(0);
  return (
    <div className="border border-line bg-asphalt">
      <LightsOut inline key={run} />
      <div className="flex justify-end border-t border-line p-2">
        <button
          type="button"
          onClick={() => setRun((r) => r + 1)}
          className="slant min-h-11 bg-kerb px-4 text-sm font-bold uppercase hover:bg-line"
        >
          <span className="unslant flex items-center gap-2">
            <RotateCcw size={14} aria-hidden="true" />
            Replay
          </span>
        </button>
      </div>
    </div>
  );
}
