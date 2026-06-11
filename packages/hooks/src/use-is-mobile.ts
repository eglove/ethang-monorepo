import isUndefined from "lodash/isUndefined.js";
import { useEffect, useState } from "react";

export const useIsMobile = (mobileBreakPoint = 768) => {
  const [isMobile, setIsMobile] = useState(() => {
    // Need to safely check window first, isUndefined(window) might throw if window is entirely undeclared in the global scope? No, in TS it's declared.
    if ("undefined" === typeof globalThis || isUndefined(globalThis.window)) {
      return false;
    }

    return globalThis.window.innerWidth < mobileBreakPoint;
  });

  useEffect(() => {
    if (
      "undefined" === typeof globalThis ||
      isUndefined(globalThis.window) ||
      isUndefined(globalThis.matchMedia)
    ) {
      return;
    }

    const controller = new AbortController();
    const mediaQueryList = globalThis.matchMedia(
      `(max-width: ${mobileBreakPoint - 1}px)`
    );

    mediaQueryList.addEventListener(
      "change",
      () => {
        setIsMobile(globalThis.window.innerWidth < mobileBreakPoint);
      },
      { signal: controller.signal }
    );

    return () => {
      controller.abort();
    };
  }, [mobileBreakPoint]);

  return { isMobile };
};
