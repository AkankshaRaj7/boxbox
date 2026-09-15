import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { AA_CONTRAST, contrastRatio } from "./color";

/** Reads the `--color-*` tokens straight from globals.css so this guards the real values. */
function readTokens(): Record<string, string> {
  const css = readFileSync(fileURLToPath(new URL("../app/globals.css", import.meta.url)), "utf8");
  const tokens: Record<string, string> = {};
  for (const [, name, hex] of css.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{3,6});/gi)) {
    tokens[name] = hex;
  }
  return tokens;
}

/** Every text-on-surface pairing the components use: [text token, background token]. */
const TEXT_PAIRS: [string, string][] = [
  ["fg", "asphalt"],
  ["fg", "carbon"],
  ["fg", "kerb"],
  ["fg-dim", "asphalt"],
  ["fg-dim", "carbon"],
  ["fg-dim", "kerb"],
  ["box-red", "asphalt"],
  ["box-red", "carbon"],
  ["flag-green", "carbon"],
  ["flag-yellow", "carbon"],
  ["sector-fastest", "carbon"],
  ["asphalt", "box-red"],
  ["asphalt", "flag-red"],
  ["asphalt", "flag-yellow"],
  ["asphalt", "flag-green"],
  ["asphalt", "flag-blue"],
  ["asphalt", "sector-fastest"],
  ["asphalt", "sector-pb"],
  ["asphalt", "sector-slower"],
];

describe("design token contrast", () => {
  const tokens = readTokens();

  it.each(TEXT_PAIRS)("%s text on %s meets WCAG AA", (text, background) => {
    expect(tokens[text], `missing token ${text}`).toBeDefined();
    expect(tokens[background], `missing token ${background}`).toBeDefined();
    expect(contrastRatio(tokens[text], tokens[background])).toBeGreaterThanOrEqual(AA_CONTRAST);
  });
});
