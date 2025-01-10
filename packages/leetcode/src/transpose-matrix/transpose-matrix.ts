import get from "lodash/get.js";

// Time: O(w*h)
// Space: O(w*h)
export const transposeMatrix = (
  matrix: number[][],
) => {
  const transposedMatrix: number[][] = [];

  for (let index = 0; index < get(matrix, [0]).length; index += 1) {
    const newRow: number[] = [];

    for (let _index = 0; _index < matrix.length; _index += 1) {
      newRow.push(get(matrix, [_index, index]));
    }

    transposedMatrix.push(newRow);
  }

  return transposedMatrix;
};

