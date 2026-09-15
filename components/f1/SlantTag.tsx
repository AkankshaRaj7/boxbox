export type SlantTone = "red" | "yellow" | "green" | "blue" | "neutral";

const TONES: Record<SlantTone, string> = {
  red: "bg-flag-red text-asphalt",
  yellow: "bg-flag-yellow text-asphalt",
  green: "bg-flag-green text-asphalt",
  blue: "bg-flag-blue text-asphalt",
  neutral: "bg-kerb text-fg border border-line",
};

/**
 * A parallelogram label in a flag colour. Text on filled tones is asphalt,
 * which keeps every tone above WCAG AA contrast.
 */
export function SlantTag({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: SlantTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`slant inline-block px-2 py-0.5 text-xs font-bold uppercase ${TONES[tone]} ${className}`}>
      <span className="unslant">{children}</span>
    </span>
  );
}
