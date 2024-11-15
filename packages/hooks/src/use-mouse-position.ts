import { useState } from "react";

import { useEventListener } from "./use-event-listener.ts";

type MousePosition = {
  mouseX?: number;
  mouseY?: number;
};

export const useMousePosition = (): MousePosition => {
  const [mousePosition, setMousePosition] = useState({
    mouseX: 0,
    mouseY: 0,
  });

  const updateMousePosition = (event: MouseEvent): void => {
    setMousePosition({
      mouseX: event.clientX,
      mouseY: event.clientY,
    });
  };

  useEventListener("mousemove", updateMousePosition);

  return mousePosition;
};
