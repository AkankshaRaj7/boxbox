import { describe, expect, it } from "vitest";
import { AA_CONTRAST, ASPHALT, contrastRatio, readableOn, teamStyle } from "./color";

describe("contrastRatio", () => {
  it("is 21 for black on white and 1 for identical colours", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ff2d2d", "#ff2d2d")).toBeCloseTo(1, 5);
  });

  it("is symmetric", () => {
    expect(contrastRatio("#3671c6", ASPHALT)).toBeCloseTo(contrastRatio(ASPHALT, "#3671c6"), 10);
  });

  it("rejects malformed hex", () => {
    expect(() => contrastRatio("#zzzzzz", ASPHALT)).toThrow();
  });
});

describe("readableOn", () => {
  it("leaves colours that already pass AA unchanged", () => {
    expect(readableOn("#FF8000")).toBe("#ff8000");
  });

  it("lightens dark liveries until they pass AA on asphalt", () => {
    const dark = "#1e3a8a";
    expect(contrastRatio(dark, ASPHALT)).toBeLessThan(AA_CONTRAST);
    const fixed = readableOn(dark);
    expect(fixed).not.toBe(dark);
    expect(contrastRatio(fixed, ASPHALT)).toBeGreaterThanOrEqual(AA_CONTRAST);
  });

  it("expands 3-digit hex", () => {
    expect(readableOn("#fff")).toBe("#ffffff");
  });
});

describe("teamStyle", () => {
  it("exposes the livery and its readable text variant", () => {
    const style = teamStyle("#1e3a8a") as Record<string, string>;
    expect(style["--team"]).toBe("#1e3a8a");
    expect(contrastRatio(style["--team-text"], ASPHALT)).toBeGreaterThanOrEqual(AA_CONTRAST);
  });
});
