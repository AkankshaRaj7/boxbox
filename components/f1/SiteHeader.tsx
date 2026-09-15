import Link from "next/link";
import { NAV_ITEMS } from "@/components/f1/nav-items";
import { SlantTag } from "@/components/f1/SlantTag";
import { Wordmark } from "@/components/f1/Wordmark";

/** Sticky top bar: wordmark, desktop section navigation, and the preview marker. */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-asphalt/90 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-6 px-4 md:px-6">
        <Link href="/" className="shrink-0">
          <Wordmark />
        </Link>
        <nav aria-label="Sections" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.hash}>
                <a
                  href={`/${item.hash}`}
                  className="slant block px-3 py-1.5 text-sm font-bold uppercase text-fg-dim transition-colors hover:bg-kerb hover:text-fg"
                >
                  <span className="unslant">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <SlantTag tone="neutral">Design preview</SlantTag>
      </div>
    </header>
  );
}
