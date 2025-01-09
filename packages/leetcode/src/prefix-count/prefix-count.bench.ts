import { bench } from "vitest";

import { prefixCount } from "./prefix-count.ts";

bench("prefixCount", () => {
  prefixCount(["pay", "attention", "practice", "attend"], "at");
});
