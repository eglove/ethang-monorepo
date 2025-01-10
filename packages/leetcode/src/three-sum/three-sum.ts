import get from "lodash/get.js";

const incrementLeft = (
  left: number,
  right: number,
  sorted: number[],
) => {
  let leftCopy = left;

  while (leftCopy < right && sorted[leftCopy] === sorted[leftCopy + 1]) {
    leftCopy += 1;
  }

  return leftCopy;
};

const incrementRight = (
  left: number,
  right: number,
  sorted: number[],
) => {
  let rightCopy = right;

  while (left < rightCopy && sorted[rightCopy] === sorted[rightCopy - 1]) {
    rightCopy -= 1;
  }

  return rightCopy;
};

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

        left = incrementLeft(left, right, sorted);
        right = incrementRight(left, right, sorted);

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
