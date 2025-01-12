import { bench } from "vitest";

import {
  missingNumberBitwise,
  missingNumbers,
  missingNumbersMathTrick,
  missingNumbersSet,
} from "./missing-numbers.js";

const data = Array.from({ length: 100_000 }, (_, index) => {
  return index + 1;
});

bench("missingNumbers", () => {
  missingNumbers(data);
});

bench("missingNumbersSet", () => {
  missingNumbersSet(data);
});

bench("missingNumbersMathTrick", () => {
  missingNumbersMathTrick(data);
});

bench("missingNumberBitwise", () => {
  missingNumberBitwise(data);
});
