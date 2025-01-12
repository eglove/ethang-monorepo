import filter from "lodash/filter.js";
import get from "lodash/get.js";

const getDishes = (
  dishes: number[],
  type: "savory" | "sweet",
) => {
  return filter(dishes, (dish) => {
    if ("sweet" === type) {
      return 0 > dish;
    }

    return 0 < dish;
  }).toSorted((a, b) => {
    return Math.abs(a) - Math.abs(b);
  });
};

export const sweetAndSavory = (
  dishes: number[],
  target: number,
) => {
  const sweet = getDishes(dishes, "sweet");
  const savory = getDishes(dishes, "savory");
  let bestPair: [number, number] = [0, 0];
  let bestDifference = Number.POSITIVE_INFINITY;
  let sweetIndex = 0;
  let savoryIndex = 0;

  while (sweetIndex < sweet.length && savoryIndex < savory.length) {
    const sweetDish = get(sweet, [sweetIndex]);
    const savoryDish = get(savory, [savoryIndex]);
    const currentSum = sweetDish + savoryDish;

    if (currentSum <= target) {
      const currentDifference = target - currentSum;

      if (currentDifference < bestDifference) {
        bestDifference = currentDifference;
        bestPair = [sweetDish, savoryDish];
      }

      savoryIndex += 1;
    } else {
      sweetIndex += 1;
    }
  }

  return bestPair;
};
