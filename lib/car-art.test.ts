import { describe, expect, it } from "vitest";
import { CAR_ART, groundCut, rearWheelShare } from "./car-art";

describe("CAR_ART", () => {
  it("credits the photo every drawing was made from", () => {
    for (const art of Object.values(CAR_ART)) {
      expect(art.credit.author).not.toBe("");
      expect(art.credit.url).toMatch(/^https:\/\/commons\.wikimedia\.org\//);
    }
  });

  it("keeps the wheels inside the drawing, rear before front, with the ground under the lowest wheel", () => {
    for (const art of Object.values(CAR_ART)) {
      const [rear, front] = art.wheels;
      expect(rear.x).toBeLessThan(front.x);
      for (const w of art.wheels) {
        expect(w.x - w.r).toBeGreaterThanOrEqual(0);
        expect(w.x + w.r).toBeLessThanOrEqual(art.width);
        expect(w.y + w.r).toBeLessThanOrEqual(art.height);
      }
      // Three-quarter photos put the nearer front wheel lower than the rear, so only the lowest wheel meets the ground.
      const lowest = Math.max(...art.wheels.map((w) => w.y + w.r));
      expect(Math.abs(lowest - art.ground)).toBeLessThanOrEqual(12);
    }
  });
});

describe("rainLight", () => {
  it("sits clear of the near-side wheels, which are drawn beneath it", () => {
    for (const [team, art] of Object.entries(CAR_ART)) {
      const [, x, y] = art.rainLight.match(/^M(-?[\d.]+) (-?[\d.]+)/)!.map(Number);
      for (const w of art.wheels) {
        expect(Math.hypot(x - w.x, y - w.y), team).toBeGreaterThan(w.r);
      }
    }
  });
});

describe("rearWheelShare", () => {
  it("gives the rear wheel's contact point as shares of the drawing", () => {
    expect(rearWheelShare(CAR_ART.mclaren)).toEqual({ x: 178 / 1200, y: 330 / 342 });
  });
});

describe("groundCut", () => {
  it("runs along the tyre contact points and cuts below the rear axle behind the rear wheel", () => {
    const art = { ...CAR_ART.mclaren, width: 1000, wheels: [{ x: 150, y: 250, r: 70 }, { x: 800, y: 260, r: 80 }] } as typeof CAR_ART.mclaren;
    expect(groundCut(art)).toBe("M0 0 H1000 V344 L800 344 L150 324 L80 250 L0 250 Z");
  });
});
