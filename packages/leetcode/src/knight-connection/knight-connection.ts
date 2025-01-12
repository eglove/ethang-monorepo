import isNil from "lodash/isNil.js";

type Coordinate = [number, number];
type CoordinateWithDepth = [number, number, number];

const possibleMoves = [
  [-2, 1], [-1, 2], [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1],
] as const;

const positionToString = (position: Coordinate) => {
  return position.join(",");
};

export const knightConnection = (
  knightA: Coordinate,
  knightB: Coordinate,
) => {
  const queue: CoordinateWithDepth[] = [[...knightA, 0]];
  const visited = new Set(positionToString(knightA));

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  while (true) {
    const currentPosition = queue.shift();

    if (isNil(currentPosition)) {
      break;
    }

    if (
      currentPosition[0] === knightB[0] &&
      currentPosition[1] === knightB[1]
    ) {
      return Math.ceil(currentPosition[2] / 2);
    }

    for (const possibleMove of possibleMoves) {
      const position: Coordinate = [
        currentPosition[0] + possibleMove[0],
        currentPosition[1] + possibleMove[1],
      ];
      const positionString = positionToString(position);

      if (!visited.has(positionString)) {
        queue.push([...position, currentPosition[2] + 1]);
        visited.add(positionString);
      }
    }
  }

  return -1;
};
