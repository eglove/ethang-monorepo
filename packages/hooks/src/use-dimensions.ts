import { useCallback, useLayoutEffect, useState } from "react";

import { animationInterval } from "./use-animation-interval.ts";

type UseDimensionsProperties = {
  delay?: number;
  effectDeps: unknown[];
  initialDimensions?: DOMRect | Record<string, unknown>;
  liveMeasure?: boolean;
};

type UseDimensionsReturn = {
  dimensions: DOMRect | Record<string, unknown>;
  element: Element | undefined;
  reference: (node: Element) => void;
};

const DEFAULT_DELAY = 250;

export const useDimensions = ({
  delay = DEFAULT_DELAY,
  effectDeps = [],
  initialDimensions = {},
  liveMeasure = true,
}: UseDimensionsProperties): UseDimensionsReturn => {
  const [dimensions, setDimensions] = useState<
    DOMRect | Record<string, unknown>
  >(initialDimensions);
  const [element, setElement] = useState<Element | undefined>();

  const reference = useCallback((node: Element | undefined) => {
    setElement(node);
  }, []);

  const handleSetDimensions = (targetElement: Element, signal: AbortSignal) => {
    const boundingRect = targetElement.getBoundingClientRect();

    animationInterval(delay, signal, () => {
      setDimensions(boundingRect);
    });
  };

  // @ts-expect-error it's fine
  useLayoutEffect(() => {
    if (!element) {
      return;
    }

    const controller = new AbortController();

    const measure = (): void => {
      globalThis.requestAnimationFrame(() => {
        handleSetDimensions(element, controller.signal);
      });
    };

    measure();

    if (liveMeasure) {
      globalThis.addEventListener("resize", measure);
      globalThis.addEventListener("scroll", measure);

      return (): void => {
        globalThis.removeEventListener("resize", measure);
        globalThis.removeEventListener("scroll", measure);
        controller.abort();
      };
    }
  }, [element, liveMeasure, ...effectDeps]);

  return {
    dimensions,
    element,
    reference,
  };
};
