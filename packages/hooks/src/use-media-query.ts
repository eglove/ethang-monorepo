import { useEffect, useState } from "react";

export const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => {
    return globalThis.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = globalThis.matchMedia(query);
    const controller = new AbortController();

    setMatches(mediaQuery.matches);

    mediaQuery.addEventListener(
      "change",
      (event) => {
        setMatches(event.matches);
      },
      { signal: controller.signal },
    );

    return () => {
      controller.abort();
    };
  }, []);

  return matches;
};
