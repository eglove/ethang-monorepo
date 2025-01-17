import flow from "lodash/flow.js";
import get from "lodash/get.js";
import keys from "lodash/keys.js";
import map from "lodash/map.js";
import sortBy from "lodash/sortBy.js";

const initializeColumns = (
  points: [number, number][],
) => {
  const columns: Record<number, number[]> = {};

  for (const point of points) {
    const [x, y] = point;

    if (!columns[x]) {
      columns[x] = [];
    }
    columns[x].push(y);
  }

  return columns;
};

export const minimumAreaRectangle = (
  points: [number, number][],
) => {
  const columns = initializeColumns(points);
  let minimumAreaFound = Infinity;
  const edgeParallelToYAxis: Record<string, number> = {};

  const sortedColumns = flow(
    keys,
    (key) => {
      return map(key, Number);
    },
    (numbers) => {
      return sortBy(numbers);
    },
  )(columns);

  for (const sortedColumn of sortedColumns) {
    const yValuesInCurrentColumn = get(columns, [sortedColumn]).sort((a, b) => {
      return a - b;
    });

    for (
      let currentIndex = 0;
      currentIndex < yValuesInCurrentColumn.length;
      currentIndex += 1
    ) {
      const y2 = yValuesInCurrentColumn[currentIndex];

      for (
        let previousIndex = 0;
        previousIndex < currentIndex;
        previousIndex += 1
      ) {
        const y1 = yValuesInCurrentColumn[previousIndex];
        const pointString = `${y1}:${y2}`;

        // eslint-disable-next-line sonar/nested-control-flow
        if (pointString in edgeParallelToYAxis) {
          const currentArea =
              (sortedColumn - get(edgeParallelToYAxis, [pointString])) *
              (Number(y2) - Number(y1));

          minimumAreaFound = Math.min(minimumAreaFound, currentArea);
        }

        edgeParallelToYAxis[pointString] = sortedColumn;
      }
    }
  }

  return minimumAreaFound === Infinity
    ? 0
    : minimumAreaFound;
};

