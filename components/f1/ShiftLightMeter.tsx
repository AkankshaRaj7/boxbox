import {
  RUMOR_LABEL,
  RUMOR_LEDS,
  SHIFT_LIGHT_COUNT,
  shiftLightColor,
  type RumorStatus,
  type ShiftLightColor,
} from "@/lib/credibility";

const LIT: Record<ShiftLightColor, string> = {
  green: "bg-shift-green text-shift-green",
  red: "bg-shift-red text-shift-red",
  blue: "bg-shift-blue text-shift-blue",
};

/**
 * Rumor credibility drawn as a steering-wheel shift-light strip: more LEDs lit
 * means a more credible rumor, and a signed deal fills the strip.
 */
export function ShiftLightMeter({ status, outlets }: { status: RumorStatus; outlets?: number }) {
  const lit = RUMOR_LEDS[status];
  const label = RUMOR_LABEL[status];
  return (
    <div
      role="meter"
      aria-label={`Credibility: ${label}`}
      aria-valuemin={0}
      aria-valuemax={SHIFT_LIGHT_COUNT}
      aria-valuenow={lit}
      aria-valuetext={label}
    >
      <div className="flex gap-1">
        {Array.from({ length: SHIFT_LIGHT_COUNT }, (_, i) => (
          <span
            key={i}
            className={`h-2.5 flex-1 rounded-[1px] ${
              i < lit ? `${LIT[shiftLightColor(i)]} shadow-[0_0_6px_currentColor]` : "bg-line"
            }`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex items-center justify-between text-xs">
        <span className="flex items-center gap-2">
          <span className="headline text-sm">{label}</span>
          {status === "signed" && <span className="chequered block h-3 w-6" aria-hidden="true" />}
        </span>
        {outlets !== undefined && (
          <span className="text-fg-dim">
            {outlets} {outlets === 1 ? "outlet" : "outlets"}
          </span>
        )}
      </div>
    </div>
  );
}
