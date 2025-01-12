import get from "lodash/get.js";

export const longestSubarrayWithSum = (
  array: number[],
  targetSum: number,
) => {
  let indices: [] | [number, number] = [];

  let currentSum = 0;
  let startingIndex = 0;
  let endingIndex = 0;

  while (endingIndex < array.length) {
    currentSum += get(array, [endingIndex]);

    while (startingIndex < endingIndex && currentSum > targetSum) {
      currentSum -= get(array, [startingIndex]);
      startingIndex += 1;
    }

    if (
      currentSum === targetSum &&
      (
        0 === indices.length ||
        get(indices, [1]) - get(indices, [0]) < endingIndex - startingIndex
      )
    ) {
      indices = [startingIndex, endingIndex];
    }

    endingIndex += 1;
  }

  return indices;
};
