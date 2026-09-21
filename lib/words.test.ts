import { describe, expect, it } from "vitest";
import { capitalise, count, ordinal, plural, position, surname } from "./words";

describe("count", () => {
  it("spells small numbers and leaves larger ones as numerals", () => {
    expect([count(0), count(7), count(10), count(11), count(35)]).toEqual(["no", "seven", "ten", "11", "35"]);
  });
});

describe("position", () => {
  it("uses ordinal suffixes", () => {
    expect([1, 2, 3, 4, 19, 21, 22].map(position)).toEqual(["1st", "2nd", "3rd", "4th", "19th", "21st", "22nd"]);
  });

  it("handles the teens, which break the pattern", () => {
    expect([11, 12, 13].map(position)).toEqual(["11th", "12th", "13th"]);
  });
});

describe("plural", () => {
  it("reads naturally for one and many", () => {
    expect([plural(1, "place"), plural(3, "place"), plural(13, "driver")]).toEqual(["a place", "three places", "13 drivers"]);
  });
});

describe("surname", () => {
  it("takes the last word of a full name", () => {
    expect([surname("Andrea Kimi Antonelli"), surname("Lewis Hamilton")]).toEqual(["Antonelli", "Hamilton"]);
  });
});

describe("ordinal and capitalise", () => {
  it("still serve the Briefing", () => {
    expect([ordinal(5), ordinal(13), capitalise("two")]).toEqual(["fifth", "P13", "Two"]);
  });
});
