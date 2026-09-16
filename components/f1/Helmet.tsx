import type { CSSProperties } from "react";
import { VISOR_TINTS, type HelmetDesign, type HelmetPattern } from "@/lib/helmet-designs";

function Stop({ offset, color, opacity }: { offset: number; color: string; opacity?: number }) {
  const style: CSSProperties = { stopColor: color, stopOpacity: opacity };
  return <stop offset={offset} style={style} />;
}

/**
 * Shell silhouette facing right, modelled on the proportions of a current
 * closed-face single-seater helmet: high rounded crown, near-vertical back,
 * chin bar projecting forward and a lower edge rising towards the neck.
 */
const SHELL =
  "M130 10 C137 10 145 11 152 13 C158 15 165 18 171 22 C177 26 183 31 188 35 C192 40 197 46 201 51 C205 56 208 62 212 67 C215 73 218 78 221 84 C225 89 228 95 230 102 C233 108 235 114 237 122 C241 131 246 140 251 150 C257 162 261 176 257 190 C253 202 243 210 230 214 C220 216 204 216 193 216 C176 214 154 212 130 209 C107 207 89 204 77 201 C69 201 57 204 50 202 C42 200 38 192 33 186 C28 180 25 173 21 167 C18 160 15 152 13 145 C11 137 10 129 10 122 C10 114 10 106 12 98 C13 90 15 83 19 75 C22 68 27 62 31 56 C36 50 42 44 48 39 C53 34 60 30 66 26 C73 23 80 19 87 17 C94 14 101 13 108 12 C115 11 123 10 130 10 Z";

/** Eyeport and visor: a wide shield from the pivot to a tip just proud of the face. */
const EYEPORT = "M119 104 C138 86 193 79 247 92 C252 110 251 129 245 144 C205 150 166 150 140 141 C125 136 114 120 119 104 Z";
const VISOR = "M122 104 C140 89 192 82 248 95 C252 111 250 128 244 141 C206 147 168 147 143 139 C129 134 118 119 122 104 Z";
/** Upper part of the visor that mirrors the sky; below the horizon it shows the dark ground. */
const VISOR_SKY = "M122 104 C140 89 192 82 248 95 L250 117 C212 110 170 112 128 124 C121 118 119 110 122 104 Z";

const CROWN = "M0 0 H270 V84 C196 64 112 58 0 122 Z";
const LOWER = "M0 170 C70 148 170 150 260 160 V230 H0 Z";
const STRIPE = "M260 64 C190 44 100 56 0 134 V160 C100 84 190 74 260 90 Z";
const BAND = "M104 90 C142 62 206 60 250 78 L252 94 C206 78 150 80 118 104 Z";
const CHIN = "M168 150 C200 146 236 146 270 152 V230 H198 C184 206 174 178 168 150 Z";
const PINSTRIPES = [
  "M236 76 C190 30 104 20 34 72",
  "M18 172 C70 158 116 156 150 160",
  "M16 116 C44 106 76 104 106 112",
];

/** An organic maze from fractal noise: contour bands of the noise become the ink lines. */
function MazeFilter({ id, pattern }: { id: string; pattern: Extract<HelmetPattern, { kind: "maze" }> }) {
  return (
    <filter id={id} x="0" y="0" width="270" height="230" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency={0.022 * pattern.scale} numOctaves={1} seed={pattern.seed} result="noise" />
      <feColorMatrix in="noise" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  3.4 0 0 0 -1.2" result="spread" />
      <feComponentTransfer in="spread" result="bands">
        <feFuncA type="discrete" tableValues="1 0 0 1 0 0 1 0 0 1 0 0 1" />
      </feComponentTransfer>
      {/* Blur and re-threshold so the edges are smooth rather than stepped. */}
      <feGaussianBlur in="bands" stdDeviation="0.9" result="soft" />
      <feComponentTransfer in="soft" result="edges">
        <feFuncA type="linear" slope="3" intercept="-1" />
      </feComponentTransfer>
      <feFlood floodColor={pattern.ink} result="ink" />
      <feComposite in="ink" in2="edges" operator="in" />
    </filter>
  );
}

function PatternLayer({ pattern, filterId }: { pattern: HelmetPattern; filterId: string }) {
  if (pattern.kind === "pinstripes") {
    return (
      <g fill="none" stroke={pattern.ink} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        {PINSTRIPES.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
    );
  }
  return <rect width="270" height="230" fill="none" filter={`url(#${filterId})`} />;
}

function Blur({ id, amount }: { id: string; amount: number }) {
  return (
    <filter id={id} x="-20" y="-20" width="310" height="270" filterUnits="userSpaceOnUse">
      <feGaussianBlur stdDeviation={amount} />
    </filter>
  );
}

/**
 * Our own side-view drawing of a closed-face racing helmet, painted with a
 * driver's design (`lib/helmet-designs.ts`) and finished like clear-coated
 * paint: soft form shadow, studio reflections on the crown, shadow gathering
 * around the eyeport, a smoked visor that mirrors sky and ground with a lit
 * acrylic edge and tear-off stack, a slim pivot plate and a small dark
 * head-and-neck restraint post. No logos.
 *
 * The drawing is 270 × 230, facing right. Size it with a width class.
 *
 * @param number race number, shown on team-colour designs only.
 * @param idPrefix makes gradient, clip and filter ids unique when several helmets share a page.
 */
export function Helmet({
  design,
  number,
  idPrefix = "helmet",
  className = "",
}: {
  design: HelmetDesign;
  number?: string | null;
  idPrefix?: string;
  className?: string;
}) {
  const id = (name: string) => `${idPrefix}-${name}`;
  const url = (name: string) => `url(#${id(name)})`;
  const [tintTop, tintMid, tintBottom] = VISOR_TINTS[design.visor];
  const style = { "--helmet": design.base } as CSSProperties;

  return (
    <svg
      viewBox="0 0 270 230"
      className={`block h-auto ${className}`}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={id("shell")}>
          <path d={SHELL} />
        </clipPath>
        <clipPath id={id("crown")}>
          <path d={CROWN} />
        </clipPath>
        <clipPath id={id("visor-clip")}>
          <path d={VISOR} />
        </clipPath>
        {design.pattern?.kind === "maze" && <MazeFilter id={id("maze")} pattern={design.pattern} />}
        {design.crown?.pattern?.kind === "maze" && <MazeFilter id={id("crown-maze")} pattern={design.crown.pattern} />}
        <Blur id={id("blur-s")} amount={1.2} />
        <Blur id={id("blur-m")} amount={3} />
        <Blur id={id("blur-l")} amount={7} />

        {/* Form: key light from the upper front, the shell turning away into shadow at its edges. */}
        <radialGradient id={id("form")} cx="0.58" cy="0.3" r="0.72">
          <Stop offset={0} color="var(--color-asphalt)" opacity={0} />
          <Stop offset={0.62} color="var(--color-asphalt)" opacity={0.08} />
          <Stop offset={0.88} color="var(--color-asphalt)" opacity={0.42} />
          <Stop offset={1} color="var(--color-asphalt)" opacity={0.62} />
        </radialGradient>
        <linearGradient id={id("ground")} x1="0" x2="0" y1="0" y2="1">
          <Stop offset={0.5} color="var(--color-asphalt)" opacity={0} />
          <Stop offset={0.8} color="var(--color-asphalt)" opacity={0.22} />
          <Stop offset={1} color="var(--color-asphalt)" opacity={0.55} />
        </linearGradient>
        {/* Broad soft sky reflection over the crown. */}
        <radialGradient id={id("sky")} cx="0.52" cy="0.12" r="0.5">
          <Stop offset={0} color="var(--color-fg)" opacity={0.38} />
          <Stop offset={0.6} color="var(--color-fg)" opacity={0.08} />
          <Stop offset={1} color="var(--color-fg)" opacity={0} />
        </radialGradient>
        {/* Visor: smoked acrylic, iridium sheen strongest at the top. */}
        <linearGradient id={id("visor")} x1="0" x2="0.2" y1="0" y2="1">
          <Stop offset={0} color={tintMid} />
          <Stop offset={0.55} color={tintBottom} />
          <Stop offset={1} color="var(--color-asphalt)" />
        </linearGradient>
        <linearGradient id={id("iridium")} x1="0" x2="1" y1="0" y2="0.4">
          <Stop offset={0} color={tintTop} opacity={0} />
          <Stop offset={0.45} color={tintTop} opacity={0.55} />
          <Stop offset={0.8} color={tintMid} opacity={0.35} />
          <Stop offset={1} color={tintMid} opacity={0} />
        </linearGradient>
        <linearGradient id={id("visor-sky")} x1="0" x2="0" y1="0" y2="1">
          <Stop offset={0} color="var(--color-fg)" opacity={0.5} />
          <Stop offset={0.7} color="var(--color-fg)" opacity={0.12} />
          <Stop offset={1} color="var(--color-fg)" opacity={0.02} />
        </linearGradient>
        <linearGradient id={id("plate")} x1="0" x2="0" y1="0" y2="1">
          <Stop offset={0} color="var(--color-line)" />
          <Stop offset={0.35} color="var(--color-carbon)" />
          <Stop offset={1} color="var(--color-asphalt)" />
        </linearGradient>
        <radialGradient id={id("screw")} cx="0.35" cy="0.3" r="0.8">
          <Stop offset={0} color="var(--color-fg)" opacity={0.85} />
          <Stop offset={0.5} color="var(--color-fg-dim)" />
          <Stop offset={1} color="var(--color-line)" />
        </radialGradient>
      </defs>

      {/* Paint: design panels and pattern */}
      <g clipPath={url("shell")}>
        <path d={SHELL} fill="var(--helmet)" />
        {design.crown && (
          <g clipPath={url("crown")}>
            <rect width="270" height="230" fill={design.crown.color} />
            {design.crown.pattern && <PatternLayer pattern={design.crown.pattern} filterId={id("crown-maze")} />}
          </g>
        )}
        {design.lower && <path d={LOWER} fill={design.lower} />}
        {design.generic && <path d={LOWER} fill="color-mix(in srgb, var(--helmet) 62%, var(--color-asphalt))" />}
        {design.stripe && <path d={STRIPE} fill={design.stripe} />}
        {design.chin && <path d={CHIN} fill={design.chin} />}
        {design.pattern && <PatternLayer pattern={design.pattern} filterId={id("maze")} />}
        {design.band && <path d={BAND} fill={design.band} />}

        {/* Light: form shadow, ground bounce, shadow gathering around the eyeport and under the visor */}
        <rect width="270" height="230" fill={url("form")} />
        <rect width="270" height="230" fill={url("ground")} />
        <path d={EYEPORT} fill="none" className="stroke-asphalt" strokeWidth="16" opacity="0.4" filter={url("blur-m")} />
        <path d="M130 150 C170 160 220 158 250 150" fill="none" className="stroke-asphalt" strokeWidth="12" opacity="0.35" filter={url("blur-l")} />

        {/* Clear coat: sky glow, two studio window reflections on the crown and a soft horizon line on the flank */}
        <rect width="270" height="230" fill={url("sky")} />
        <path d="M58 58 C80 34 112 22 146 20 C150 24 150 30 146 34 C116 36 90 46 70 66 C64 68 58 64 58 58 Z" className="fill-fg" opacity="0.55" filter={url("blur-s")} />
        <path d="M160 22 C180 24 196 32 208 44 C206 50 200 52 194 50 C184 42 172 36 158 34 C154 30 155 24 160 22 Z" className="fill-fg" opacity="0.42" filter={url("blur-s")} />
        <path d="M20 150 C60 138 110 136 150 142" fill="none" className="stroke-fg" strokeWidth="5" opacity="0.1" filter={url("blur-m")} />
        {/* Fresnel: the rim brightens where the shell turns away from view */}
        <path d="M50 202 C28 184 12 152 10 122 C10 84 36 44 88 18" fill="none" className="stroke-fg" strokeWidth="4" opacity="0.14" filter={url("blur-s")} />
      </g>

      {/* Rubber edge trim with a faint lit lip */}
      <path d="M50 202 C70 200 110 206 130 209 C160 212 196 217 223 215 C232 212 241 206 245 199" fill="none" className="stroke-asphalt" strokeWidth="7" strokeLinecap="round" />
      <path d="M56 199 C96 203 156 210 222 211" fill="none" className="stroke-fg" strokeWidth="1" opacity="0.18" />
      <path d={SHELL} fill="none" className="stroke-asphalt" strokeWidth="0.8" opacity="0.3" />

      {number && design.generic && (
        <text x="66" y="158" textAnchor="middle" transform="rotate(-6 66 158)" className="headline fill-fg" fontSize="28" opacity="0.92">
          {number}
        </text>
      )}

      {/* Eyeport: the rubber gasket and dark lining around the visor */}
      <path d={EYEPORT} className="fill-asphalt" opacity="0.85" />

      {/* Visor: tinted acrylic mirroring the sky above a horizon and the ground below */}
      <g clipPath={url("visor-clip")}>
        <path d={VISOR} fill={url("visor")} />
        <path d={VISOR} fill={url("iridium")} />
        <path d={VISOR_SKY} fill={url("visor-sky")} />
        <path d="M128 124 C170 112 212 110 250 117" fill="none" className="stroke-fg" strokeWidth="1.2" opacity="0.5" />
        <path d="M176 94 C200 90 226 91 250 96 L250 102 C226 98 202 98 180 102 Z" className="fill-fg" opacity="0.5" filter={url("blur-s")} />
        <path d="M150 132 C190 136 222 134 248 130" fill="none" className="stroke-fg" strokeWidth="6" opacity="0.06" filter={url("blur-m")} />
      </g>
      {/* Tear-off stack along the top edge, and the acrylic's lit lower and front edges */}
      <path d="M130 100 C150 88 196 82 248 93" fill="none" className="stroke-fg" strokeWidth="0.9" opacity="0.45" />
      <path d="M132 103 C152 91 196 85 248 96" fill="none" className="stroke-fg" strokeWidth="0.6" opacity="0.25" />
      <path d="M143 139 C168 147 206 147 244 141" fill="none" className="stroke-fg" strokeWidth="1.3" opacity="0.4" />
      <path d="M244 141 C249 128 251 112 248 95" fill="none" className="stroke-fg" strokeWidth="1" opacity="0.3" />
      {/* Tear-off tabs and the visor lift tab */}
      <path d="M128 96 L124 88 L128 87 L132 95 Z" className="fill-fg-dim" opacity="0.6" />
      <path d="M134 94 L131 86 L135 85 L138 93 Z" className="fill-fg-dim" opacity="0.4" />
      <path d="M234 142 C238 141 242 141 245 140 L245 147 C242 149 238 149 235 149 Z" fill={url("plate")} />

      {/* Pivot plate: slim and flush, with a centre pivot and a small lock screw */}
      <path d="M110 112 C110 104 116 99 124 99 L140 101 C146 102 150 108 148 114 C146 121 138 125 130 124 L118 122 C113 121 110 117 110 112 Z" fill={url("plate")} />
      <path d="M113 106 C116 101 121 99 126 99 L140 101" fill="none" className="stroke-fg" strokeWidth="0.8" opacity="0.35" />
      <circle cx="124" cy="111" r="3.6" fill={url("screw")} />
      <path d="M122 112 L126 110" className="stroke-asphalt" strokeWidth="0.9" opacity="0.7" />
      <circle cx="139" cy="114" r="1.8" fill={url("screw")} opacity="0.8" />

      {/* Head-and-neck restraint post, anodised black */}
      <circle cx="62" cy="180" r="6.5" fill={url("plate")} />
      <circle cx="62" cy="180" r="2.6" className="fill-asphalt" />
      <path d="M57.5 177 C59 175 62 174.5 64.5 175.5" fill="none" className="stroke-fg" strokeWidth="0.8" opacity="0.4" />
    </svg>
  );
}
