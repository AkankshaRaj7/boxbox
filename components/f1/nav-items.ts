import { ArrowLeftRight, Gauge, Radio, Timer, type LucideIcon } from "lucide-react";
import type { NavTarget } from "@/lib/nav";

export type NavItem = NavTarget & { label: string; icon: LucideIcon };

/**
 * Primary navigation, shared by the header and the mobile tab bar.
 *
 * Items with a `section` scroll to a block of the Paddock page; the rest are
 * pages of their own. Silly Season stays a Paddock section until the rumor
 * admin flow gives it enough to fill a page.
 */
export const NAV_ITEMS: NavItem[] = [
  { label: "Paddock", href: "/", section: "#paddock", icon: Gauge },
  { label: "News", href: "/news", icon: Radio },
  { label: "Market", href: "/#market", section: "#market", icon: ArrowLeftRight },
  { label: "Pace", href: "/pecking-order", icon: Timer },
];
