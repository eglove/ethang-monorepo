export const isNumbersEqual = (
  numberOne: number,
  numberTwo: number,
  epsilon = 1e-10,
) => {
  return Math.abs(numberOne - numberTwo) < epsilon;
};
