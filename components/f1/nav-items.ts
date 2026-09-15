import { ArrowLeftRight, Gauge, Radio, Timer, Trophy, type LucideIcon } from "lucide-react";

export type NavItem = { label: string; hash: string; icon: LucideIcon };

/** Primary sections of the Paddock page, shared by the header and the mobile tab bar. */
export const NAV_ITEMS: NavItem[] = [
  { label: "Paddock", hash: "#paddock", icon: Gauge },
  { label: "News", hash: "#news", icon: Radio },
  { label: "Market", hash: "#market", icon: ArrowLeftRight },
  { label: "Pace", hash: "#pace", icon: Timer },
  { label: "Play", hash: "#play", icon: Trophy },
];
