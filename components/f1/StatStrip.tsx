export type Stat = { label: string; value: string };

/** A row of pit-board figures separated by hairlines; wraps to three columns on small screens. */
export function StatStrip({ stats, className = "" }: { stats: Stat[]; className?: string }) {
  return (
    <dl className={`grid grid-cols-3 gap-px bg-line sm:grid-cols-6 ${className}`}>
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col-reverse bg-carbon px-3 py-2.5">
          <dt className="text-xs font-bold uppercase text-fg-dim">{stat.label}</dt>
          <dd className="font-mono text-xl font-bold tabular-nums">{stat.value}</dd>
        </div>
      ))}
    </dl>
  );
}
