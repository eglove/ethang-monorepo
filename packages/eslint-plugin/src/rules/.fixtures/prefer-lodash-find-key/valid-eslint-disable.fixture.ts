import keys from "lodash/keys.js"; // already lodash — not flagged by the umbrella rule's chain-detection.

import findKey from "lodash/findKey.js";

declare const object: Record<string, number>;

const first = keys(object).find((k) => {
  // eslint-disable-next-line rule-to-test/prefer-lodash-find-key
  return object[k] > 0;
});
void findKey(object, (v) => v > 0);
void first;