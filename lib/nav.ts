/**
 * Which navigation item is the current one.
 *
 * Kept free of React and lucide-react so it can be unit tested; the items
 * themselves, with their icons, live in `components/f1/nav-items`.
 */

/** The parts of a navigation item that decide whether it is current. */
export type NavTarget = {
  /** Where the item links. */
  href: string;
  /** Set when the item points at a section of the Paddock page, e.g. "#market". */
  section?: string;
};

/**
 * The href of the item the viewer is on, or null when none matches.
 *
 * On the Paddock page the hash decides, falling back to the first section item
 * when there is no hash yet. On any other route the item whose `href` is that
 * route wins, so `/news` highlights News rather than leaving the bar blank.
 */
export function activeNavHref(items: readonly NavTarget[], pathname: string, hash: string): string | null {
  if (pathname === "/") {
    const current = hash || items.find((item) => item.section)?.section;
    return items.find((item) => item.section !== undefined && item.section === current)?.href ?? null;
  }
  return items.find((item) => item.section === undefined && item.href === pathname)?.href ?? null;
}
