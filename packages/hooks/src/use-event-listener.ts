import { useEffect } from "react";

type WindowEventMapPlus = Record<string, unknown> & WindowEventMap;

export const useEventListener = <Type extends keyof WindowEventMapPlus>(
  type: Type,
  listener: Type extends keyof WindowEventMap
    ? (this: Window, event_: WindowEventMap[Type]) => void
    : EventListenerOrEventListenerObject,
  options?: AddEventListenerOptions | EventListenerOptions,
): void => {
  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    if ("undefined" === typeof globalThis) {
      return;
    }

    globalThis.addEventListener(type, listener, {
      signal,
      ...options,
    });

    return () => {
      controller.abort();
    };
  }, [listener, options, type]);
};
