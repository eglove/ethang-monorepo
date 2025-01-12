type Coordinate = [number, number];

const pointToString = (point: Coordinate) => {
  return point.join(",");
};

export const countSquares = (points: Coordinate[]) => {
  const pointsSet = new Set<string>();

  for (const point of points) {
    pointsSet.add(pointToString(point));
  }

  let count = 0;

  for (const pointA of points) {
    for (const pointB of points) {
      if (pointA === pointB) {
        // eslint-disable-next-line no-continue
        continue;
      }

      const midpoint: Coordinate = [
        (pointA[0] + pointB[0]) / 2,
        (pointA[1] + pointB[1]) / 2,
      ];
      const xDistanceFromMId = pointA[0] - midpoint[0];
      const yDistanceFromMId = pointA[1] - midpoint[1];

      const pointC: Coordinate = [
        midpoint[0] + yDistanceFromMId,
        midpoint[1] - xDistanceFromMId,
      ];
      const pointD: Coordinate = [
        midpoint[0] - yDistanceFromMId,
        midpoint[1] + xDistanceFromMId,
      ];

      if (
        pointsSet.has(pointToString(pointC)) &&
        pointsSet.has(pointToString(pointD))
      ) {
        count += 1;
      }
    }
  }

  return count / 4;
};
