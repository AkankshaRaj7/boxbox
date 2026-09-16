"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { CAR_SOUND, createIntroAudio } from "@/lib/intro-audio";
import {
  ARRIVAL_EASING,
  MARKS_FADE_MS,
  MARKS_HOLD_MS,
  SILENT_DELAY_MS,
  SOUND_PEAK_SHARE,
  arrivalDuration,
  arrivalKeyframes,
  revealKeyframes,
  soundPreRoll,
} from "@/lib/team-pass";

/** `static`: nothing animates (reduced motion or a missing part), so everything simply shows. */
type ArrivalState = "idle" | "driving" | "parked" | "static";

/**
 * Brings the team's car into the hero once per visit: heard approaching, it
 * drives in from the left edge, brakes to a stop exactly over its parked spot
 * and leaves tyre marks behind its rear wheel that hold, then fade. Text marked
 * `data-reveal` is uncovered just behind the car as it passes.
 *
 * Sound plays only after the visitor has interacted with the site (browsers
 * block audio otherwise, e.g. on a direct link or refresh); the car still
 * drives in silently. Under reduced motion nothing moves and the car is simply
 * parked.
 *
 * Wrap the hero in this component and mark the parked car's box with
 * `data-parked`; `car` is drawn at that box's size and position. Until the
 * drive-in starts, both stay hidden (see the `data-js` rules in globals.css),
 * so neither flashes in the server-rendered page.
 *
 * @param rearWheel the rear wheel centre as shares of the car's box, from its tail (x) and top (y).
 */
export function TeamCarPass({
  car,
  rearWheel,
  className = "",
  children,
}: {
  car: React.ReactNode;
  rearWheel: { x: number; y: number };
  className?: string;
  children: React.ReactNode;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<HTMLDivElement>(null);
  const marksRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ArrivalState>("idle");

  // Layout effect: the parked car is hidden before the first paint when the drive-in will run.
  useLayoutEffect(() => {
    const stage = stageRef.current;
    const carEl = carRef.current;
    const marks = marksRef.current;
    const parked = stage?.querySelector<HTMLElement>("[data-parked]");
    if (!stage || !carEl || !marks || !parked || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setState("static");
      return;
    }

    const stageBox = stage.getBoundingClientRect();
    const slot = parked.getBoundingClientRect();
    const slotLeft = slot.left - stageBox.left;
    const slotTop = slot.top - stageBox.top;
    const frames = arrivalKeyframes(slotLeft, slot.width, rearWheel.x);
    Object.assign(carEl.style, {
      left: `${slotLeft}px`,
      top: `${slotTop}px`,
      width: `${slot.width}px`,
      height: `${slot.height}px`,
    });
    Object.assign(marks.style, { top: `${slotTop + slot.height * rearWheel.y}px`, width: `${frames.marksWidth}px` });

    const duration = arrivalDuration(frames.distance);
    const canPlaySound = navigator.userActivation?.hasBeenActive ?? false;
    const audio = canPlaySound ? createIntroAudio() : null;
    const delay = audio ? soundPreRoll(duration, CAR_SOUND.peakAt) * 1000 : SILENT_DELAY_MS;
    audio?.carPass(0, (delay + duration * SOUND_PEAK_SHARE) / 1000);

    const timing: KeyframeAnimationOptions = { duration, delay, easing: ARRIVAL_EASING, fill: "both" };
    const animations = [
      carEl.animate(frames.car, timing),
      marks.animate(frames.marks, timing),
      marks.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: MARKS_FADE_MS,
        delay: delay + duration + MARKS_HOLD_MS,
        fill: "both",
      }),
    ];
    const reveal = stage.querySelector<HTMLElement>("[data-reveal]");
    if (reveal) {
      const text = reveal.getBoundingClientRect();
      const frames = revealKeyframes(slotLeft, slot.width, text.left - stageBox.left, text.right - stageBox.left);
      // Backwards fill only: once uncovered, the clip is removed so italic overhangs aren't cut.
      animations.push(reveal.animate(frames, { ...timing, fill: "backwards" }));
    }
    setState("driving");
    animations[0].finished.then(() => setState("parked"), () => undefined);

    return () => {
      animations.forEach((a) => a.cancel());
      audio?.stop();
    };
  }, [rearWheel.x, rearWheel.y]);

  return (
    <div ref={stageRef} data-pass={state} className={`team-pass relative overflow-hidden ${className}`}>
      {children}
      <div ref={marksRef} className="team-pass__marks" aria-hidden="true">
        <span className="team-pass__mark team-pass__mark--far" />
        <span className="team-pass__mark" />
      </div>
      <div ref={carRef} className="team-pass__car" aria-hidden="true">
        {car}
      </div>
    </div>
  );
}
