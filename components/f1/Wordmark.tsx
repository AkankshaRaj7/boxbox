const SIZES = {
  sm: { text: "text-xl", chevron: "h-4" },
  md: { text: "text-3xl", chevron: "h-6" },
  lg: { text: "text-hero", chevron: "h-12" },
} as const;

/** The BOX▶BOX wordmark: two words split by a slanted red pit-board chevron. */
export function Wordmark({ size = "sm" }: { size?: keyof typeof SIZES }) {
  const s = SIZES[size];
  return (
    <span className={`headline inline-flex items-center gap-[0.08em] ${s.text}`} aria-label="BOXBOX">
      <span aria-hidden="true">BOX</span>
      <svg
        viewBox="0 0 12 16"
        className={`${s.chevron} w-auto fill-box-red`}
        aria-hidden="true"
        focusable="false"
      >
        <path d="M1 0h5l6 8-6 8H1l6-8z" />
      </svg>
      <span aria-hidden="true">BOX</span>
    </span>
  );
}
