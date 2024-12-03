import { useEffect, useState } from "react";

export const useIsMobile = (mobileBreakPoint = 768) => {
  const [isMobile, setIsMobile] = useState(() => {
    if ("undefined" === typeof globalThis) {
      return false;
    }

    return globalThis.window.innerWidth < mobileBreakPoint;
  });

  useEffect(() => {
    const controller = new AbortController();
    const mediaQueryList = globalThis.matchMedia(`(max-width: ${mobileBreakPoint - 1}px)`);

    mediaQueryList.addEventListener("change", () => {
      setIsMobile(globalThis.window.innerWidth < mobileBreakPoint);
    }, { signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, []);

  return { isMobile };
};
