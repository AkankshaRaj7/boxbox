import { describe, expect, it } from "vitest";
import { HELMETS, VISOR_TINTS, helmetDesign } from "./helmet-designs";

describe("helmetDesign", () => {
  it("uses a driver's signature design", () => {
    expect(helmetDesign("norris", "#f47600")).toBe(HELMETS.norris);
  });

  it("gives everyone else a numbered team-colour helmet", () => {
    expect(helmetDesign("tsunoda", "#6c98ff")).toEqual({
      base: "#6c98ff",
      stripe: "var(--color-fg)",
      visor: "smoke",
      generic: true,
    });
  });

  it("only uses visor tints that exist", () => {
    for (const design of Object.values(HELMETS)) {
      expect(VISOR_TINTS[design.visor]).toBeDefined();
    }
  });
});
