import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { latestRace } from "@/lib/race-data";

export const metadata: Metadata = { title: "Races — BOXBOX" };

/**
 * Nav lands here; the newest race is what anyone wants on a Sunday night. A
 * proper season index replaces this at stage 2d.
 */
export default async function RacesPage() {
  const latest = await latestRace();
  if (!latest) {
    return (
      <main className="mx-auto w-full max-w-7xl px-4 pt-4 md:px-6">
        <h1 className="headline text-display-sm">Races</h1>
        <div className="kerb-stripe mt-1.5 h-1.5 w-16" aria-hidden="true" />
        <p className="mt-4 text-sm text-fg-dim">No races yet this season.</p>
      </main>
    );
  }
  redirect(`/races/${latest.round}`);
}
