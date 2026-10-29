import type { LucideIcon } from "lucide-react";
import { CalendarCheck, Dumbbell, LineChart, Scale, Settings, UtensilsCrossed } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "今日", icon: CalendarCheck },
  { href: "/weight", label: "体重", icon: Scale },
  { href: "/meals", label: "食事", icon: UtensilsCrossed },
  { href: "/gym", label: "ジム", icon: Dumbbell },
  { href: "/trends", label: "推移", icon: LineChart },
  { href: "/settings", label: "設定", icon: Settings },
];

/** The mobile tab bar holds five; settings moves to the header icon. */
export const TAB_ITEMS = NAV_ITEMS.filter((n) => n.href !== "/settings");

export function isActive(pathname: string, href: string) {
  return pathname === href || (href !== "/" && pathname.startsWith(href));
}
