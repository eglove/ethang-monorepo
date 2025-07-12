import replace from "lodash/replace.js";

export const noSlash = (value: string) => {
  return replace(value, "/", "");
};
