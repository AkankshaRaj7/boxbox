"use client";

import { useSyncExternalStore } from "react";

let now = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

/**
 * A shared one-second clock.
 *
 * @returns epoch milliseconds, or 0 during server render and hydration so the
 * first client paint matches the server HTML.
 */
export function useClock(): number {
  return useSyncExternalStore(
    subscribe,
    () => now,
    () => 0,
  );
}
