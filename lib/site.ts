/**
 * Where the site lives, for the metadata that needs an absolute URL.
 *
 * Not deployed yet, so this reads the environment first: `NEXT_PUBLIC_SITE_URL`
 * when set, else the production domain Vercel injects, else localhost so a
 * local build still produces valid absolute URLs instead of failing.
 */
function resolve(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) {
    return explicit.replace(/\/$/, "");
  }
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : "http://localhost:4747";
}

export const SITE_URL = resolve();

export const SITE_NAME = "BOXBOX";
export const SITE_TAGLINE = "Everything from the pit wall";
export const SITE_DESCRIPTION =
  "An unofficial F1 fan site: what decided each race, who can still win the title, the car pecking order, and a merged news wire.";
