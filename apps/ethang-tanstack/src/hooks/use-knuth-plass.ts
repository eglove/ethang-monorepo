// @ts-expect-error no types
import enUsPatterns from "hyphenation.en-us";
import { useLayoutEffect } from "react";
import { createHyphenator, justifyContent } from "tex-linebreak";

// eslint-disable-next-line @typescript-eslint/no-unsafe-argument
const hyphenate = createHyphenator(enUsPatterns);

export const useKnuthPlass = (querySelector = "p") => {
  useLayoutEffect(() => {
    const elements = [...globalThis.document.querySelectorAll(querySelector)];
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
    justifyContent(elements as HTMLElement[], hyphenate);
  }, []);
};
