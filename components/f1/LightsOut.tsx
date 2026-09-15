type LightsOutProps = {
  /** Render inside the page flow (style guide demo) instead of as the full-screen intro. */
  inline?: boolean;
};

/**
 * Five red lights come on one by one, go out together, then the overlay clears.
 * The animation is pure CSS so it paints before hydration; the full-screen
 * version is hidden after the first visit in a session and under reduced motion.
 */
export function LightsOut({ inline = false }: LightsOutProps) {
  return (
    <div className={`lights-out ${inline ? "lights-out--inline" : ""}`} aria-hidden="true">
      <div className="flex gap-3 rounded-sm border border-line bg-carbon px-5 py-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} className="lights-out__light" style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}
