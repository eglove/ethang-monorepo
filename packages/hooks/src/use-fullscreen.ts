import { type RefObject, useState } from "react";

import { useEventListener } from "./use-event-listener.ts";

type UseFullscreenReturn = {
  closeFullScreen: () => void;
  fullScreen: boolean;
  openFullScreen: () => void;
  toggle: () => void;
};

const closeFullScreen = (): void => {
  globalThis.document.exitFullscreen().catch((exitFullscreenError: unknown) => {
    globalThis.console.error(exitFullscreenError);
  });
};

export const useFullscreen = (
  reference: RefObject<HTMLElement>,
): UseFullscreenReturn => {
  const initialState =
    "undefined" === typeof globalThis
      ? false
      : Boolean(globalThis.document.fullscreenElement);
  const [fullScreen, setFullScreen] = useState(initialState);

  const openFullScreen = (): void => {
    reference.current
      .requestFullscreen()
      .catch((requestFullscreenError: unknown) => {
        globalThis.console.error(requestFullscreenError);
      });
  };

  useEventListener("fullscreenchange", () => {
    setFullScreen(globalThis.document.fullscreenElement === reference.current);
  });

  return {
    closeFullScreen,
    fullScreen,
    openFullScreen,
    toggle: fullScreen ? closeFullScreen : openFullScreen,
  };
};
