/**
 * Designs for the side-view `Helmet` drawing. Drivers with a signature helmet
 * this season get its colours and pattern, redrawn by us with sponsor and
 * personal logos left off; everyone else gets a team-colour design.
 *
 * References: 2026 race photos on Wikimedia Commons (free licences), listed in
 * docs/handoff.md. Update a design when a driver changes helmet for good; one-off
 * race specials are ignored.
 */

export type VisorTint = "smoke" | "gold" | "blue" | "green";

export type HelmetPattern =
  /** Organic maze of blobs and lines, generated from noise; `scale` > 1 is finer. */
  | { kind: "maze"; ink: string; scale: number; seed: number }
  /** Thin lines following the shell: over the crown, along the jaw and a rear chevron. */
  | { kind: "pinstripes"; ink: string };

export type HelmetDesign = {
  /** Shell colour. */
  base: string;
  /** Panel over the crown, optionally with its own pattern. */
  crown?: { color: string; pattern?: HelmetPattern };
  /** Panel along the lower shell. */
  lower?: string;
  /** Sweeping stripe from the brow back over the ear. */
  stripe?: string;
  /** Strip across the top of the visor opening. */
  band?: string;
  /** Panel on the chin bar. */
  chin?: string;
  /** Pattern over the whole shell. */
  pattern?: HelmetPattern;
  visor: VisorTint;
  /** Team-colour designs carry the race number on the rear of the shell. */
  generic?: boolean;
};

/** Visor gradients, top to bottom: iridium coatings fade to dark smoke. */
export const VISOR_TINTS: Record<VisorTint, [string, string, string]> = {
  smoke: ["#4a4d57", "#1c1d24", "#08080b"],
  gold: ["#ffd27a", "#d3542a", "#1d0f0a"],
  blue: ["#8fe9ff", "#3353d6", "#0a0f2e"],
  green: ["#c8f56a", "#2f8a72", "#07170f"],
};

export const HELMETS: Record<string, HelmetDesign> = {
  // Fluorescent lime covered in a dark maze of blobs, black strip over the visor.
  norris: {
    base: "#c9f02c",
    band: "#0c0d0b",
    pattern: { kind: "maze", ink: "#0e1409", scale: 1, seed: 7 },
    visor: "green",
  },
  // Yellow with thin red pinstripes, a red chin panel and a white strip over the visor.
  hamilton: {
    base: "#f3d314",
    band: "#f4f3ee",
    chin: "#d81f26",
    pattern: { kind: "pinstripes", ink: "#d81f26" },
    visor: "gold",
  },
  // White, with a red crown carrying a fine white pattern and a navy lower shell.
  max_verstappen: {
    base: "#f2f3f5",
    crown: { color: "#d4202c", pattern: { kind: "maze", ink: "#f2f3f5", scale: 1.8, seed: 3 } },
    lower: "#1d2b6f",
    visor: "blue",
  },
  // The rest of the grid, read from 2026 Chinese GP race photos taken at a distance:
  // main colours and panels are reliable, fine artwork is approximated.
  colapinto: {
    base: "#1c3a86",
    crown: { color: "#ec8cc4", pattern: { kind: "maze", ink: "#1c3a86", scale: 1.7, seed: 11 } },
    visor: "blue",
  },
  gasly: { base: "#a8d8ea", lower: "#1b2b62", stripe: "#f4f4f6", visor: "blue" },
  alonso: { base: "#1d3f95", stripe: "#f3c300", chin: "#f3c300", visor: "gold" },
  stroll: { base: "#121518", stripe: "#0f6b5a", band: "#0f6b5a", visor: "smoke" },
  bortoleto: { base: "#f3cf1d", lower: "#149a4b", stripe: "#1d3f95", visor: "green" },
  hulkenberg: { base: "#f2f3f5", crown: { color: "#d9232e" }, chin: "#d9232e", visor: "gold" },
  perez: { base: "#c9ea2b", lower: "#1f7a3a", band: "#1f7a3a", visor: "green" },
  bottas: {
    base: "#17223b",
    crown: { color: "#17223b", pattern: { kind: "maze", ink: "#dfe8f2", scale: 2.2, seed: 5 } },
    stripe: "#6fb6e6",
    visor: "smoke",
  },
  leclerc: {
    base: "#d6202a",
    crown: { color: "#d6202a", pattern: { kind: "maze", ink: "#f4f4f6", scale: 1.6, seed: 16 } },
    band: "#f4f4f6",
    visor: "gold",
  },
  ocon: { base: "#d9262c", pattern: { kind: "pinstripes", ink: "#f4f4f6" }, band: "#f4f4f6", visor: "gold" },
  bearman: { base: "#e7e24a", lower: "#2a4fa0", stripe: "#2a4fa0", visor: "blue" },
  piastri: { base: "#1b2433", pattern: { kind: "pinstripes", ink: "#ff8a2a" }, chin: "#1fb8b0", visor: "gold" },
  russell: {
    base: "#dfe9f5",
    crown: { color: "#dfe9f5", pattern: { kind: "maze", ink: "#3b6fb5", scale: 1.8, seed: 63 } },
    lower: "#2c4f8c",
    visor: "blue",
  },
  antonelli: { base: "#cdd4de", stripe: "#00c7b1", lower: "#262b33", visor: "blue" },
  arvid_lindblad: {
    base: "#1f86c9",
    crown: { color: "#1f86c9", pattern: { kind: "maze", ink: "#f1c232", scale: 1.5, seed: 41 } },
    visor: "blue",
  },
  lawson: { base: "#f2bfdc", lower: "#f4f4f6", stripe: "#1b2a5e", visor: "gold" },
  hadjar: { base: "#3bbf6a", stripe: "#ff6ec7", lower: "#1b2a5e", visor: "green" },
  albon: { base: "#f2f4f7", pattern: { kind: "pinstripes", ink: "#2b5fb8" }, lower: "#2b5fb8", visor: "smoke" },
  sainz: { base: "#2a63c9", lower: "#d52b1e", chin: "#f5c400", visor: "smoke" },
};

/** The driver's signature design, or a team-colour helmet with a light stripe. */
export function helmetDesign(driverId: string, teamColor: string): HelmetDesign {
  return HELMETS[driverId] ?? { base: teamColor, stripe: "var(--color-fg)", visor: "smoke", generic: true };
}
