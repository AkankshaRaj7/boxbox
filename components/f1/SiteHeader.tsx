import Link from "next/link";
import { HeaderNav } from "@/components/f1/HeaderNav";
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
        <HeaderNav />
        <SlantTag tone="neutral">Design preview</SlantTag>
      </div>
    </header>
  );
}
