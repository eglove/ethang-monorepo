export const zeroFromSubarray = (nums: number[]) => {
  let currentSum = 0;
  const sums = new Set<number>([0]);

  for (const value of nums) {
    currentSum += value;
    if (sums.has(currentSum)) {
      return true;
    }

    sums.add(currentSum);
  }

  return false;
};
