import { bench } from "vitest";

import { generateDocument, generateDocumentMap } from "./generate-document.js";

bench("generateDocument", () => {
  // eslint-disable-next-line cspell/spellchecker
  generateDocument("Bste!hetsi ogEAxpelrt x ", "AlgoExpert is the Best!");
});

bench("generateDocumentMap", () => {
  // eslint-disable-next-line cspell/spellchecker
  generateDocumentMap("Bste!hetsi ogEAxpelrt x ", "AlgoExpert is the Best!");
});
