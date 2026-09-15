import type { CSSProperties, ReactNode } from "react";

/** A gradient stop coloured with a CSS expression, since `stop-color` attributes can't read variables. */
function Stop({ offset, color, opacity }: { offset: number; color: string; opacity?: number }) {
  const style: CSSProperties = { stopColor: color, stopOpacity: opacity };
  return <stop offset={offset} style={style} />;
}

const TEAM = "var(--team)";
const shade = (percent: number) => `color-mix(in srgb, var(--team) ${percent}%, var(--color-asphalt))`;
const shine = (percent: number) => `color-mix(in srgb, var(--team) ${percent}%, var(--color-fg))`;

/** Draws `children` on the left half of the 400-wide car and mirrors them onto the right. */
function Pair({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <g transform="translate(400 0) scale(-1 1)">{children}</g>
    </>
  );
}

/**
 * Our own top-down drawing of a 2026-style single-seater for the lights-out
 * intro: a four-element front wing, stepped nose, halo, sculpted sidepods with
 * undercuts, coke-bottle engine cover, floor edges, suspension, wide rear tyres,
 * diffuser and rear wing, shaded in `--team` (set it with `teamStyle`). It is a
 * generic car with no logos, sponsors or team-specific livery.
 *
 * The drawing is 400 × 1080 (CAR_ASPECT) with the nose at the top; the rear
 * axle sits at y 915 (REAR_AXLE) and the rear tyres span x 10–86 and 314–390,
 * which the tyre marks in globals.css line up with.
 *
 * @param idPrefix makes gradient ids unique when several cars share a page.
 */
export function IntroCar({ idPrefix = "car", className = "" }: { idPrefix?: string; className?: string }) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;

  return (
    <svg viewBox="0 0 400 1080" className={`block h-full w-full ${className}`} aria-hidden="true" focusable="false">
      <defs>
        {/* Bodywork: dark flanks, bright crown, a highlight down the spine. */}
        <linearGradient id={id("body")} x1="0" x2="1" y1="0" y2="0">
          <Stop offset={0} color={shade(40)} />
          <Stop offset={0.22} color={TEAM} />
          <Stop offset={0.46} color={shine(72)} />
          <Stop offset={0.54} color={shine(72)} />
          <Stop offset={0.78} color={TEAM} />
          <Stop offset={1} color={shade(40)} />
        </linearGradient>
        {/* Sidepods: shadowed undercut outboard, lit shoulder inboard. */}
        <linearGradient id={id("pod")} x1="0" x2="1" y1="0" y2="0">
          <Stop offset={0} color={shade(30)} />
          <Stop offset={0.3} color={shade(75)} />
          <Stop offset={0.7} color={TEAM} />
          <Stop offset={1} color={shine(82)} />
        </linearGradient>
        <linearGradient id={id("plate")} x1="0" x2="0" y1="0" y2="1">
          <Stop offset={0} color={shine(80)} />
          <Stop offset={1} color={shade(50)} />
        </linearGradient>
        {/* Tyres: rounded shoulders and a worn, slightly lighter tread. */}
        <linearGradient id={id("tyre")} x1="0" x2="1" y1="0" y2="0">
          <Stop offset={0} color="var(--color-asphalt)" />
          <Stop offset={0.18} color="var(--color-carbon)" />
          <Stop offset={0.5} color="var(--color-kerb)" />
          <Stop offset={0.82} color="var(--color-carbon)" />
          <Stop offset={1} color="var(--color-asphalt)" />
        </linearGradient>
        <linearGradient id={id("halo")} x1="0" x2="1" y1="0" y2="0">
          <Stop offset={0} color="var(--color-line)" />
          <Stop offset={0.5} color="var(--color-fg-dim)" />
          <Stop offset={1} color="var(--color-line)" />
        </linearGradient>
        <radialGradient id={id("helmet")} cx="0.38" cy="0.32" r="0.72">
          <Stop offset={0} color="var(--color-fg)" />
          <Stop offset={1} color="var(--color-fg-dim)" />
        </radialGradient>
        <radialGradient id={id("sheen")} cx="0.5" cy="0.5" r="0.5">
          <Stop offset={0} color="var(--color-fg)" opacity={0.22} />
          <Stop offset={1} color="var(--color-fg)" opacity={0} />
        </radialGradient>
        <pattern id={id("weave")} width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" className="fill-carbon" />
          <path d="M0 0h3v3H0zM3 3h3v3H3z" className="fill-kerb" opacity="0.8" />
        </pattern>
      </defs>

      {/* Floor: a slim edge beyond the sidepods, with fences and a scrolled trailing edge */}
      <path
        d="M140 446 C118 450 100 466 90 494 L76 556 L72 800 C74 838 86 870 106 894 L150 946 L250 946 L294 894 C314 870 326 838 328 800 L324 556 L310 494 C300 466 282 450 260 446 Z"
        fill={url("weave")}
      />
      <Pair>
        <path d="M72 600 L86 590 M72 640 L86 630 M72 680 L86 670 M72 720 L86 710 M74 760 L88 750" className="stroke-line" strokeWidth="2.5" />
        <path d="M76 556 L72 800 C74 838 86 870 106 894 L150 946" fill="none" className="stroke-kerb" strokeWidth="3" />
      </Pair>

      {/* Diffuser with strakes, and the beam wing above it */}
      <path d="M112 944 L288 944 L302 1006 L98 1006 Z" fill={url("weave")} />
      <path d="M136 948 L130 1004 M166 948 L162 1004 M234 948 L238 1004 M264 948 L270 1004" className="stroke-asphalt" strokeWidth="3" />

      {/* Rear suspension, brake ducts and tyres */}
      <Pair>
        <path d="M184 888 L86 900 L86 910 L184 900 Z" className="fill-carbon" />
        <path d="M186 934 L86 922 L86 932 L186 948 Z" className="fill-carbon" />
        <rect x="86" y="866" width="18" height="96" rx="7" className="fill-carbon stroke-line" strokeWidth="1.5" />
        <rect x="10" y="838" width="76" height="154" rx="24" fill={url("tyre")} />
        <rect x="16" y="846" width="64" height="138" rx="19" fill="none" className="stroke-kerb" strokeWidth="1.5" opacity="0.7" />
        <rect x="38" y="848" width="20" height="134" rx="10" className="fill-fg" opacity="0.05" />
      </Pair>

      {/* Front suspension, brake ducts and tyres */}
      <Pair>
        <path d="M178 212 L70 226 L70 234 L178 226 Z" className="fill-carbon" />
        <path d="M178 262 L70 244 L70 252 L178 276 Z" className="fill-carbon" />
        <path d="M170 276 L74 232" className="stroke-line" strokeWidth="3" />
        <rect x="70" y="194" width="17" height="86" rx="7" className="fill-carbon stroke-line" strokeWidth="1.5" />
        <rect x="12" y="162" width="58" height="146" rx="20" fill={url("tyre")} />
        <rect x="18" y="170" width="46" height="130" rx="16" fill="none" className="stroke-kerb" strokeWidth="1.5" opacity="0.7" />
        <rect x="33" y="172" width="16" height="126" rx="8" className="fill-fg" opacity="0.05" />
      </Pair>

      {/* Front wing: main plane and three flaps, alternating carbon and team colour */}
      <path d="M22 112 C80 100 150 96 200 96 C250 96 320 100 378 112 L378 138 C320 128 250 124 200 124 C150 124 80 128 22 138 Z" fill={url("weave")} />
      <path d="M26 90 C86 76 150 72 200 72 C250 72 314 76 374 90 L374 106 C314 93 250 89 200 89 C150 89 86 93 26 106 Z" fill={url("body")} />
      <path d="M34 70 C94 56 156 52 200 52 C244 52 306 56 366 70 L366 82 C306 69 244 65 200 65 C156 65 94 69 34 82 Z" fill={url("weave")} />
      <path d="M44 52 C100 40 160 36 200 36 C240 36 300 40 356 52 L356 62 C300 51 240 47 200 47 C160 47 100 51 44 62 Z" fill={url("body")} />
      <Pair>
        <path d="M10 28 L34 22 C40 60 42 100 40 142 L12 148 Z" fill={url("plate")} />
        <path d="M12 148 L40 142 L60 156 L18 162 Z" className="fill-carbon" />
        <rect x="120" y="100" width="5" height="40" rx="2" className="fill-carbon" />
      </Pair>

      {/* Sidepods: deep inlets, undercut shadow, lit shoulder, coke-bottle taper */}
      <Pair>
        <path d="M162 448 C134 450 112 458 102 474 L92 520 C86 560 86 620 90 660 C98 740 116 800 146 852 C156 870 166 890 174 906 L182 906 L170 448 Z" fill={url("pod")} />
        <path d="M104 472 C114 460 134 454 162 452 L162 488 C138 490 120 496 106 508 Z" className="fill-asphalt" />
        <path d="M104 472 C114 460 134 454 162 452" fill="none" className="stroke-fg" strokeWidth="2" opacity="0.25" />
        <path d="M94 540 C88 600 90 660 98 712" fill="none" stroke={shade(30)} strokeWidth="10" strokeLinecap="round" opacity="0.75" />
        <path d="M124 540 C120 630 128 720 152 804" fill="none" stroke={shine(78)} strokeWidth="4" strokeLinecap="round" opacity="0.35" />
        <path d="M156 690 L172 694 M154 708 L170 712 M152 726 L168 730 M150 744 L166 748" stroke={shade(35)} strokeWidth="2.5" strokeLinecap="round" />
      </Pair>

      {/* Mirrors: aerofoil housings on stalks */}
      <Pair>
        <path d="M156 476 L126 462" className="stroke-carbon" strokeWidth="5" strokeLinecap="round" />
        <path d="M90 454 C96 444 128 444 134 454 L132 466 C124 472 100 472 92 466 Z" fill={url("pod")} />
        <path d="M96 456 L128 456" className="stroke-asphalt" strokeWidth="3" opacity="0.6" />
      </Pair>

      {/* Nose, chassis, engine cover and gearbox, with camera pods and a highlight */}
      <path
        d="M200 22 C214 22 221 36 222 64 L227 170 C230 230 238 300 244 360 L250 460 C254 540 256 640 252 740 C248 820 238 880 224 940 L220 1002 L180 1002 L176 940 C162 880 152 820 148 740 C144 640 146 540 150 460 L156 360 C162 300 170 230 173 170 L178 64 C179 36 186 22 200 22 Z"
        fill={url("body")}
      />
      <ellipse cx="200" cy="660" rx="42" ry="230" fill={url("sheen")} />
      <path d="M200 34 L200 396" stroke={shine(50)} strokeWidth="3" opacity="0.5" />
      <path d="M176 176 C170 250 162 320 158 380 M224 176 C230 250 238 320 242 380" fill="none" stroke={shade(45)} strokeWidth="2" opacity="0.55" />
      <Pair>
        <ellipse cx="170" cy="302" rx="4" ry="11" className="fill-carbon" />
      </Pair>

      {/* Airbox with camera pod, and the shark fin */}
      <path d="M176 612 C176 584 224 584 224 612 L220 646 L180 646 Z" fill={url("weave")} />
      <rect x="186" y="598" width="28" height="10" rx="4" className="fill-flag-yellow" />
      <rect x="196" y="650" width="8" height="250" rx="4" fill={shade(55)} />

      {/* Cockpit, driver and halo */}
      <path d="M174 432 C174 406 226 406 226 432 L221 564 C221 580 179 580 179 564 Z" className="fill-asphalt" />
      <path d="M174 432 C174 406 226 406 226 432 L221 564 C221 580 179 580 179 564 Z" fill="none" className="stroke-carbon" strokeWidth="5" />
      <circle cx="200" cy="508" r="23" fill={url("helmet")} />
      <rect x="195" y="486" width="10" height="44" rx="5" fill={TEAM} />
      <path d="M180 496 Q200 478 220 496 L216 504 Q200 490 184 504 Z" className="fill-asphalt" opacity="0.9" />
      <path
        d="M200 398 C232 400 242 428 240 468 C238 500 230 530 222 554 M200 398 C168 400 158 428 160 468 C162 500 170 530 178 554"
        fill="none"
        stroke={url("halo")}
        strokeWidth="11"
        strokeLinecap="round"
      />
      <path d="M200 370 L200 404" stroke={url("halo")} strokeWidth="11" strokeLinecap="round" />

      {/* Rear wing: swan neck, beam wing, main plane, team-colour flap and endplates, rain light */}
      <rect x="194" y="956" width="12" height="70" rx="3" className="fill-carbon" />
      <path d="M112 990 L288 990 L288 1004 L112 1004 Z" fill={url("weave")} />
      <path d="M76 1012 C140 1003 260 1003 324 1012 L324 1036 C260 1027 140 1027 76 1036 Z" fill={url("weave")} />
      <path d="M80 1042 C140 1035 260 1035 320 1042 L320 1060 C260 1053 140 1053 80 1060 Z" fill={url("body")} />
      <Pair>
        <path d="M60 996 L80 990 L84 1074 L64 1078 Z" fill={url("plate")} />
      </Pair>
      <rect x="186" y="1064" width="28" height="10" rx="2" className="fill-box-red" />
    </svg>
  );
}
