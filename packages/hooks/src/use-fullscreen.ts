import { type MutableRefObject, useState } from "react";

import { useEventListener } from "./use-event-listener.ts";

type UseFullscreenReturn = {
  closeFullScreen: () => void;
  fullScreen: boolean;
  openFullScreen: () => void;
  toggle: () => void;
};

const closeFullScreen = (): void => {
  document.exitFullscreen().catch((exitFullscreenError: unknown) => {
    console.error(exitFullscreenError);
  });
};

export const useFullscreen = (
  reference: MutableRefObject<HTMLElement>,
): UseFullscreenReturn => {
  const initialState =
    "undefined" === typeof globalThis
      ? false
      : Boolean(document.fullscreenElement);
  const [fullScreen, setFullScreen] = useState(initialState);

  const openFullScreen = (): void => {
    reference.current
      .requestFullscreen()
      .catch((requestFullscreenError: unknown) => {
        console.error(requestFullscreenError);
      });
  };

  useEventListener("fullscreenchange", () => {
    setFullScreen(document.fullscreenElement === reference.current);
  });

  return {
    closeFullScreen,
    fullScreen,
    openFullScreen,
    toggle: fullScreen
      ? closeFullScreen
      : openFullScreen,
  };
};
