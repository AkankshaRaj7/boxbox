import { Wordmark } from "@/components/f1/Wordmark";

/** Footer with the unofficial-site disclaimer required by the Formula 1 fan guidelines. */
export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-line pb-20 md:pb-0">
      <div className="kerb-stripe h-1" aria-hidden="true" />
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-fg-dim md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-3">
          <Wordmark />
          <span>Everything from the pit wall.</span>
        </div>
        <p className="max-w-xl">
          This website is unofficial and is not associated in any way with the Formula 1 companies.
        </p>
      </div>
    </footer>
  );
}
