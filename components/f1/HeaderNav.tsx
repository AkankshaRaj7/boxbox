"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { NAV_ITEMS } from "@/components/f1/nav-items";
import { activeNavHref } from "@/lib/nav";

function subscribeToHash(listener: () => void) {
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}

/**
 * Desktop navigation, with the same slanted red marker the mobile tab bar uses
 * on the current section or page.
 */
export function HeaderNav() {
  const pathname = usePathname();
  const hash = useSyncExternalStore(
    subscribeToHash,
    () => window.location.hash,
    () => "",
  );
  const active = activeNavHref(NAV_ITEMS, pathname, hash);

  return (
    <nav aria-label="Sections" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {NAV_ITEMS.map(({ label, href, section }) => {
          const isActive = active === href;
          // Section links stay plain anchors: a real hash navigation is what
          // fires the `hashchange` that moves the marker.
          const Tag = section === undefined ? Link : "a";
          return (
            <li key={href}>
              <Tag
                href={href}
                aria-current={isActive ? (section === undefined ? "page" : "location") : undefined}
                className={`slant relative block px-3 py-1.5 text-sm font-bold uppercase transition-colors hover:bg-kerb hover:text-fg ${
                  isActive ? "text-fg" : "text-fg-dim"
                }`}
              >
                <span className="unslant">{label}</span>
                {isActive && <span aria-hidden="true" className="absolute inset-x-1 bottom-0 h-0.5 bg-box-red" />}
              </Tag>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
