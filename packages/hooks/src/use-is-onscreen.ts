import { useEffect, useState } from "react";

type UseIsOnscreenReturn<ElementType> = [boolean, ElementType];

export const useIsOnscreen = <ElementType extends Element>(
  elementReference: ElementType,
): UseIsOnscreenReturn<ElementType> => {
  const [isOnscreen, setIsOnscreen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;

      if (entry) {
        setIsOnscreen(entry.isIntersecting);
      }
    });

    observer.observe(elementReference);

    return () => {
      observer.disconnect();
    };
  }, [elementReference]);

  return [isOnscreen, elementReference];
};
