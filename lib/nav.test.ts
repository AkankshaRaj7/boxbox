import { describe, expect, it } from "vitest";
import { activeNavHref, type NavTarget } from "./nav";

const ITEMS: NavTarget[] = [
  { href: "/", section: "#paddock" },
  { href: "/news" },
  { href: "/#market", section: "#market" },
  { href: "/pecking-order" },
];

describe("activeNavHref", () => {
  it("falls back to the first section on the Paddock page", () => {
    expect(activeNavHref(ITEMS, "/", "")).toBe("/");
  });

  it("follows the hash on the Paddock page", () => {
    expect(activeNavHref(ITEMS, "/", "#market")).toBe("/#market");
  });

  it("ignores a hash that belongs to no item", () => {
    expect(activeNavHref(ITEMS, "/", "#nowhere")).toBeNull();
  });

  it("matches a route on its own page", () => {
    expect(activeNavHref(ITEMS, "/news", "")).toBe("/news");
    expect(activeNavHref(ITEMS, "/pecking-order", "")).toBe("/pecking-order");
  });

  it("keeps a route active whatever the hash is", () => {
    expect(activeNavHref(ITEMS, "/news", "#market")).toBe("/news");
  });

  it("marks nothing on a page outside the bar", () => {
    expect(activeNavHref(ITEMS, "/drivers/ver", "")).toBeNull();
  });
});
