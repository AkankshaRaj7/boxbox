import Image from "next/image";
import Link from "next/link";
import { Helmet } from "@/components/f1/Helmet";
import { Panel } from "@/components/f1/Panel";
import { StatStrip, type Stat } from "@/components/f1/StatStrip";
import { teamStyle } from "@/lib/color";
import type { HelmetDesign } from "@/lib/helmet-designs";

/**
 * With a photo: photo column, name, and the helmet column from md up. Shared by
 * the panel and the photo overlay, so the photo's column lines up with the panel's.
 */
const GRID =
  "grid grid-cols-[7rem_minmax(0,1fr)] gap-4 p-4 pl-6 sm:grid-cols-[11rem_minmax(0,1fr)] md:grid-cols-[12rem_minmax(0,1fr)_9rem] md:gap-6 md:p-6 md:pl-8 lg:grid-cols-[16rem_minmax(0,1fr)_13rem] xl:grid-cols-[18rem_minmax(0,1fr)_16rem]";

/** Without a photo: the helmet takes the first column. */
const GRID_PLAIN =
  "grid gap-4 p-4 pl-6 sm:grid-cols-[minmax(0,14rem)_1fr] md:gap-8 md:p-6 md:pl-8 lg:grid-cols-[minmax(0,18rem)_1fr]";

/**
 * Top of a driver page: the driver's cut-out photo standing in the panel and
 * breaking out over its top edge, race number in the team colour, surname in
 * headline caps with a glowing team-colour outline, the driver's helmet large
 * on the right facing the photo, team and facts, then the season figures.
 * Without a photo the helmet takes the photo's place.
 *
 * The photo sits in an overlay above the panel, because the panel's cut
 * corner is a clip-path that would clip anything above its edge.
 *
 * @param photo public path of a transparent 600 × 800 cut-out, bottom-centred.
 */
export function DriverHero({
  number,
  helmet,
  photo,
  code,
  givenName,
  familyName,
  color,
  team,
  facts,
  note,
  stats,
  idPrefix = "driver-helmet",
}: {
  number: string | null;
  helmet: HelmetDesign;
  photo?: string | null;
  code: string;
  givenName: string;
  familyName: string;
  color: string;
  team: { name: string; href?: string };
  /** Short plain facts, e.g. nationality and age. */
  facts: string[];
  /** A line under the facts, e.g. a mid-season team change. */
  note?: string;
  stats: Stat[];
  idPrefix?: string;
}) {
  const teamLabel = (
    <>
      <span aria-hidden="true" className="slant block h-3 w-4 bg-(--team)" />
      {team.name}
    </>
  );

  return (
    <section aria-labelledby="driver-name" style={teamStyle(color)} className={photo ? "mt-14 md:mt-20" : ""}>
      <div className="relative">
        <Panel as="div" className="relative">
          <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1.5 bg-(--team)" />
          {photo && (
            <>
              <span aria-hidden="true" className="driver-spotlight absolute inset-y-0 left-0 w-3/5" />
              <span aria-hidden="true" className="driver-spotlight absolute inset-y-0 right-0 hidden w-2/5 -scale-x-100 md:block" />
            </>
          )}
          <div className={`relative items-center ${photo ? GRID : GRID_PLAIN}`}>
            {photo ? (
              <div className="min-h-44 self-stretch md:min-h-60" />
            ) : (
              <Helmet design={helmet} number={number} idPrefix={idPrefix} className="w-full" />
            )}
            <div className="min-w-0">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-4">
                <div className="flex items-end gap-3">
                  {number && (
                    <span className="headline text-display leading-[0.8] tabular-nums text-(--team-text) sm:text-hero md:text-mega">
                      <span className="sr-only">Car </span>
                      {number}
                    </span>
                  )}
                  {photo && (
                    <div aria-hidden="true" className="w-24 shrink-0 sm:w-28 md:hidden">
                      <Helmet design={helmet} idPrefix={`${idPrefix}-inline`} className="w-full -scale-x-100" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-lg leading-tight text-fg-dim md:text-xl">{givenName}</p>
                  <h1
                    id="driver-name"
                    className="headline team-glow break-words text-display-sm md:text-display lg:text-hero"
                  >
                    {familyName}
                  </h1>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
                <span className="border border-line bg-kerb px-1.5 font-mono font-bold">{code}</span>
                {team.href ? (
                  <Link href={team.href} className="flex items-center gap-2 font-bold text-(--team-text) hover:underline">
                    {teamLabel}
                  </Link>
                ) : (
                  <span className="flex items-center gap-2 font-bold text-(--team-text)">{teamLabel}</span>
                )}
                {facts.map((fact) => (
                  <span key={fact} className="text-fg-dim">
                    {fact}
                  </span>
                ))}
              </div>
              {note && <p className="mt-2 text-sm text-fg-dim">{note}</p>}
            </div>
            {photo && (
              // Mirrored so the helmet faces the driver; the race number would read backwards, so it is left off.
              <div aria-hidden="true" className="hidden md:block">
                <Helmet design={helmet} idPrefix={`${idPrefix}-side`} className="w-full -scale-x-100" />
              </div>
            )}
          </div>
        </Panel>
        {photo && (
          <div aria-hidden="true" className={`pointer-events-none absolute inset-0 z-10 pb-0 md:pb-0 ${GRID}`}>
            <div className="relative self-stretch">
              <Image
                src={photo}
                alt=""
                width={600}
                height={800}
                sizes="(min-width: 1024px) 380px, (min-width: 640px) 240px, 160px"
                loading="eager"
                fetchPriority="high"
                className="driver-pop absolute bottom-0 left-1/2 h-[135%] w-auto max-w-[150%] object-contain object-bottom"
              />
            </div>
          </div>
        )}
      </div>
      <StatStrip stats={stats} className="border-x border-b border-line" />
    </section>
  );
}
