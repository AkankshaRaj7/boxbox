/**
 * Timing for the car arrival on team pages: the team's car is heard
 * approaching, drives in from the left at speed, brakes to a stop in its
 * parked spot beside the team name, and leaves tyre marks that hold, then
 * fade. Pure functions so the maths is testable.
 */

/** Approach speed before braking. */
export const ARRIVAL_SPEED_PX_PER_S = 2200;
export const ARRIVAL_MIN_MS = 700;
export const ARRIVAL_MAX_MS = 1500;
/**
 * Fast approach, hard braking: covers most of the distance early and eases
 * into the stop. Applied to the whole animation, so keyframe offsets stay in
 * distance.
 */
export const ARRIVAL_EASING = "cubic-bezier(0.12, 0.62, 0.3, 1)";
/** The easing's opening slope, as progress per unit time; used to size the duration from the approach speed. */
const ARRIVAL_EASING_START_SLOPE = 0.62 / 0.12;
export const MARKS_HOLD_MS = 900;
export const MARKS_FADE_MS = 1800;
/** Pause before the car appears when there is no sound to wait for. */
export const SILENT_DELAY_MS = 250;
/** Share of the drive at which the recording's loudest moment should land: just before the car settles. */
export const SOUND_PEAK_SHARE = 0.35;

/**
 * How long the drive-in takes: the car enters at `ARRIVAL_SPEED_PX_PER_S` and
 * brakes over `distance` px, from fully off the left edge to its parked spot.
 */
export function arrivalDuration(distance: number): number {
  const ms = (distance / ARRIVAL_SPEED_PX_PER_S) * ARRIVAL_EASING_START_SLOPE * 1000;
  return Math.round(Math.min(ARRIVAL_MAX_MS, Math.max(ARRIVAL_MIN_MS, ms)));
}

/**
 * Seconds of engine note before the car appears, so the recording's loudest
 * moment (`peakAt` seconds in) lands `SOUND_PEAK_SHARE` of the way into the drive.
 */
export function soundPreRoll(durationMs: number, peakAt: number): number {
  return Math.max(0, peakAt - (durationMs / 1000) * SOUND_PEAK_SHARE);
}

/**
 * Clip keyframes that uncover a block of text left to right just behind the
 * arriving car, run with the drive-in's timing. Text beside the parked spot is
 * uncovered as the car's tail passes each point; text that overlaps the spot
 * horizontally (stacked layouts, where the car drives below it) as the nose
 * passes, so it isn't held back until the car stops.
 *
 * @param left the text's left edge, in px from the stage's left.
 * @param right the text's right edge.
 */
export function revealKeyframes(slotLeft: number, carLength: number, left: number, right: number) {
  const distance = slotLeft + carLength;
  // The tail is at -carLength + distance × progress; the nose is carLength ahead of it.
  const lead = right <= slotLeft ? 0 : carLength;
  const at = (x: number) => Math.min(1, Math.max(0, (x + carLength - lead) / distance));
  const hidden = "inset(0 100% 0 0)";
  const shown = "inset(0 0 0 0)";
  return [
    { offset: 0, clipPath: hidden },
    { offset: at(left), clipPath: hidden },
    { offset: at(right), clipPath: shown },
    { offset: 1, clipPath: shown },
  ];
}

/**
 * Web Animations keyframes for the drive-in, both run for `arrivalDuration`
 * with `ARRIVAL_EASING`. The car sits in its parked box and translates from
 * fully off the stage's left edge to 0; the tyre marks (a band from the stage's
 * left edge to the parked rear wheel) are uncovered behind the rear wheel.
 *
 * @param slotLeft the parked box's left edge, in px from the stage's left.
 * @param carLength the parked box's width.
 * @param rearWheelShare where the rear wheel sits along the car, from its tail (0) to its nose (1).
 */
export function arrivalKeyframes(slotLeft: number, carLength: number, rearWheelShare: number) {
  const distance = slotLeft + carLength;
  const parkedWheel = slotLeft + carLength * rearWheelShare;
  // The rear wheel reaches the stage's left edge once it has travelled the tail-to-wheel length.
  const wheelEnters = Math.min(1, (carLength * rearWheelShare) / distance);
  return {
    distance,
    /** Width of the marks band, from the stage's left edge to the parked rear wheel. */
    marksWidth: parkedWheel,
    car: [
      { offset: 0, transform: `translateX(${-distance}px)` },
      { offset: 1, transform: "translateX(0px)" },
    ],
    marks: [
      { offset: 0, clipPath: "inset(0 100% 0 0)" },
      { offset: wheelEnters, clipPath: "inset(0 100% 0 0)" },
      { offset: 1, clipPath: "inset(0 0 0 0)" },
    ],
  };
}
