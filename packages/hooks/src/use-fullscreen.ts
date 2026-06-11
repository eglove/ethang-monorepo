import { type RefObject, useState } from "react";

import { useEventListener } from "./use-event-listener.ts";

type UseFullscreenReturn = {
  closeFullScreen: () => void;
  fullScreen: boolean;
  openFullScreen: () => void;
  toggle: () => void;
};

const closeFullScreen = (): void => {
  // eslint-disable-next-line lodash/prefer-noop
  globalThis.document.exitFullscreen().catch((): void => {
    // Ignore error
  });
};

export const useFullscreen = (
  reference: RefObject<HTMLElement>
): UseFullscreenReturn => {
  const initialState =
    /* v8 ignore start */
    "undefined" === typeof globalThis
      ? false
      : Boolean(globalThis.document.fullscreenElement);
    /* v8 ignore stop */
  const [fullScreen, setFullScreen] = useState(initialState);

  const openFullScreen = (): void => {
    // eslint-disable-next-line lodash/prefer-noop
    reference.current
      /* v8 ignore next 2 */
      ?.requestFullscreen()
      .catch((): void => {
        // Ignore error
      });
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
