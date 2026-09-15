/**
 * Intro sounds. The start-light beeps are synthesised with the Web Audio API;
 * the car pass-by is a real recording (see CAR_SOUND), lined up so its loudest
 * moment lands as the car crosses the middle of the screen.
 *
 * Browsers only allow audio after a user gesture, so call `createIntroAudio`
 * inside a click handler.
 */
export type IntroAudio = {
  /** Schedules a start-light beep `delay` seconds from now. */
  beep(delay: number): void;
  /**
   * Schedules the car pass-by for lights out, `delay` seconds from now, with
   * its loudest moment `passAfter` seconds later (the car crossing mid-screen).
   */
  carPass(delay: number, passAfter: number): void;
  /** Silences everything and releases the audio device. */
  stop(): void;
};

/**
 * The pass-by clip in /public/sounds: "F1 Car passing" by robbo799 (Freesound),
 * downloaded from Pixabay under the Pixabay Content License, cut to the 3 s
 * around the pass at 24.2 s into the original, faded in and out and levelled.
 * `peakAt` is the loudest moment, in seconds into the clip. AAC keeps it small
 * (27 KB); the WAV (136 KB) is for browsers that can't decode AAC.
 */
export const CAR_SOUND = { aac: "/sounds/car-pass.m4a", wav: "/sounds/car-pass.wav", peakAt: 1.6 };

/** Short fade-in when the recording is cut in part-way, to avoid a click. */
const CUT_IN_FADE = 0.03;

type AudioContextConstructor = typeof AudioContext;

/** A new intro sound player, or null when the browser has no Web Audio support. */
export function createIntroAudio(): IntroAudio | null {
  const Context: AudioContextConstructor | undefined =
    window.AudioContext ?? (window as Window & { webkitAudioContext?: AudioContextConstructor }).webkitAudioContext;
  if (!Context) return null;

  const ctx = new Context();
  void ctx.resume();
  const master = ctx.createGain();
  master.gain.value = 0.8;
  master.connect(ctx.createDynamicsCompressor()).connect(ctx.destination);

  const stop = () => {
    if (ctx.state !== "closed") void ctx.close();
  };

  // Loads while the lights run, so it is ready by lights out.
  const canPlayAac = new Audio().canPlayType('audio/mp4; codecs="mp4a.40.2"') !== "";
  const recording = fetch(canPlayAac ? CAR_SOUND.aac : CAR_SOUND.wav)
    .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(`car sound ${res.status}`))))
    .then((data) => ctx.decodeAudioData(data))
    .catch(() => null);

  return {
    beep(delay) {
      const t = ctx.currentTime + delay;
      const tone = ctx.createOscillator();
      tone.type = "square";
      tone.frequency.value = 880;
      const soften = ctx.createBiquadFilter();
      soften.type = "lowpass";
      soften.frequency.value = 2200;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.01);
      gain.gain.setValueAtTime(0.3, t + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
      tone.connect(soften).connect(gain).connect(master);
      tone.start(t);
      tone.stop(t + 0.25);
    },

    carPass(delay, passAfter) {
      const lightsOutAt = ctx.currentTime + delay;
      const passAt = lightsOutAt + passAfter;
      void recording.then((buffer) => {
        if (!buffer || ctx.state === "closed") return;
        // Never start before lights out: cut the approach short if needed.
        const now = ctx.currentTime;
        const startAt = Math.max(passAt - CAR_SOUND.peakAt, lightsOutAt, now);
        const offset = Math.min(buffer.duration, Math.max(0, startAt - (passAt - CAR_SOUND.peakAt)));
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(offset > 0 ? 0.0001 : 1, startAt);
        if (offset > 0) gain.gain.exponentialRampToValueAtTime(1, startAt + CUT_IN_FADE);
        source.connect(gain).connect(master);
        source.start(startAt, offset);
        window.setTimeout(stop, (startAt - now + buffer.duration - offset + 0.5) * 1000);
      });
    },

    stop,
  };
}
