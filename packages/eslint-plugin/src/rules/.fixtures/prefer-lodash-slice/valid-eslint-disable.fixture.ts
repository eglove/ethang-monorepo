// Anchor file for the `valid-eslint-disable` RuleTester case so ESLint's
// directive scanner has a real on-disk path to attach the disable to.
import take from "lodash/take.js";

const arr: number[] = [1, 2, 3];
// eslint-disable-next-line rule-to-test/prefer-lodash-take
const head = arr.slice(0, 2);
const taken = take(arr, 2);

void head;
void taken;
