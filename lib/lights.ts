/** sessionStorage key marking the intro as seen this browser session; read by the pre-paint script in app/layout.tsx. */
export const INTRO_SEEN_KEY = "bb-lights";

/** Start lights in the gantry. */
export const LIGHT_COUNT = 5;
/** Real start cadence: one light per second. */
export const LIGHT_INTERVAL_MS = 1000;
/** Pause between tapping start and the first light. */
export const FIRST_LIGHT_MS = 700;
/** Random hold after the fifth light before lights out, shorter than F1's 0.2–3 s so the intro stays snappy. */
export const HOLD_MIN_MS = 500;
export const HOLD_MAX_MS = 1500;
/** The intro car's width as a share of the stage (screen) width; matches `.lights-out__car` in globals.css. */
export const CAR_WIDTH_SHARE = 0.8;
/** Length over width of the IntroCar drawing (400 × 1080), close to a 2026 car's proportions. */
export const CAR_ASPECT = 1080 / 400;
/** On-screen speed of the car, and the bounds on how long one pass may take. */
export const CAR_SPEED_PX_PER_S = 2600;
export const CAR_MIN_MS = 800;
export const CAR_MAX_MS = 1800;
/** How long the tyre marks stay once the car has gone, then how long they take to fade. */
export const TYRE_MARKS_HOLD_MS = 900;
export const TYRE_MARKS_FADE_MS = 1100;
/** Rear axle position as a share of the car's length from the nose: y 915 of 1080 in IntroCar. */
export const REAR_AXLE = 915 / 1080;

export type LightsPlan = {
  /** Milliseconds from the start tap at which each light comes on. */
  lightsOnAt: number[];
  /** Milliseconds from the start tap at which all lights go out. */
  lightsOutAt: number;
};

/**
 * Timings for one start sequence. The hold before lights out is random, as at
 * a real start, so nobody can anticipate it.
 *
 * @param random returns a number in [0, 1); injectable for tests.
 */
export function planLights(random: () => number = Math.random): LightsPlan {
  const lightsOnAt = Array.from({ length: LIGHT_COUNT }, (_, i) => FIRST_LIGHT_MS + i * LIGHT_INTERVAL_MS);
  const hold = HOLD_MIN_MS + random() * (HOLD_MAX_MS - HOLD_MIN_MS);
  return { lightsOnAt, lightsOutAt: Math.round(lightsOnAt[LIGHT_COUNT - 1] + hold) };
}

export type CarDirection = "up" | "down";

export type IntroCarPick = { teamId: string; color: string; direction: CarDirection };

/**
 * A random team colour and direction for the intro car, so each first visit
 * can bring a different livery.
 *
 * @param random returns a number in [0, 1); injectable for tests.
 */
export function pickCar(teams: Record<string, { color: string }>, random: () => number = Math.random): IntroCarPick {
  const ids = Object.keys(teams);
  const teamId = ids[Math.min(ids.length - 1, Math.floor(random() * ids.length))];
  return { teamId, color: teams[teamId].color, direction: random() < 0.5 ? "up" : "down" };
}

/**
 * How long one car pass takes on a stage of this size. The car is
 * CAR_WIDTH_SHARE of the width, so on wide screens it is far longer than the
 * screen is tall; at a steady speed that pass takes longer, within
 * CAR_MIN_MS–CAR_MAX_MS.
 */
export function carPassDuration(stageWidth: number, stageHeight: number): number {
  const carLength = stageWidth * CAR_WIDTH_SHARE * CAR_ASPECT;
  const ms = ((stageHeight + carLength) / CAR_SPEED_PX_PER_S) * 1000;
  return Math.round(Math.min(CAR_MAX_MS, Math.max(CAR_MIN_MS, ms)));
}

export type ClipKeyframe = { offset: number; clipPath: string };

/**
 * Web Animations keyframes for one car pass across a stage `height` px tall,
 * all run for `carPassDuration` with linear easing. The car crosses at constant speed
 * from just off one edge to just off the other; the cover is cut away behind
 * the car's middle, revealing the page; the tyre marks grow behind its rear axle.
 */
export function carPassKeyframes(height: number, carLength: number, direction: CarDirection) {
  const travel = height + carLength;
  const at = (distance: number) => Math.min(1, Math.max(0, distance / travel));
  const up = direction === "up";
  const full = "inset(0 0 0 0)";
  // Going up, the page is uncovered from the bottom; going down, from the top.
  const coverGone = up ? "inset(0 0 100% 0)" : "inset(100% 0 0 0)";
  const noMarks = up ? "inset(100% 0 0 0)" : "inset(0 0 100% 0)";
  const clip = (from: number, to: number, start: string, end: string): ClipKeyframe[] => [
    { offset: 0, clipPath: start },
    { offset: at(from), clipPath: start },
    { offset: at(to), clipPath: end },
    { offset: 1, clipPath: end },
  ];

  return {
    car: [
      { offset: 0, transform: `translateY(${up ? height : -carLength}px)` },
      { offset: 1, transform: `translateY(${up ? -carLength : height}px)` },
    ],
    cover: clip(carLength / 2, height + carLength / 2, full, coverGone),
    marks: clip(carLength * REAR_AXLE, height + carLength * REAR_AXLE, noMarks, full),
  };
}
