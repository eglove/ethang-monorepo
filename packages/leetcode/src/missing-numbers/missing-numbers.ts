/* eslint-disable no-bitwise */
import get from "lodash/get.js";
import includes from "lodash/includes.js";
import range from "lodash/range.js";
import sum from "lodash/sum.js";

export const missingNumbers = (nums: number[]) => {
  const result = [];

  for (let index = 1; index <= nums.length + 2; index += 1) {
    if (!includes(nums, index)) {
      result.push(index);
    }
  }

  return result;
};

export const missingNumbersSet = (nums: number[]) => {
  const includedNums = new Set(nums);

  const result: number[] = [];
  for (let index = 1; index <= nums.length + 2; index += 1) {
    if (!includedNums.has(index)) {
      result.push(index);
    }
  }

  return result;
};

export const missingNumbersMathTrick = (nums: number[]) => {
  let total = sum(range(1, nums.length + 3));

  for (const value of nums) {
    total -= value;
  }

  const averageMissingValue = Math.floor(total / 2);
  let foundFirstHalf = 0;
  let foundSecondHalf = 0;

  for (const value of nums) {
    if (value <= averageMissingValue) {
      foundFirstHalf += value;
    } else {
      foundSecondHalf += value;
    }
  }

  const expectedFirstHalf = sum(range(1, averageMissingValue + 1));
  const expectSecondHalf = sum(range(averageMissingValue + 1, nums.length + 3));

  return [
    expectedFirstHalf - foundFirstHalf,
    expectSecondHalf - foundSecondHalf,
  ];
};

export const missingNumberBitwise = (nums: number[]) => {
  let solutionXor = 0;
  for (let index = 0; index < nums.length + 3; index += 1) {
    solutionXor ^= index;
    if (index < nums.length) {
      solutionXor ^= get(nums, [index]);
    }
  }

  const solution: [number, number] = [0, 0];

  const setBit = solutionXor & -solutionXor;

  for (let index = 0; index < nums.length + 3; index += 1) {
    if (0 === (index & setBit)) {
      solution[0] ^= index;
    } else {
      solution[1] ^= index;
    }

    if (index < nums.length) {
      if (0 === (get(nums, [index]) & setBit)) {
        solution[0] ^= get(nums, [index]);
      } else {
        solution[1] ^= get(nums, [index]);
      }
    }
  }

  solution.sort((a, b) => {
    return a - b;
  });

  return solution;
};
