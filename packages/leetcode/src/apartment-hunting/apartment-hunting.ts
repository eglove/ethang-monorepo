import get from "lodash/get.js";

type Block = Record<string, boolean>;

const distanceBetween = (a: number, b: number) => {
  return Math.abs(a - b);
};

const getIndexAtMinValue = (array: number[]) => {
  let minIndex = 0;
  let minValue = Number.POSITIVE_INFINITY;

  for (const [index, value] of array.entries()) {
    const currentValue = value;

    if (currentValue < minValue) {
      minValue = currentValue;
      minIndex = index;
    }
  }

  return minIndex;
};

export const apartmentHunting = (blocks: Block[], requirements: string[]) => {
  const maxDistancesAtBlocks = Array.from({ length: blocks.length }, () => {
    return Number.NEGATIVE_INFINITY;
  });

  for (const [index] of blocks.entries()) {
    for (const requirement of requirements) {
      let closestRequirementDistance = Number.POSITIVE_INFINITY;

      for (const [_index, _block] of blocks.entries()) {
        // eslint-disable-next-line sonar/nested-control-flow
        if (get(_block, [requirement])) {
          closestRequirementDistance = Math.min(
            closestRequirementDistance,
            distanceBetween(index, _index),
          );
        }
      }

      maxDistancesAtBlocks[index] = Math.max(
        get(maxDistancesAtBlocks, [index], Number.NEGATIVE_INFINITY),
        closestRequirementDistance,
      );
    }
  }

  return getIndexAtMinValue(maxDistancesAtBlocks);
};
