import get from "lodash/get.js";

// eslint-disable-next-line cspell/spellchecker
export const kadanesAlgorithm = (
  array: number[],
) => {
  let maxEndingHere = get(array, [0]);
  let maxSoFar = get(array, [0]);

  for (let index = 1; index < array.length; index += 1) {
    const number = get(array, [index]);
    maxEndingHere = Math.max(number, maxEndingHere + number);
    maxSoFar = Math.max(maxSoFar, maxEndingHere);
  }

  return maxSoFar;
};
