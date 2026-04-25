import { bench } from "vitest";

import { generateDocument, generateDocumentMap } from "./generate-document.js";

bench("generateDocument", () => {
  // cspell:disable-next-line
  generateDocument("Bste!hetsi ogEAxpelrt x ", "AlgoExpert is the Best!");
});

bench("generateDocumentMap", () => {
  // cspell:disable-next-line
  generateDocumentMap("Bste!hetsi ogEAxpelrt x ", "AlgoExpert is the Best!");
});
