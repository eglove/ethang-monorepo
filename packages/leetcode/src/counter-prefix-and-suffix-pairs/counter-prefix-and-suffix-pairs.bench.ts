import { bench } from "vitest";

import { countPrefixSuffixPairs } from "./counter-prefix-and-suffix-pairs.ts";

bench("countPrefixSuffixPairs", () => {
  // cspell:disable-next-line
  countPrefixSuffixPairs(["a", "aba", "ababa", "aa"]);
});
