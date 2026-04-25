import { bench } from "vitest";

import { generateDocument, generateDocumentMap } from "./generate-document.js";

bench("generateDocument", () => {
  generateDocument("Bste!hetsi ogEAxpelrt x ", "AlgoExpert is the Best!");
});

bench("generateDocumentMap", () => {
  generateDocumentMap("Bste!hetsi ogEAxpelrt x ", "AlgoExpert is the Best!");
});
