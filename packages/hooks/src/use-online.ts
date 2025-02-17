import { useEffect, useState } from "react";

type UseOnlineProperties = {
  onOffline?: () => void;
  onOnline?: () => void;
};

export const useOnline = (properties?: UseOnlineProperties) => {
  const [isOnline, setIsOnline] = useState(() => {
    // eslint-disable-next-line compat/compat
    return globalThis.navigator.onLine;
  });

  useEffect(() => {
    const controller = new AbortController();

    globalThis.addEventListener(
      "online",
      () => {
        setIsOnline(true);
        properties?.onOnline?.();
      },
      { signal: controller.signal },
    );

    globalThis.addEventListener(
      "offline",
      () => {
        setIsOnline(false);
        properties?.onOffline?.();
      },
      { signal: controller.signal },
    );

    return () => {
      controller.abort();
    };
  }, []);

  return { isOnline };
};
