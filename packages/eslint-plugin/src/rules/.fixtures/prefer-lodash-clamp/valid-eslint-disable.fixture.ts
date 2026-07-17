// Anchor file for the `valid-eslint-disable` RuleTester case so ESLint's
// directive scanner has a real on-disk path to attach the disable to.
import clamp from "lodash/clamp.js";

const value: number = 0;
// eslint-disable-next-line rule-to-test/prefer-lodash-clamp
const next = Math.min(10, Math.max(0, value));
const clamped = clamp(value, 0, 10);

void next;
void clamped;