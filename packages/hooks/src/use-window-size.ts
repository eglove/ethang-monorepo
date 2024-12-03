import { useEffect, useState } from "react";

const isBrowser = "undefined" !== typeof globalThis;

export const useWindowSize = (
  initialWidth = Number.POSITIVE_INFINITY,
  initialHeight = Number.POSITIVE_INFINITY,
): {
  height: number;
  width: number;
} => {
  const [state, setState] = useState<{
    height: number;
    width: number;
  }>({
    height: isBrowser
      ? globalThis.innerHeight
      : initialHeight,
    width: isBrowser
      ? globalThis.innerWidth
      : initialWidth,
  });

  // @ts-expect-error doesn't return
  useEffect(() => {
    if (isBrowser) {
      const handler = (): void => {
        setState({
          height: globalThis.innerHeight,
          width: globalThis.innerWidth,
        });
      };

      globalThis.addEventListener("resize", handler);

      return (): void => {
        globalThis.removeEventListener("resize", handler);
      };
    }
  }, []);

  return state;
};
