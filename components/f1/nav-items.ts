import { Flag, Gauge, Radio, Timer, type LucideIcon } from "lucide-react";
import type { NavTarget } from "@/lib/nav";

export type NavItem = NavTarget & { label: string; icon: LucideIcon };

/**
 * Primary navigation, shared by the header and the mobile tab bar.
 *
 * Items with a `section` scroll to a block of the Paddock page; the rest are
 * pages of their own.
 *
 * Silly Season is not here: it was empty on every day we measured, and a
 * permanently empty section should not hold a slot while the race pages have
 * none. It stays a Paddock section and returns when the rumor flow gives it
 * something to carry.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Paddock", href: "/", section: "#paddock", icon: Gauge },
  { label: "Races", href: "/races", icon: Flag },
  { label: "News", href: "/news", icon: Radio },
  { label: "Pace", href: "/pecking-order", icon: Timer },
];
