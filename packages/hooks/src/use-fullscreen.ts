import { type RefObject, useState } from "react";

import { useEventListener } from "./use-event-listener.ts";

type UseFullscreenReturn = {
  closeFullScreen: () => void;
  fullScreen: boolean;
  openFullScreen: () => void;
  toggle: () => void;
};

const exitFullscreen = async (): Promise<void> => {
  try {
    await globalThis.document.exitFullscreen();
  } catch {
    // Ignore error
  }
};

const requestFullscreen = async (
  element: HTMLElement | null
): Promise<void> => {
  if (null === element) {
    return;
  }

  try {
    await element.requestFullscreen();
  } catch {
    // Ignore error
  }
};

const closeFullScreen = (): void => {
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  exitFullscreen();
};

export const useFullscreen = (
  reference: RefObject<HTMLElement>
): UseFullscreenReturn => {
  const initialState =
    "undefined" === typeof globalThis
      ? false
      : Boolean(globalThis.document.fullscreenElement);
  const [fullScreen, setFullScreen] = useState(initialState);

  const openFullScreen = (): void => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    requestFullscreen(reference.current);
  };

  useEventListener("fullscreenchange", () => {
    setFullScreen(globalThis.document.fullscreenElement === reference.current);
  });

  return {
    closeFullScreen,
    fullScreen,
    openFullScreen,
    toggle: fullScreen ? closeFullScreen : openFullScreen
  };
};
