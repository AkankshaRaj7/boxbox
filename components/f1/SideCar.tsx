import type { CSSProperties } from "react";
import { Helmet } from "@/components/f1/Helmet";
import { groundCut, type CarArt, type Circle } from "@/lib/car-art";
import type { HelmetDesign } from "@/lib/helmet-designs";

function Stop({ offset, color, opacity }: { offset: number; color: string; opacity?: number }) {
  const style: CSSProperties = { stopColor: color, stopOpacity: opacity };
  return <stop offset={offset} style={style} />;
}

/** Sidewall band colour for each tyre compound. */
const COMPOUND_BANDS = { soft: "stroke-tyre-soft", medium: "stroke-tyre-medium", hard: "stroke-tyre-hard" } as const;

/** An 18-inch wheel seen side on: tyre with rounded shoulders, compound band, rim and a wheel cover in the livery or dark. */
function Wheel({
  x,
  y,
  r,
  url,
  far = false,
  compound = "medium",
  cover,
}: Circle & { url: (name: string) => string; far?: boolean; compound?: CarArt["compound"]; cover?: string }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill={far ? "var(--color-carbon)" : url("tyre")} />
      {!far && <circle cx={x} cy={y} r={r * 0.97} fill="none" className="stroke-kerb" strokeWidth={r * 0.05} opacity="0.5" />}
      {!far && (
        <>
          <circle cx={x} cy={y} r={r * 0.8} fill="none" className={COMPOUND_BANDS[compound]} strokeWidth={r * 0.035} opacity="0.85" />
          <circle cx={x} cy={y} r={r * 0.64} fill={url("rim")} />
          <circle cx={x} cy={y} r={r * 0.6} fill={cover ?? url("cover")} />
          {cover && <circle cx={x} cy={y} r={r * 0.6} fill={url("cover")} opacity="0.35" />}
          <circle cx={x} cy={y} r={r * 0.42} fill="none" className="stroke-line" strokeWidth="1.5" opacity="0.7" />
          <circle cx={x} cy={y} r={r * 0.11} fill={url("rim")} />
          <path
            d={`M${x - r * 0.52} ${y - r * 0.3} A${r * 0.6} ${r * 0.6} 0 0 1 ${x + r * 0.1} ${y - r * 0.6}`}
            fill="none"
            className="stroke-fg"
            strokeWidth="2"
            opacity="0.25"
          />
        </>
      )}
      {/* Tread shoulder catching the light from above */}
      <path
        d={`M${x - r * 0.82} ${y - r * 0.56} A${r * 0.99} ${r * 0.99} 0 0 1 ${x + r * 0.6} ${y - r * 0.79}`}
        fill="none"
        className="stroke-fg"
        strokeWidth="2.5"
        opacity="0.18"
      />
    </g>
  );
}

/**
 * A team's 2026 car, side on with the nose to the right, drawn from
 * `lib/car-art.ts`: the real silhouette in dark bodywork, livery panels,
 * shading and highlights, wheels, cockpit with the driver's helmet, halo and
 * mirror. No sponsor or team logos.
 *
 * @param helmet the design of the helmet shown in the cockpit.
 * @param idPrefix makes gradient, clip and filter ids unique when several cars share a page.
 */
export function SideCar({
  art,
  helmet,
  idPrefix = "side-car",
  className = "",
}: {
  art: CarArt;
  helmet: HelmetDesign;
  idPrefix?: string;
  className?: string;
}) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  const [rear, front] = art.wheels;
  const { cockpit } = art;
  const helmetHeight = (cockpit.helmet.width * 230) / 270;
  // The far-side wheels are only visible above the top line of the nose.
  const [noseLine] = art.highlights;
  const noseStart = noseLine.match(/^M(-?[\d.]+)/)?.[1] ?? "0";
  const aboveNose = `${noseLine} L${art.width} 0 L${noseStart} 0 Z`;

  return (
    <svg viewBox={`0 0 ${art.width} ${art.height}`} className={`block h-auto ${className}`} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={id("silhouette")}>
          <path d={art.outline} />
        </clipPath>
        <clipPath id={id("above-nose")}>
          <path d={aboveNose} />
        </clipPath>
        <clipPath id={id("floor-cut")}>
          <path d={art.floorCut ?? groundCut(art)} />
        </clipPath>
        <filter id={id("soft")} x="-5%" y="-20%" width="110%" height="140%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
        <filter id={id("blur")} x="-10%" y="-40%" width="120%" height="180%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={id("shadow")} x="-10%" y="-200%" width="120%" height="500%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
        {/* Light from above: lit upper surfaces, shadow gathering low on the flanks and floor. */}
        <linearGradient id={id("light")} x1="0" x2="0" y1="0" y2="1">
          <Stop offset={0} color="var(--color-fg)" opacity={0.32} />
          <Stop offset={0.22} color="var(--color-fg)" opacity={0.1} />
          <Stop offset={0.48} color="var(--color-asphalt)" opacity={0} />
          <Stop offset={0.78} color="var(--color-asphalt)" opacity={0.32} />
          <Stop offset={1} color="var(--color-asphalt)" opacity={0.58} />
        </linearGradient>
        <radialGradient id={id("tyre")}>
          <Stop offset={0.55} color="var(--color-carbon)" />
          <Stop offset={0.86} color="var(--color-kerb)" />
          <Stop offset={1} color="var(--color-asphalt)" />
        </radialGradient>
        <radialGradient id={id("rim")} cx="0.4" cy="0.35" r="0.75">
          <Stop offset={0} color="var(--color-fg-dim)" />
          <Stop offset={1} color="var(--color-line)" />
        </radialGradient>
        <radialGradient id={id("cover")} cx="0.42" cy="0.38" r="0.7">
          <Stop offset={0} color="var(--color-kerb)" />
          <Stop offset={1} color="var(--color-asphalt)" />
        </radialGradient>
      </defs>

      {/* Ground shadow */}
      <ellipse
        cx={art.width / 2}
        cy={art.ground}
        rx={art.width * 0.44}
        ry="7"
        className="fill-asphalt"
        opacity="0.85"
        filter={url("shadow")}
      />

      <g clipPath={url("silhouette")}>
        <g clipPath={url("floor-cut")}>
          <rect width={art.width} height={art.height} fill={art.base} />
          <g clipPath={url("above-nose")}>
            {art.farWheels.map((w) => (
              <Wheel key={`${w.x}-${w.y}`} {...w} url={url} far />
            ))}
          </g>
          {art.panels.map((panel) => (
            <path key={panel.d} d={panel.d} fill={panel.fill} opacity={panel.opacity} />
          ))}
          {art.details.map((d) => (
            <path key={d} d={d} fill="none" className="stroke-asphalt" strokeWidth="3" opacity="0.55" />
          ))}
          {art.shading.map(({ d, kind }) =>
            kind === "shadow" ? (
              <path key={d} d={d} className="fill-asphalt" opacity="0.55" filter={url("blur")} />
            ) : kind === "arm" ? (
              <g key={d} fill="none" strokeLinecap="round">
                <path d={d} className="stroke-carbon" strokeWidth="6" />
                <path d={d} className="stroke-fg" strokeWidth="1" opacity="0.18" />
              </g>
            ) : (
              <path key={d} d={d} fill="none" className="stroke-fg" strokeWidth="2" opacity="0.22" strokeLinecap="round" />
            ),
          )}
          <rect width={art.width} height={art.height} fill={url("light")} />
        </g>
      </g>

      {/* Driver in the cockpit, then the cockpit rim in front of the helmet's lower edge */}
      <svg
        x={cockpit.helmet.x}
        y={cockpit.helmet.y}
        width={cockpit.helmet.width}
        height={helmetHeight}
        viewBox="0 0 270 230"
        overflow="visible"
      >
        <Helmet design={helmet} idPrefix={id("helmet")} />
      </svg>
      <path d={cockpit.side} fill={art.base} />

      {/* Highlights along the top edges */}
      <g fill="none" className="stroke-fg" strokeLinecap="round" filter={url("soft")}>
        {art.highlights.map((d, i) => (
          <path key={d} d={d} strokeWidth={i === 0 ? 3 : 2} opacity={i === 0 ? 0.5 : 0.28} />
        ))}
      </g>

      {/* Halo and mirror */}
      <path d={cockpit.halo} fill="none" stroke={cockpit.haloColor ?? art.base} strokeWidth="11" strokeLinecap="round" />
      <path d={cockpit.halo} fill="none" className="stroke-fg" strokeWidth="1.5" strokeLinecap="round" opacity="0.35" />
      <path d={cockpit.mirror} fill={art.base} stroke={art.base} strokeWidth="4" strokeLinejoin="round" />

      <Wheel {...rear} url={url} compound={art.compound} cover={art.wheelCover} />
      <Wheel {...front} url={url} compound={art.compound} cover={art.wheelCover} />

      {/* Front wing endplate and other panels outboard of the wheels */}
      {art.foreground.map((panel) => (
        <g key={panel.d} clipPath={url("silhouette")}>
          <path d={panel.d} fill={panel.fill} opacity={panel.opacity} />
          <path d={panel.d} fill={url("light")} />
          <path d={panel.d} fill="none" className="stroke-asphalt" strokeWidth="1.5" opacity="0.4" />
        </g>
      ))}

      <path d={art.rainLight} className="fill-flag-red" />
    </svg>
  );
}
