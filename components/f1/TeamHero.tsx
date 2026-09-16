import { IntroCar } from "@/components/f1/IntroCar";
import { Panel } from "@/components/f1/Panel";
import { SideCar } from "@/components/f1/SideCar";
import { StatStrip, type Stat } from "@/components/f1/StatStrip";
import { TeamCarPass } from "@/components/f1/TeamCarPass";
import { rearWheelShare, type CarArt } from "@/lib/car-art";
import { teamStyle } from "@/lib/color";
import type { HelmetDesign } from "@/lib/helmet-designs";

/**
 * Top of a team page: name in headline caps in the team colour beside the
 * team's car, then the season figures on a stat strip. Teams with car artwork get their real car
 * side on, driving in on each visit (`TeamCarPass`) and uncovering the text
 * as it passes; the rest show our generic
 * top-down car until theirs is drawn.
 *
 * @param car the team's artwork and the helmet shown in its cockpit.
 */
export function TeamHero({
  name,
  code,
  color,
  facts,
  stats,
  car,
  idPrefix = "team-car",
}: {
  name: string;
  code: string;
  color: string;
  facts: string[];
  stats: Stat[];
  car?: { art: CarArt; helmet: HelmetDesign };
  idPrefix?: string;
}) {
  const body = (
    <div
      className={`grid items-center gap-6 p-4 pl-6 md:p-6 md:pl-8 ${
        car ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,40rem)]" : "md:grid-cols-[1fr_minmax(0,26rem)] lg:grid-cols-[1fr_minmax(0,34rem)]"
      }`}
    >
      <div className="min-w-0" data-reveal>
        <span className="border border-line bg-kerb px-1.5 font-mono text-sm font-bold">{code}</span>
        <h1 id="team-name" className="headline mt-3 break-words text-display text-(--team-text) md:text-hero">
          {name}
        </h1>
        <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-sm text-fg-dim">
          {facts.map((fact) => (
            <span key={fact}>{fact}</span>
          ))}
        </p>
      </div>
      {car ? (
        <div data-parked>
          <SideCar art={car.art} helmet={car.helmet} idPrefix={`${idPrefix}-parked`} className="w-full" />
        </div>
      ) : (
        // The top-down drawing is 400 × 1080 nose-up; turned a quarter clockwise it fills a 27:10 box nose-right.
        <div className="relative aspect-[27/10] w-full">
          <div className="absolute left-1/2 top-1/2 h-[270%] w-[37.037%] -translate-x-1/2 -translate-y-1/2 rotate-90">
            <IntroCar idPrefix={idPrefix} />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Panel style={teamStyle(color)} aria-labelledby="team-name" className="relative">
      <span aria-hidden="true" className="absolute inset-y-0 left-0 z-10 w-1.5 bg-(--team)" />
      {car ? (
        <TeamCarPass
          rearWheel={rearWheelShare(car.art)}
          car={<SideCar art={car.art} helmet={car.helmet} idPrefix={`${idPrefix}-moving`} className="w-full" />}
        >
          {body}
        </TeamCarPass>
      ) : (
        body
      )}
      <StatStrip stats={stats} className="border-t border-line" />
    </Panel>
  );
}
