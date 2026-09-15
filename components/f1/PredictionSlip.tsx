import { ClipboardList } from "lucide-react";
import { SlantTag } from "@/components/f1/SlantTag";

/** A predictions-game entry laid out like a race-strategy sheet. */
export function PredictionSlip({
  event,
  locksAt,
  picks,
  boldCall,
}: {
  event: string;
  locksAt: string;
  picks: { label: string; pick: string }[];
  boldCall: string;
}) {
  return (
    <div className="pit-board border border-line bg-carbon">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <span className="headline flex items-center gap-2 text-sm">
          <ClipboardList size={16} className="text-box-red" aria-hidden="true" />
          Strategy sheet
        </span>
        <span className="text-xs text-fg-dim">{event}</span>
      </div>
      <dl className="px-4">
        {picks.map((p) => (
          <div key={p.label} className="flex items-center justify-between border-b border-dashed border-line py-2">
            <dt className="text-xs font-bold uppercase text-fg-dim">{p.label}</dt>
            <dd className="font-mono font-bold">{p.pick}</dd>
          </div>
        ))}
        <div className="flex flex-col gap-1.5 py-3">
          <dt>
            <SlantTag tone="yellow">Bold call</SlantTag>
          </dt>
          <dd className="text-sm font-semibold">{boldCall}</dd>
        </div>
      </dl>
      <div className="border-t border-line px-4 py-2 text-xs text-fg-dim">Locks at {locksAt.toLowerCase()}</div>
    </div>
  );
}
