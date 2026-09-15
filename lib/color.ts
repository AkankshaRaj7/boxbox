import type { CSSProperties } from "react";

/** The page background every team colour is checked against. */
export const ASPHALT = "#0a0a0d";

/** WCAG AA minimum contrast for normal-size text. */
export const AA_CONTRAST = 4.5;

type Rgb = [number, number, number];

function hexToRgb(hex: string): Rgb {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  if (!/^[0-9a-f]{6}$/i.test(full)) {
    throw new Error(`Invalid hex colour: ${hex}`);
  }
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as Rgb;
}

function rgbToHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function relativeLuminance([r, g, b]: Rgb): number {
  const [lr, lg, lb] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

/**
 * WCAG contrast ratio between two hex colours.
 *
 * @returns a ratio from 1 (identical) to 21 (black on white).
 */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(hexToRgb(a));
  const lb = relativeLuminance(hexToRgb(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Returns a version of `hex` that is readable as text on `background`.
 *
 * Colours that already pass are returned unchanged (lower-cased); darker
 * liveries are mixed towards white in 5% steps until they reach `minContrast`.
 */
export function readableOn(
  hex: string,
  background: string = ASPHALT,
  minContrast: number = AA_CONTRAST,
): string {
  const base = hexToRgb(hex);
  for (let step = 0; step <= 20; step++) {
    const t = step / 20;
    const mixed = base.map((v) => v + (255 - v) * t) as Rgb;
    const candidate = rgbToHex(mixed);
    if (contrastRatio(candidate, background) >= minContrast) {
      return candidate;
    }
  }
  return "#ffffff";
}

/**
 * CSS custom properties for a team: `--team` is the livery colour for bars and
 * fills, `--team-text` its AA-readable variant for text on the dark theme.
 */
export function teamStyle(hex: string): CSSProperties {
  return { "--team": hex, "--team-text": readableOn(hex) } as CSSProperties;
}
