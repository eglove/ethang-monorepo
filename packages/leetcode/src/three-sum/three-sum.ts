import get from "lodash/get";

// eslint-disable-next-line sonar/cognitive-complexity
export const threeSum = (numbers: number[]) => {
  const sorted = numbers.toSorted((a, b) => {
    return a - b;
  });
  const result = [];

  for (let index = 0; index < sorted.length - 2; index += 1) {
    if (0 < index && sorted[index] === sorted[index - 1]) {
      // eslint-disable-next-line no-continue
      continue;
    }

    let left = index + 1;
    let right = sorted.length - 1;

    while (left < right) {
      const sum = get(sorted, index) +
        get(sorted, left) +
        get(sorted, right);

      if (0 === sum) {
        result.push([sorted[index], sorted[left], sorted[right]]);

        // eslint-disable-next-line sonar/nested-control-flow
        while (left < right && sorted[left] === sorted[left + 1]) {
          left += 1;
        }

        // eslint-disable-next-line sonar/nested-control-flow
        while (left < right && sorted[right] === sorted[right - 1]) {
          right -= 1;
        }

        left += 1;
        right += 1;
      } else if (0 > sum) {
        left += 1;
      } else {
        right -= 1;
      }
    }
  }

  return result;
};
