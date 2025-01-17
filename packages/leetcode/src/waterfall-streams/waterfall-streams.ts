import get from "lodash/get.js";
import isNil from "lodash/isNil.js";
import map from "lodash/map.js";

export const waterfallStreams = (
  array: number[][],
  source: number,
  // eslint-disable-next-line sonar/cognitive-complexity
) => {
  let rowAbove = [...get(array, [0])];
  rowAbove[source] = -1;

  for (let row = 1; row < array.length; row += 1) {
    const currentRow = [...get(array, [row])];

    // eslint-disable-next-line sonar/too-many-break-or-continue-in-loop
    for (const [index, valueAbove] of rowAbove.entries()) {
      const hasWaterAbove = 0 > valueAbove;
      const hasBlock = 1 === currentRow[index];

      if (!hasWaterAbove) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (!hasBlock && !isNil(currentRow[index])) {
        currentRow[index] += valueAbove;
        // eslint-disable-next-line no-continue
        continue;
      }

      const splitWater = valueAbove / 2;

      let rightIndex = index;
      // eslint-disable-next-line sonar/too-many-break-or-continue-in-loop
      while (rightIndex + 1 < rowAbove.length) {
        rightIndex += 1;
        // eslint-disable-next-line sonar/nested-control-flow
        if (1 === rowAbove[rightIndex]) {
          break;
        }

        // eslint-disable-next-line sonar/nested-control-flow
        if (1 !== currentRow[rightIndex]) {
          // @ts-expect-error ignore
          currentRow[rightIndex] += splitWater;
          break;
        }
      }

      let leftIndex = index;
      // eslint-disable-next-line sonar/too-many-break-or-continue-in-loop
      while (0 <= leftIndex - 1) {
        leftIndex -= 1;
        // eslint-disable-next-line sonar/nested-control-flow
        if (1 === rowAbove[leftIndex]) {
          break;
        }

        // eslint-disable-next-line sonar/nested-control-flow
        if (1 !== currentRow[leftIndex]) {
          // @ts-expect-error ignore
          currentRow[leftIndex] += splitWater;
          break;
        }
      }
    }

    rowAbove = currentRow;
  }

  return map(rowAbove, (_number) => {
    return 0 > _number
      ? _number * -100
      : _number;
  });
};
