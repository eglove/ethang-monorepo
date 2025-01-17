import forEach from "lodash/forEach.js";
import get from "lodash/get.js";
import set from "lodash/set.js";
import values from "lodash/values.js";

const greatestCommonDivisor = (
  number1: number,
  number2: number,
) => {
  let a = number1;
  let b = number2;

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    if (0 === a) {
      return b;
    }

    if (0 === b) {
      return a;
    }

    const temporaryA = a;
    a = b;
    b = temporaryA % b;
  }
};

const getSlopeBetweenPoints = (
  point1: [number, number],
  point2: [number, number],
) => {
  const [x1, y1] = point1;
  const [x2, y2] = point2;
  let slope: [number, number] = [1, 0];

  if (x1 !== x2) {
    let xDiff = x1 - x2;
    let yDiff = y1 - y2;
    const gcd = greatestCommonDivisor(Math.abs(xDiff), Math.abs(yDiff));
    xDiff = Math.floor(xDiff / gcd);
    yDiff = Math.floor(yDiff / gcd);

    if (0 > xDiff) {
      xDiff *= -1;
      yDiff *= -1;
    }

    slope = [yDiff, xDiff];
  }

  return slope;
};

const createHashTableKeyForRational = (
  numerator: number,
  denominator: number,
) => {
  return `${numerator}:${denominator}`;
};

export const lineThroughPoints = (
  points: [number, number][],
) => {
  let maxNumbersOfPointsOnLine = 1;

  for (let index = 0; index < points.length; index += 1) {
    const point1 = get(points, [index]);
    const slopes: Record<string, number> = {};

    for (let _index = index + 1; _index < points.length; _index += 1) {
      const point2 = get(points, [_index]);
      const [rise, run] = getSlopeBetweenPoints(point1, point2);
      const slopeKey = createHashTableKeyForRational(rise, run);

      if (!(slopeKey in slopes)) {
        set(slopes, [slopeKey], 1);
      }

      set(slopes, [slopeKey], get(slopes, [slopeKey]) + 1);
    }

    let currentMaxNumberOfPointsOnLine = 0;
    forEach(values(slopes), (value) => {
      currentMaxNumberOfPointsOnLine = Math.max(
        value,
        currentMaxNumberOfPointsOnLine,
      );
    });

    maxNumbersOfPointsOnLine = Math.max(
      maxNumbersOfPointsOnLine,
      currentMaxNumberOfPointsOnLine,
    );
  }

  return maxNumbersOfPointsOnLine;
};
