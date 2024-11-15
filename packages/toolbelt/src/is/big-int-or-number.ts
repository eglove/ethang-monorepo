import isNumber from "lodash/isNumber.js";
import isString from "lodash/isString.js";

export const isBigIntOrNumber = (value: unknown): value is bigint | number => {
  // eslint-disable-next-line lodash/prefer-lodash-typecheck
  if ((isNumber(value) || "bigint" === typeof value) && !Number.isNaN(value)) {
    return true;
  }

  if (isString(value)) {
    return (/^-?(?:\d+(?:\.\d*)?|\.\d+)$/u).test(value);
  }

  return false;
};
