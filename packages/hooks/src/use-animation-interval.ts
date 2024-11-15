import isNil from "lodash/isNil.js";
import { useEffect } from "react";

export type IntervalCallback = (time: number | undefined) => void;

export const animationInterval = (
  ms: number,
  signal: AbortSignal,
  callback: IntervalCallback,
): void => {
  const start = isNil(document.timeline)
    ? performance.now()
    : document.timeline.currentTime;

  const DEFAULT_START = 0;
  const startNumber = null === start
    ? DEFAULT_START
    : Number(start);

  const frame = (time: number): void => {
    if (signal.aborted) {
      return;
    }

    callback(time);
    scheduleFrame(time);
  };

  const scheduleFrame = (time: number | undefined): void => {
    if (time !== undefined) {
      const elapsed = time - startNumber;
      const roundedElapsed = Math.round(elapsed / ms) * ms;
      const targetNext = startNumber + roundedElapsed + ms;
      const delay = targetNext - performance.now();
      setTimeout(() => {
        return requestAnimationFrame(frame);
      }, delay);
    }
  };

  scheduleFrame(startNumber);
};

export const useAnimationInterval = (
  ms: number,
  callback: IntervalCallback,
): void => {
  useEffect(() => {
    const controller = new AbortController();

    animationInterval(ms, controller.signal, callback);

    return (): void => {
      controller.abort();
    };
  }, [callback, ms]);
};
