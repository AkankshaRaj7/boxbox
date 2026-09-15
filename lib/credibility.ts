/** How far a driver-market rumor has progressed. */
export type RumorStatus = "whisper" | "linked" | "strong" | "signed";

/** Number of LEDs on the steering-wheel shift-light meter. */
export const SHIFT_LIGHT_COUNT = 10;

/** LEDs lit for each rumor status. */
export const RUMOR_LEDS: Record<RumorStatus, number> = {
  whisper: 2,
  linked: 5,
  strong: 8,
  signed: SHIFT_LIGHT_COUNT,
};

/** Display label for each rumor status. */
export const RUMOR_LABEL: Record<RumorStatus, string> = {
  whisper: "Whisper",
  linked: "Linked",
  strong: "Strong",
  signed: "Signed",
};

export type ShiftLightColor = "green" | "red" | "blue";

/**
 * Colour of the LED at `index` (0-based), laid out like a real shift-light
 * strip: four green, four red, two blue.
 */
export function shiftLightColor(index: number): ShiftLightColor {
  if (index < 0 || index >= SHIFT_LIGHT_COUNT || !Number.isInteger(index)) {
    throw new RangeError(`Shift light index out of range: ${index}`);
  }
  if (index < 4) return "green";
  if (index < 8) return "red";
  return "blue";
}
