"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { NAV_ITEMS } from "@/components/f1/nav-items";

function subscribeToHash(listener: () => void) {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}

/**
 * Mobile tab bar with a slanted red indicator on the section in the URL hash.
 * Hidden from the md breakpoint up, where the header carries navigation.
 */
export function BottomNav() {
  const pathname = usePathname();
  const hash = useSyncExternalStore(
    subscribeToHash,
    () => window.location.hash,
    () => "",
  );
  const active = pathname === "/" ? hash || NAV_ITEMS[0].hash : null;

  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-asphalt/95 backdrop-blur md:hidden"
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map(({ label, hash: itemHash, icon: Icon }) => {
          const isActive = active === itemHash;
          return (
            <li key={itemHash}>
              <a
                href={`/${itemHash}`}
                aria-current={isActive ? "location" : undefined}
                className={`relative flex h-16 flex-col items-center justify-center gap-1 text-xs font-semibold ${
                  isActive ? "text-fg" : "text-fg-dim"
                }`}
              >
                {isActive && (
                  <span aria-hidden="true" className="slant absolute inset-x-3 top-0 h-1 bg-box-red" />
                )}
                <Icon size={20} aria-hidden="true" />
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
