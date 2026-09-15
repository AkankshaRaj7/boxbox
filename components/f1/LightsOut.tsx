"use client";

import { SkipForward, Volume2, VolumeX } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { IntroCar } from "@/components/f1/IntroCar";
import { teamStyle } from "@/lib/color";
import { createIntroAudio, type IntroAudio } from "@/lib/intro-audio";
import {
  INTRO_SEEN_KEY,
  LIGHT_COUNT,
  TYRE_MARKS_FADE_MS,
  TYRE_MARKS_HOLD_MS,
  carPassDuration,
  carPassKeyframes,
  pickCar,
  planLights,
  type IntroCarPick,
} from "@/lib/lights";
import { TEAMS_2026 } from "@/lib/teams";

type Phase = "start" | "lights" | "car";

type Session = {
  timers: number[];
  animations: Animation[];
  audio: IntroAudio | null;
  /** Length of the car pass, fixed at the start tap so the sound can be lined up with it. */
  carMs: number;
  /** Page elements made inert while the start screen and lights cover them. */
  backdrop: HTMLElement[];
};

/** Drives the page-level CSS in globals.css: the overlay shows while this is set. */
function setIntroState(state?: "lights" | "car") {
  const root = document.documentElement;
  if (state) root.dataset.intro = state;
  else delete root.dataset.intro;
}

function rememberSeen() {
  try {
    sessionStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    // Storage blocked: the intro may show again next visit, which is harmless.
  }
}

function stopTimers(s: Session) {
  s.timers.forEach(clearTimeout);
  s.timers.length = 0;
  s.animations.forEach((a) => a.cancel());
  s.animations.length = 0;
}

/** Hands the page back: no overlay, nothing inert, intro remembered for this session. */
function releasePage(s: Session) {
  rememberSeen();
  s.backdrop.forEach((el) => (el.inert = false));
  s.backdrop = [];
  setIntroState();
}

/**
 * The lights-out intro. A start screen waits for a tap (browsers only allow
 * sound after one), then five lights come on a second apart with a beep each,
 * hold for a random moment and go out. A car in a random team's colour, 80% of
 * the screen wide, then blasts up or down the screen, uncovering the page
 * behind it and leaving rubber marks that fade. Skipping goes straight to the
 * page with no car.
 *
 * The full-screen version only appears when the pre-paint script in
 * app/layout.tsx sets `data-intro="start"`: first visit per session, not under
 * reduced motion, never without JavaScript. `inline` renders the style-guide demo.
 */
export function LightsOut({ inline = false }: { inline?: boolean }) {
  const [phase, setPhase] = useState<Phase>("start");
  const [lit, setLit] = useState(0);
  const [car, setCar] = useState<IntroCarPick | null>(null);
  const titleId = useId();
  const carId = `intro-car${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const rootRef = useRef<HTMLDivElement>(null);
  const coverRef = useRef<HTMLDivElement>(null);
  const carRef = useRef<HTMLDivElement>(null);
  const marksRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const skipRef = useRef<HTMLButtonElement>(null);
  const session = useRef<Session>({ timers: [], animations: [], audio: null, carMs: 0, backdrop: [] });

  useEffect(() => {
    const s = session.current;
    if (!inline && document.documentElement.dataset.intro === "start") {
      // Keep the page behind the start screen out of reach until the intro ends.
      s.backdrop = [...(rootRef.current?.parentElement?.children ?? [])].filter(
        (el): el is HTMLElement => el instanceof HTMLElement && el !== rootRef.current,
      );
      s.backdrop.forEach((el) => (el.inert = true));
      startRef.current?.focus();
    }
    return () => {
      stopTimers(s);
      s.audio?.stop();
      s.backdrop.forEach((el) => (el.inert = false));
    };
  }, [inline]);

  useEffect(() => {
    if (phase === "lights") skipRef.current?.focus();
  }, [phase]);

  // Before paint, so the car never flashes at its resting position.
  useLayoutEffect(() => {
    const stage = rootRef.current;
    const [carEl, cover, marks] = [carRef.current, coverRef.current, marksRef.current];
    if (phase !== "car" || !car || !stage || !carEl || !cover || !marks) return;

    const s = session.current;
    const duration = s.carMs || carPassDuration(stage.clientWidth, stage.clientHeight);
    const frames = carPassKeyframes(stage.clientHeight, carEl.offsetHeight, car.direction);
    const pass: KeyframeAnimationOptions = { duration, easing: "linear", fill: "forwards" };
    const fade = marks.animate([{ opacity: 1 }, { opacity: 0 }], {
      duration: TYRE_MARKS_FADE_MS,
      delay: duration + TYRE_MARKS_HOLD_MS,
      fill: "forwards",
    });
    s.animations.push(carEl.animate(frames.car, pass), cover.animate(frames.cover, pass), marks.animate(frames.marks, pass), fade);

    fade.finished.then(
      () => {
        stopTimers(s);
        // The recording closes its own audio once it has played out.
        s.audio = null;
        setCar(null);
        setPhase("start");
        if (!inline) releasePage(s);
      },
      () => {
        // Cancelled by a skip or unmount, which clean up themselves.
      },
    );
  }, [phase, car, inline]);

  /** Skip: straight to the page, no car, no sound. */
  function skip() {
    const s = session.current;
    stopTimers(s);
    s.audio?.stop();
    s.audio = null;
    setLit(0);
    setCar(null);
    setPhase("start");
    if (!inline) releasePage(s);
  }

  function lightsOut() {
    stopTimers(session.current);
    setLit(0);
    setCar(pickCar(TEAMS_2026));
    setPhase("car");
    if (!inline) setIntroState("car");
  }

  function start(withSound: boolean) {
    const s = session.current;
    stopTimers(s);
    s.audio?.stop();
    // Created inside the click, so the browser lets it play.
    s.audio = withSound ? createIntroAudio() : null;

    const stage = rootRef.current;
    s.carMs = carPassDuration(stage?.clientWidth ?? window.innerWidth, stage?.clientHeight ?? window.innerHeight);
    const plan = planLights();
    setLit(0);
    setPhase("lights");
    if (!inline) {
      rememberSeen();
      setIntroState("lights");
    }
    plan.lightsOnAt.forEach((at, i) => {
      s.audio?.beep(at / 1000);
      s.timers.push(window.setTimeout(() => setLit(i + 1), at));
    });
    s.audio?.carPass(plan.lightsOutAt / 1000, s.carMs / 2000);
    s.timers.push(window.setTimeout(lightsOut, plan.lightsOutAt));
  }

  return (
    <div
      ref={rootRef}
      className={inline ? "lights-out lights-out--inline" : "lights-out"}
      role={inline ? "group" : "dialog"}
      aria-modal={inline ? undefined : true}
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key === "Escape") skip();
      }}
    >
      <div ref={coverRef} className="lights-out__cover">
        <div className="flex flex-col items-center gap-8 px-6 text-center" hidden={phase === "car"}>
          <h2 id={titleId} className="headline text-xl md:text-display-sm">
            Lights out and away we go
          </h2>
          <div className="flex gap-3 rounded-sm border border-line bg-carbon px-5 py-4 md:gap-4" aria-hidden="true">
            {Array.from({ length: LIGHT_COUNT }, (_, i) => (
              <span key={i} className="lights-out__light" data-on={i < lit} />
            ))}
          </div>
          <p className="sr-only" aria-live="polite">
            {phase === "lights" ? (lit === 0 ? "Get ready" : `${lit} of ${LIGHT_COUNT} lights on`) : ""}
          </p>
          {phase === "start" ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  ref={startRef}
                  type="button"
                  onClick={() => start(true)}
                  className="slant min-h-11 bg-box-red px-6 text-sm font-bold uppercase text-asphalt hover:brightness-110"
                >
                  <span className="unslant flex items-center gap-2">
                    <Volume2 size={16} aria-hidden="true" />
                    Lights on
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => start(false)}
                  className="slant min-h-11 border border-line px-6 text-sm font-bold uppercase text-fg-dim hover:bg-kerb hover:text-fg"
                >
                  <span className="unslant flex items-center gap-2">
                    <VolumeX size={16} aria-hidden="true" />
                    {inline ? "Without sound" : "Enter without sound"}
                  </span>
                </button>
              </div>
              <p className="text-xs text-fg-dim">Sound plays after you tap. Press Esc to skip.</p>
            </div>
          ) : (
            <button
              ref={skipRef}
              type="button"
              onClick={skip}
              className="slant min-h-11 border border-line px-5 text-xs font-bold uppercase text-fg-dim hover:bg-kerb hover:text-fg"
            >
              <span className="unslant flex items-center gap-2">
                <SkipForward size={14} aria-hidden="true" />
                Skip
              </span>
            </button>
          )}
        </div>
      </div>
      {phase === "car" && car && (
        <>
          <div ref={marksRef} className="lights-out__marks" aria-hidden="true">
            {["left", "right"].map((side) => (
              <span key={side} className="lights-out__mark" data-side={side}>
                <span className="lights-out__rubber" />
                <span className="lights-out__scuff" />
              </span>
            ))}
          </div>
          <div ref={carRef} className="lights-out__car" style={teamStyle(car.color)} aria-hidden="true">
            <div className="lights-out__car-body" data-direction={car.direction}>
              <IntroCar idPrefix={carId} />
            </div>
          </div>
          <p className="sr-only" aria-live="polite">
            Lights out
          </p>
        </>
      )}
    </div>
  );
}
