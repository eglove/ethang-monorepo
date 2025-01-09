import { bench } from "vitest";

import { isMatch, isMatchNoRecursion } from "./regular-expression-matching.ts";

bench("regularExpressionMatching", () => {
  isMatch("aab", "c*a*b");
});

bench("regularExpressionMatchingNoRecursion", () => {
  isMatchNoRecursion("aab", "c*a*b");
});
