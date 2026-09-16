import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Cut-out driver photos in `public/drivers/{driverId}.webp`: transparent
 * 600 × 800 canvases with the driver standing bottom-centred.
 *
 * The owner supplied these photos to use for now; their licence is unknown, so
 * the folder is git-ignored and never deployed. A driver without a file falls
 * back to their helmet, which is what the live site shows.
 */
export const DRIVER_PHOTO_SIZE = { width: 600, height: 800 } as const;

const PHOTO_DIR = path.join(process.cwd(), "public", "drivers");

/** The public path of a driver's cut-out photo, or null when there is none. */
export function driverPhoto(driverId: string): string | null {
  if (!/^[a-z_]+$/.test(driverId)) return null;
  return existsSync(path.join(PHOTO_DIR, `${driverId}.webp`)) ? `/drivers/${driverId}.webp` : null;
}
