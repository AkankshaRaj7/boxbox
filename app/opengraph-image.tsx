import { ImageResponse } from "next/og";
import { SITE_DESCRIPTION, SITE_TAGLINE } from "@/lib/site";

export const alt = `BOXBOX — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Design tokens, repeated here because Satori cannot read the stylesheet. */
const ASPHALT = "#0a0a0d";
const FG = "#f4f4f6";
const RED = "#ff2d2d";
const DIM = "#9b9ba7";

/**
 * The card people see when a BOXBOX link is pasted into a chat.
 *
 * Built from the site's own palette and the wordmark's slanted chevron — no F1
 * marks, no photos, the same rule the rest of the site follows.
 *
 * The lean comes from `skewX(-12deg)`, which is the site's own `slant` utility,
 * rather than from italics: the image renderer has no access to the stylesheet
 * or to Titillium, so `fontStyle: "italic"` silently rendered upright.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: ASPHALT,
          color: FG,
          padding: 80,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18, transform: "skewX(-12deg)" }}>
          <span style={{ fontSize: 108, fontWeight: 800, letterSpacing: -2 }}>BOX</span>
          <svg width="56" height="76" viewBox="0 0 12 16">
            <path d="M1 0h5l6 8-6 8H1l6-8z" fill={RED} />
          </svg>
          <span style={{ fontSize: 108, fontWeight: 800, letterSpacing: -2 }}>BOX</span>
        </div>

        <div style={{ display: "flex", height: 10, marginTop: 28, marginBottom: 36 }}>
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} style={{ flex: 1, background: i % 2 === 0 ? RED : FG }} />
          ))}
        </div>

        <div style={{ fontSize: 40, fontWeight: 700 }}>{SITE_TAGLINE}</div>
        <div style={{ fontSize: 26, color: DIM, marginTop: 18, maxWidth: 900, lineHeight: 1.4 }}>
          {SITE_DESCRIPTION}
        </div>
      </div>
    ),
    size,
  );
}
