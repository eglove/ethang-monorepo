/* eslint-disable cspell/spellchecker */
import { bench } from "vitest";

import { countPrefixSuffixPairs } from "./counter-prefix-and-suffix-pairs.ts";

bench("countPrefixSuffixPairs", () => {
  countPrefixSuffixPairs(["a", "aba", "ababa", "aa"]);
});
