import { useEffect, type useRef, useState } from "react";

type UseIsOnscreenReturn<ElementType,> = [boolean, ElementType];

export const useIsOnscreen = <ElementType extends ReturnType<typeof useRef>,>(
  elementReference: ElementType,
): UseIsOnscreenReturn<ElementType> => {
  const [isOnscreen, setIsOnscreen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;

      setIsOnscreen(entry.isIntersecting);
    });

    observer.observe(elementReference as unknown as HTMLElement);

    return () => {
      observer.disconnect();
    };
  }, [elementReference]);

  return [isOnscreen, elementReference];
};
